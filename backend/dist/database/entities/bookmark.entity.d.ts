import { User } from './user.entity';
import { Post } from './post.entity';
export declare class Bookmark {
    id: string;
    user: User;
    userId: string;
    post: Post;
    postId: string;
    createdAt: Date;
}
