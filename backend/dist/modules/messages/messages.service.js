"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = exports.SendMessageDto = exports.InitiateConversationDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const conversation_entity_1 = require("../../database/entities/conversation.entity");
const conversation_participant_entity_1 = require("../../database/entities/conversation-participant.entity");
const message_entity_1 = require("../../database/entities/message.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../../database/entities/notification.entity");
const class_validator_1 = require("class-validator");
class InitiateConversationDto {
}
exports.InitiateConversationDto = InitiateConversationDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InitiateConversationDto.prototype, "recipientId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], InitiateConversationDto.prototype, "initialMessage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InitiateConversationDto.prototype, "fromPostId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InitiateConversationDto.prototype, "fromCommentId", void 0);
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], SendMessageDto.prototype, "body", void 0);
let MessagesService = class MessagesService {
    constructor(convRepo, partRepo, messageRepo, notificationsService, dataSource) {
        this.convRepo = convRepo;
        this.partRepo = partRepo;
        this.messageRepo = messageRepo;
        this.notificationsService = notificationsService;
        this.dataSource = dataSource;
    }
    async initiateConversation(dto, initiatorId) {
        if (dto.recipientId === initiatorId) {
            throw new common_1.BadRequestException('Cannot message yourself');
        }
        const existing = await this.dataSource.query(`
      SELECT c.id FROM conversations c
      INNER JOIN conversation_participants p1 ON p1."conversationId" = c.id AND p1."userId" = $1
      INNER JOIN conversation_participants p2 ON p2."conversationId" = c.id AND p2."userId" = $2
      WHERE p1."hasBlocked" = false AND p2."hasBlocked" = false
      LIMIT 1
    `, [initiatorId, dto.recipientId]);
        if (existing.length > 0) {
            return this.getConversationDetail(existing[0].id, initiatorId);
        }
        const conversation = await this.dataSource.transaction(async (manager) => {
            const conv = await manager.save(conversation_entity_1.Conversation, {
                status: conversation_entity_1.ConversationStatus.PENDING,
                initiatedFromPostId: dto.fromPostId,
                initiatedFromCommentId: dto.fromCommentId,
            });
            await manager.save(conversation_participant_entity_1.ConversationParticipant, [
                {
                    conversationId: conv.id,
                    userId: initiatorId,
                    role: conversation_participant_entity_1.ParticipantRole.INITIATOR,
                },
                {
                    conversationId: conv.id,
                    userId: dto.recipientId,
                    role: conversation_participant_entity_1.ParticipantRole.RECIPIENT,
                },
            ]);
            const message = await manager.save(message_entity_1.Message, {
                conversationId: conv.id,
                senderId: initiatorId,
                body: dto.initialMessage,
            });
            await manager.update(conversation_entity_1.Conversation, conv.id, {
                lastMessagePreview: dto.initialMessage.slice(0, 100),
                lastMessageAt: message.createdAt,
            });
            await manager.increment(conversation_participant_entity_1.ConversationParticipant, { conversationId: conv.id, userId: dto.recipientId }, 'unreadCount', 1);
            return conv;
        });
        await this.notificationsService.create(dto.recipientId, notification_entity_1.NotificationType.MESSAGE_REQUEST, { conversationId: conversation.id });
        return { conversationId: conversation.id, status: conversation.status };
    }
    async acceptConversation(conversationId, userId) {
        const participant = await this.partRepo.findOne({
            where: { conversationId, userId, role: conversation_participant_entity_1.ParticipantRole.RECIPIENT },
        });
        if (!participant)
            throw new common_1.NotFoundException('Conversation not found');
        const conv = await this.convRepo.findOne({ where: { id: conversationId } });
        if (conv.status !== conversation_entity_1.ConversationStatus.PENDING) {
            return { message: 'Already accepted' };
        }
        await this.convRepo.update(conversationId, { status: conversation_entity_1.ConversationStatus.ACTIVE });
        return { message: 'Conversation accepted' };
    }
    async sendMessage(conversationId, dto, senderId) {
        const conversation = await this.convRepo.findOne({ where: { id: conversationId } });
        if (!conversation)
            throw new common_1.NotFoundException('Conversation not found');
        const senderParticipant = await this.partRepo.findOne({
            where: { conversationId, userId: senderId },
        });
        if (!senderParticipant)
            throw new common_1.ForbiddenException('Not a participant');
        if (senderParticipant.hasBlocked)
            throw new common_1.ForbiddenException('Conversation is blocked');
        if (conversation.status === conversation_entity_1.ConversationStatus.PENDING) {
            if (senderParticipant.role !== conversation_participant_entity_1.ParticipantRole.INITIATOR) {
                throw new common_1.ForbiddenException('Accept the conversation request to reply');
            }
        }
        const message = await this.dataSource.transaction(async (manager) => {
            const msg = await manager.save(message_entity_1.Message, {
                conversationId,
                senderId,
                body: dto.body,
            });
            await manager.update(conversation_entity_1.Conversation, conversationId, {
                lastMessagePreview: dto.body.slice(0, 100),
                lastMessageAt: msg.createdAt,
            });
            await manager.increment(conversation_participant_entity_1.ConversationParticipant, { conversationId, userId: senderParticipant.userId !== senderId ? senderId : undefined }, 'unreadCount', 1);
            return msg;
        });
        const otherParticipant = await this.partRepo.findOne({
            where: { conversationId, userId: senderId === senderParticipant.userId
                    ? undefined : senderId },
        });
        if (otherParticipant) {
            await this.notificationsService.create(otherParticipant.userId, notification_entity_1.NotificationType.NEW_MESSAGE, { conversationId, messagePreview: dto.body.slice(0, 50) });
        }
        return message;
    }
    async getMessages(conversationId, userId, page = 1, limit = 50) {
        const participant = await this.partRepo.findOne({
            where: { conversationId, userId },
        });
        if (!participant)
            throw new common_1.ForbiddenException('Not a participant');
        const [items, total] = await this.messageRepo.findAndCount({
            where: { conversationId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            select: ['id', 'body', 'senderId', 'status', 'createdAt'],
        });
        await this.partRepo.update({ conversationId, userId }, { unreadCount: 0, lastReadAt: new Date() });
        return { items: items.reverse(), total, page, limit };
    }
    async getConversationList(userId, page = 1, limit = 20) {
        const [participants, total] = await this.partRepo.findAndCount({
            where: { userId, deletedAt: null },
            relations: ['conversation'],
            order: { conversation: { lastMessageAt: 'DESC' } },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items: participants, total, page, limit };
    }
    async blockConversation(conversationId, userId) {
        await this.partRepo.update({ conversationId, userId }, { hasBlocked: true });
        return { message: 'Conversation blocked' };
    }
    async deleteConversation(conversationId, userId) {
        await this.partRepo.update({ conversationId, userId }, { deletedAt: new Date() });
        return { message: 'Conversation deleted' };
    }
    async getConversationDetail(conversationId, userId) {
        const conv = await this.convRepo.findOne({ where: { id: conversationId } });
        const participant = await this.partRepo.findOne({ where: { conversationId, userId } });
        return { conversationId, status: conv.status, unreadCount: participant.unreadCount };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __param(1, (0, typeorm_1.InjectRepository)(conversation_participant_entity_1.ConversationParticipant)),
    __param(2, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        typeorm_2.DataSource])
], MessagesService);
//# sourceMappingURL=messages.service.js.map