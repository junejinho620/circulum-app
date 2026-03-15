import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from './messages.service';
import { Repository } from 'typeorm';
import { ConversationParticipant } from '../../database/entities/conversation-participant.entity';
export declare class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private config;
    private messagesService;
    private partRepo;
    server: Server;
    private readonly logger;
    private userSockets;
    constructor(jwtService: JwtService, config: ConfigService, messagesService: MessagesService, partRepo: Repository<ConversationParticipant>);
    handleConnection(socket: Socket): Promise<void>;
    handleDisconnect(socket: Socket): void;
    handleJoinConversation(data: {
        conversationId: string;
    }, socket: Socket): Promise<{
        success: boolean;
    }>;
    handleLeaveConversation(data: {
        conversationId: string;
    }, socket: Socket): {
        success: boolean;
    };
    handleSendMessage(data: {
        conversationId: string;
        body: string;
    }, socket: Socket): Promise<{
        success: boolean;
        messageId: string;
    }>;
    handleTyping(data: {
        conversationId: string;
    }, socket: Socket): void;
    pushNotification(userId: string, payload: any): void;
    isUserOnline(userId: string): boolean;
}
