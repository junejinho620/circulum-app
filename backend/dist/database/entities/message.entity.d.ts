import { User } from './user.entity';
import { Conversation } from './conversation.entity';
export declare enum MessageStatus {
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    REMOVED = "removed"
}
export declare class Message {
    id: string;
    body: string;
    imageUrl: string;
    status: MessageStatus;
    sender: User;
    senderId: string;
    conversation: Conversation;
    conversationId: string;
    createdAt: Date;
}
