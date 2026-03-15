import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';
export declare enum ConversationStatus {
    PENDING = "pending",
    ACTIVE = "active",
    ARCHIVED = "archived"
}
export declare class Conversation {
    id: string;
    status: ConversationStatus;
    initiatedFromPostId: string;
    initiatedFromCommentId: string;
    participants: ConversationParticipant[];
    messages: Message[];
    lastMessagePreview: string;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
