import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
export declare enum ReportType {
    POST = "post",
    COMMENT = "comment",
    MESSAGE = "message",
    USER = "user"
}
export declare enum ReportReason {
    HARASSMENT = "harassment",
    SPAM = "spam",
    HATE_SPEECH = "hate_speech",
    MISINFORMATION = "misinformation",
    ILLEGAL_CONTENT = "illegal_content",
    DOXXING = "doxxing",
    OTHER = "other"
}
export declare enum ReportStatus {
    PENDING = "pending",
    REVIEWING = "reviewing",
    RESOLVED = "resolved",
    DISMISSED = "dismissed"
}
export declare class Report {
    id: string;
    type: ReportType;
    reason: ReportReason;
    details: string;
    status: ReportStatus;
    reporter: User;
    reporterId: string;
    post: Post;
    postId: string;
    comment: Comment;
    commentId: string;
    messageId: string;
    targetUserId: string;
    resolvedBy: string;
    resolution: string;
    createdAt: Date;
    updatedAt: Date;
}
