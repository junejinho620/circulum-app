import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Conversation, ConversationStatus,
} from '../../database/entities/conversation.entity';
import {
  ConversationParticipant, ParticipantRole,
} from '../../database/entities/conversation-participant.entity';
import { Message } from '../../database/entities/message.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';
import { IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class InitiateConversationDto {
  @IsUUID() recipientId: string;
  @IsString() @MaxLength(1000) initialMessage: string;
  @IsOptional() @IsUUID() fromPostId?: string;
  @IsOptional() @IsUUID() fromCommentId?: string;
}

export class SendMessageDto {
  @IsString() @MaxLength(5000) body: string;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation) private convRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant) private partRepo: Repository<ConversationParticipant>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async initiateConversation(dto: InitiateConversationDto, initiatorId: string) {
    if (dto.recipientId === initiatorId) {
      throw new BadRequestException('Cannot message yourself');
    }

    // Check if conversation already exists between these two users
    const existing = await this.dataSource.query(`
      SELECT c.id FROM conversations c
      INNER JOIN conversation_participants p1 ON p1."conversationId" = c.id AND p1."userId" = $1
      INNER JOIN conversation_participants p2 ON p2."conversationId" = c.id AND p2."userId" = $2
      WHERE p1."hasBlocked" = false AND p2."hasBlocked" = false
      LIMIT 1
    `, [initiatorId, dto.recipientId]);

    if (existing.length > 0) {
      // Return existing conversation
      return this.getConversationDetail(existing[0].id, initiatorId);
    }

    const conversation = await this.dataSource.transaction(async (manager) => {
      const conv = await manager.save(Conversation, {
        status: ConversationStatus.PENDING,
        initiatedFromPostId: dto.fromPostId,
        initiatedFromCommentId: dto.fromCommentId,
      });

      await manager.save(ConversationParticipant, [
        {
          conversationId: conv.id,
          userId: initiatorId,
          role: ParticipantRole.INITIATOR,
        },
        {
          conversationId: conv.id,
          userId: dto.recipientId,
          role: ParticipantRole.RECIPIENT,
        },
      ]);

      const message = await manager.save(Message, {
        conversationId: conv.id,
        senderId: initiatorId,
        body: dto.initialMessage,
      });

      await manager.update(Conversation, conv.id, {
        lastMessagePreview: dto.initialMessage.slice(0, 100),
        lastMessageAt: message.createdAt,
      });

      await manager.increment(
        ConversationParticipant,
        { conversationId: conv.id, userId: dto.recipientId },
        'unreadCount',
        1,
      );

      return conv;
    });

    // Notify recipient
    await this.notificationsService.create(
      dto.recipientId,
      NotificationType.MESSAGE_REQUEST,
      { conversationId: conversation.id },
    );

    return { conversationId: conversation.id, status: conversation.status };
  }

  async acceptConversation(conversationId: string, userId: string) {
    const participant = await this.partRepo.findOne({
      where: { conversationId, userId, role: ParticipantRole.RECIPIENT },
    });
    if (!participant) throw new NotFoundException('Conversation not found');

    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (conv.status !== ConversationStatus.PENDING) {
      return { message: 'Already accepted' };
    }

    await this.convRepo.update(conversationId, { status: ConversationStatus.ACTIVE });
    return { message: 'Conversation accepted' };
  }

  async sendMessage(conversationId: string, dto: SendMessageDto, senderId: string) {
    const conversation = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const senderParticipant = await this.partRepo.findOne({
      where: { conversationId, userId: senderId },
    });
    if (!senderParticipant) throw new ForbiddenException('Not a participant');
    if (senderParticipant.hasBlocked) throw new ForbiddenException('Conversation is blocked');

    if (conversation.status === ConversationStatus.PENDING) {
      // Only initiator can send while pending
      if (senderParticipant.role !== ParticipantRole.INITIATOR) {
        throw new ForbiddenException('Accept the conversation request to reply');
      }
    }

    const message = await this.dataSource.transaction(async (manager) => {
      const msg = await manager.save(Message, {
        conversationId,
        senderId,
        body: dto.body,
      });

      await manager.update(Conversation, conversationId, {
        lastMessagePreview: dto.body.slice(0, 100),
        lastMessageAt: msg.createdAt,
      });

      // Increment unread for other participant
      await manager.increment(
        ConversationParticipant,
        { conversationId, userId: senderParticipant.userId !== senderId ? senderId : undefined },
        'unreadCount',
        1,
      );

      return msg;
    });

    // Notify recipient
    const otherParticipant = await this.partRepo.findOne({
      where: { conversationId, userId: senderId === senderParticipant.userId
        ? undefined : senderId },
    });

    if (otherParticipant) {
      await this.notificationsService.create(
        otherParticipant.userId,
        NotificationType.NEW_MESSAGE,
        { conversationId, messagePreview: dto.body.slice(0, 50) },
      );
    }

    return message;
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const participant = await this.partRepo.findOne({
      where: { conversationId, userId },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    const [items, total] = await this.messageRepo.findAndCount({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'body', 'senderId', 'status', 'createdAt'],
    });

    // Mark as read
    await this.partRepo.update(
      { conversationId, userId },
      { unreadCount: 0, lastReadAt: new Date() },
    );

    return { items: items.reverse(), total, page, limit };
  }

  async getConversationList(userId: string, page = 1, limit = 20) {
    const [participants, total] = await this.partRepo.findAndCount({
      where: { userId, deletedAt: null },
      relations: ['conversation'],
      order: { conversation: { lastMessageAt: 'DESC' } },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: participants, total, page, limit };
  }

  async blockConversation(conversationId: string, userId: string) {
    await this.partRepo.update({ conversationId, userId }, { hasBlocked: true });
    return { message: 'Conversation blocked' };
  }

  async deleteConversation(conversationId: string, userId: string) {
    await this.partRepo.update(
      { conversationId, userId },
      { deletedAt: new Date() },
    );
    return { message: 'Conversation deleted' };
  }

  private async getConversationDetail(conversationId: string, userId: string) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    const participant = await this.partRepo.findOne({ where: { conversationId, userId } });
    return { conversationId, status: conv.status, unreadCount: participant.unreadCount };
  }
}
