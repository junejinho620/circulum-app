import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
export declare enum VoteValue {
    UP = 1,
    DOWN = -1
}
export declare class Vote {
    id: string;
    value: number;
    user: User;
    userId: string;
    post: Post;
    postId: string;
    comment: Comment;
    commentId: string;
    createdAt: Date;
}
