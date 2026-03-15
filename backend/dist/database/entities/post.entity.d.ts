import { User } from './user.entity';
import { Community } from './community.entity';
import { Comment } from './comment.entity';
import { Vote } from './vote.entity';
import { Report } from './report.entity';
export declare enum PostCategory {
    GENERAL = "general",
    STUDY = "study",
    MEME = "meme",
    EVENT = "event",
    BUY_SELL = "buy_sell",
    LOST_FOUND = "lost_found"
}
export declare enum PostStatus {
    ACTIVE = "active",
    REMOVED = "removed",
    FLAGGED = "flagged"
}
export declare class Post {
    id: string;
    title: string;
    body: string;
    imageUrls: string[];
    category: PostCategory;
    status: PostStatus;
    hotScore: number;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    author: User;
    authorId: string;
    community: Community;
    communityId: string;
    universityId: string;
    comments: Comment[];
    votes: Vote[];
    reports: Report[];
    isLocked: boolean;
    removedReason: string;
    createdAt: Date;
    updatedAt: Date;
}
