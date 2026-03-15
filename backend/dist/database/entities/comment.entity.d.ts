import { User } from './user.entity';
import { Post } from './post.entity';
import { Vote } from './vote.entity';
import { Report } from './report.entity';
export declare enum CommentStatus {
    ACTIVE = "active",
    REMOVED = "removed"
}
export declare class Comment {
    id: string;
    body: string;
    status: CommentStatus;
    upvotes: number;
    downvotes: number;
    replyCount: number;
    author: User;
    authorId: string;
    post: Post;
    postId: string;
    parent: Comment;
    parentId: string;
    replies: Comment[];
    votes: Vote[];
    reports: Report[];
    removedReason: string;
    createdAt: Date;
    updatedAt: Date;
}
