import { PostHashtag } from './post-hashtag.entity';
export declare class Hashtag {
    id: string;
    name: string;
    usageCount: number;
    postHashtags: PostHashtag[];
    createdAt: Date;
}
