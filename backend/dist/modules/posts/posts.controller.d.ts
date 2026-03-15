import { User } from '../../database/entities/user.entity';
import { PostsService, FeedSort } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(dto: CreatePostDto, user: User): Promise<import("../../database/entities/post.entity").Post>;
    getCampusFeed(user: User, sort: FeedSort, page: number, limit: number): Promise<{
        items: import("../../database/entities/post.entity").Post[];
        total: number;
        page: number;
        limit: number;
    }>;
    getPersonalizedFeed(user: User, sort: FeedSort, page: number, limit: number): Promise<{
        items: import("../../database/entities/post.entity").Post[];
        total: number;
        page: number;
        limit: number;
    }>;
    getCommunityFeed(communityId: string, user: User, sort: FeedSort, page: number, limit: number): Promise<{
        items: import("../../database/entities/post.entity").Post[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string, user: User): Promise<import("../../database/entities/post.entity").Post & {
        userVote?: number;
    }>;
    delete(id: string, user: User): Promise<void>;
}
