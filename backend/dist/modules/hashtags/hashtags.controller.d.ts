import { HashtagsService } from './hashtags.service';
export declare class HashtagsController {
    private readonly hashtagsService;
    constructor(hashtagsService: HashtagsService);
    getTrending(limit: number): Promise<import("../../database/entities/hashtag.entity").Hashtag[]>;
    search(query: string): any[] | Promise<import("../../database/entities/hashtag.entity").Hashtag[]>;
    getPostsByHashtag(name: string, page: number, limit: number): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        hashtag?: undefined;
    } | {
        hashtag: import("../../database/entities/hashtag.entity").Hashtag;
        items: import("../../database/entities/post.entity").Post[];
        total: number;
        page: number;
        limit: number;
    }>;
}
