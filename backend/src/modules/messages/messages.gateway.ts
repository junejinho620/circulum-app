import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody,
  ConnectedSocket, WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { MessagesService, SendMessageDto } from './messages.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationParticipant } from '../../database/entities/conversation-participant.entity';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessagesGateway.name);

  // userId -> Set of socketIds
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private messagesService: MessagesService,
    @InjectRepository(ConversationParticipant)
    private partRepo: Repository<ConversationParticipant>,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });

      socket.data.userId = payload.sub;
      socket.data.handle = payload.handle;

      // Track user sockets
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub).add(socket.id);

      // Join personal room for targeted notifications
      socket.join(`user:${payload.sub}`);

      this.logger.log(`User ${payload.handle} connected (${socket.id})`);
    } catch (err) {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Socket disconnected: ${socket.id}`);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;
    const participant = await this.partRepo.findOne({
      where: { conversationId: data.conversationId, userId },
    });
    if (!participant) throw new WsException('Not a participant');

    socket.join(`conv:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    socket.leave(`conv:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; body: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId;

    try {
      const message = await this.messagesService.sendMessage(
        data.conversationId,
        { body: data.body },
        userId,
      );

      // Broadcast to all participants in the conversation room
      this.server.to(`conv:${data.conversationId}`).emit('new_message', {
        conversationId: data.conversationId,
        message: {
          id: message.id,
          body: message.body,
          senderId: userId,
          senderHandle: socket.data.handle,
          createdAt: message.createdAt,
        },
      });

      return { success: true, messageId: message.id };
    } catch (err) {
      throw new WsException(err.message);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    socket.to(`conv:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      handle: socket.data.handle,
    });
  }

  // Called externally to push real-time notifications
  pushNotification(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size > 0 : false;
  }
}
