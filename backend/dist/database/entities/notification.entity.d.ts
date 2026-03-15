import { User } from './user.entity';
export declare enum NotificationType {
    COMMENT_REPLY = "comment_reply",
    POST_COMMENT = "post_comment",
    NEW_MESSAGE = "new_message",
    MESSAGE_REQUEST = "message_request",
    VOTE_MILESTONE = "vote_milestone",
    MODERATION_WARNING = "moderation_warning",
    MODERATION_SUSPENSION = "moderation_suspension",
    MODERATION_BAN = "moderation_ban"
}
export declare class Notification {
    id: string;
    type: NotificationType;
    payload: Record<string, any>;
    isRead: boolean;
    user: User;
    userId: string;
    createdAt: Date;
}
