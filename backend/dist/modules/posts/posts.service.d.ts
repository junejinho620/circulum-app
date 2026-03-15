import { Repository, DataSource } from 'typeorm';
import { Post } from '../../database/entities/post.entity';
import { Community } from '../../database/entities/community.entity';
import { User } from '../../database/entities/user.entity';
import { CommunityMember } from '../../database/entities/community-member.entity';
import { Vote } from '../../database/entities/vote.entity';
import { CreatePostDto } from './dto/create-post.dto';
export type FeedSort = 'hot' | 'new' | 'top';
export declare class PostsService {
    private postRepo;
    private communityRepo;
    private memberRepo;
    private voteRepo;
    private dataSource;
    constructor(postRepo: Repository<Post>, communityRepo: Repository<Community>, memberRepo: Repository<CommunityMember>, voteRepo: Repository<Vote>, dataSource: DataSource);
    create(dto: CreatePostDto, author: User): Promise<Post>;
    findById(id: string, requestingUserId?: string): Promise<Post & {
        userVote?: number;
    }>;
    getFeedForCommunity(communityId: string, sort?: FeedSort, page?: number, limit?: number, requestingUserId?: string): Promise<{
        items: Post[];
        total: number;
        page: number;
        limit: number;
    }>;
    getCampusFeed(universityId: string, sort?: FeedSort, page?: number, limit?: number): Promise<{
        items: Post[];
        total: number;
        page: number;
        limit: number;
    }>;
    getPersonalizedFeed(userId: string, universityId: string, sort?: FeedSort, page?: number, limit?: number): Promise<{
        items: Post[];
        total: number;
        page: number;
        limit: number;
    }>;
    delete(id: string, userId: string): Promise<void>;
    recalculateHotScores(): Promise<void>;
    private applySorting;
    private computeHotScore;
}
