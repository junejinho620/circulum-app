import { Repository, DataSource } from 'typeorm';
import { Poll, PollStatus, PollType } from '../../database/entities/poll.entity';
import { PollOption } from '../../database/entities/poll-option.entity';
import { PollVote } from '../../database/entities/poll-vote.entity';
export interface CreatePollDto {
    question: string;
    options: string[];
    type?: PollType;
    communityId?: string;
    isAnonymous?: boolean;
    endsAt?: string;
}
export declare class PollsService {
    private pollRepo;
    private optionRepo;
    private voteRepo;
    private dataSource;
    constructor(pollRepo: Repository<Poll>, optionRepo: Repository<PollOption>, voteRepo: Repository<PollVote>, dataSource: DataSource);
    create(userId: string, universityId: string, dto: CreatePollDto): Promise<Poll>;
    findForUniversity(universityId: string, page?: number, limit?: number): Promise<{
        items: Poll[];
        total: number;
        page: number;
        limit: number;
    }>;
    findForCommunity(communityId: string, page?: number, limit?: number): Promise<{
        items: Poll[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(pollId: string, userId?: string): Promise<{
        userVotes: string[];
        id: string;
        question: string;
        type: PollType;
        status: PollStatus;
        isAnonymous: boolean;
        totalVotes: number;
        endsAt: Date;
        author: import("../../database/entities/user.entity").User;
        authorId: string;
        community: import("../../database/entities/community.entity").Community;
        communityId: string;
        universityId: string;
        options: PollOption[];
        votes: PollVote[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    vote(pollId: string, userId: string, optionIds: string[]): Promise<void>;
    close(pollId: string, userId: string): Promise<void>;
    delete(pollId: string, userId: string): Promise<void>;
}
