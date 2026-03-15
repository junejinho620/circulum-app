import { Repository, DataSource } from 'typeorm';
import { Conversation, ConversationStatus } from '../../database/entities/conversation.entity';
import { ConversationParticipant } from '../../database/entities/conversation-participant.entity';
import { Message } from '../../database/entities/message.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class InitiateConversationDto {
    recipientId: string;
    initialMessage: string;
    fromPostId?: string;
    fromCommentId?: string;
}
export declare class SendMessageDto {
    body: string;
}
export declare class MessagesService {
    private convRepo;
    private partRepo;
    private messageRepo;
    private notificationsService;
    private dataSource;
    constructor(convRepo: Repository<Conversation>, partRepo: Repository<ConversationParticipant>, messageRepo: Repository<Message>, notificationsService: NotificationsService, dataSource: DataSource);
    initiateConversation(dto: InitiateConversationDto, initiatorId: string): Promise<{
        conversationId: string;
        status: ConversationStatus;
        unreadCount: number;
    } | {
        conversationId: string;
        status: ConversationStatus;
    }>;
    acceptConversation(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    sendMessage(conversationId: string, dto: SendMessageDto, senderId: string): Promise<{
        conversationId: string;
        senderId: string;
        body: string;
    } & Message>;
    getMessages(conversationId: string, userId: string, page?: number, limit?: number): Promise<{
        items: Message[];
        total: number;
        page: number;
        limit: number;
    }>;
    getConversationList(userId: string, page?: number, limit?: number): Promise<{
        items: ConversationParticipant[];
        total: number;
        page: number;
        limit: number;
    }>;
    blockConversation(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    deleteConversation(conversationId: string, userId: string): Promise<{
        message: string;
    }>;
    private getConversationDetail;
}
