import { User } from './user.entity';
import { Conversation } from './conversation.entity';
export declare enum ParticipantRole {
    INITIATOR = "initiator",
    RECIPIENT = "recipient"
}
export declare class ConversationParticipant {
    id: string;
    user: User;
    userId: string;
    conversation: Conversation;
    conversationId: string;
    role: ParticipantRole;
    hasBlocked: boolean;
    unreadCount: number;
    lastReadAt: Date;
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
