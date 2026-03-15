import { User } from '../../database/entities/user.entity';
import { MessagesService, InitiateConversationDto, SendMessageDto } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getList(user: User, page: number): Promise<{
        items: import("../../database/entities/conversation-participant.entity").ConversationParticipant[];
        total: number;
        page: number;
        limit: number;
    }>;
    initiate(dto: InitiateConversationDto, user: User): Promise<{
        conversationId: string;
        status: import("../../database/entities/conversation.entity").ConversationStatus;
        unreadCount: number;
    } | {
        conversationId: string;
        status: import("../../database/entities/conversation.entity").ConversationStatus;
    }>;
    accept(id: string, user: User): Promise<{
        message: string;
    }>;
    getMessages(id: string, user: User, page: number, limit: number): Promise<{
        items: import("../../database/entities/message.entity").Message[];
        total: number;
        page: number;
        limit: number;
    }>;
    sendMessage(id: string, dto: SendMessageDto, user: User): Promise<{
        conversationId: string;
        senderId: string;
        body: string;
    } & import("../../database/entities/message.entity").Message>;
    block(id: string, user: User): Promise<{
        message: string;
    }>;
    deleteConversation(id: string, user: User): Promise<{
        message: string;
    }>;
}
