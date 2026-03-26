import { Post } from './post.entity';
import { Hashtag } from './hashtag.entity';
export declare class PostHashtag {
    id: string;
    post: Post;
    postId: string;
    hashtag: Hashtag;
    hashtagId: string;
}
