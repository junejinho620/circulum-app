import { User } from './user.entity';
export declare enum ModerationActionType {
    WARN = "warn",
    REMOVE_CONTENT = "remove_content",
    SUSPEND = "suspend",
    BAN = "ban",
    UNBAN = "unban"
}
export declare class ModerationAction {
    id: string;
    type: ModerationActionType;
    reason: string;
    targetUser: User;
    targetUserId: string;
    moderatorId: string;
    contentId: string;
    contentType: string;
    reportId: string;
    expiresAt: Date;
    metadata: Record<string, any>;
    createdAt: Date;
}
