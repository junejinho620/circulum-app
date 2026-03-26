import { Repository } from 'typeorm';
import { Hashtag } from '../../database/entities/hashtag.entity';
import { PostHashtag } from '../../database/entities/post-hashtag.entity';
export declare class HashtagsService {
    private hashtagRepo;
    private postHashtagRepo;
    constructor(hashtagRepo: Repository<Hashtag>, postHashtagRepo: Repository<PostHashtag>);
    processPostHashtags(postId: string, text: string): Promise<void>;
    removePostHashtags(postId: string): Promise<void>;
    getTrending(limit?: number): Promise<Hashtag[]>;
    search(query: string, limit?: number): Promise<Hashtag[]>;
    getPostsByHashtag(hashtagName: string, page?: number, limit?: number): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        hashtag?: undefined;
    } | {
        hashtag: Hashtag;
        items: import("../../database/entities/post.entity").Post[];
        total: number;
        page: number;
        limit: number;
    }>;
    private extractHashtags;
}
