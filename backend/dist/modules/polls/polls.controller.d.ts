import { User } from '../../database/entities/user.entity';
import { PollsService, CreatePollDto } from './polls.service';
export declare class PollsController {
    private readonly pollsService;
    constructor(pollsService: PollsService);
    create(user: User, dto: CreatePollDto): Promise<import("../../database/entities/poll.entity").Poll>;
    findAll(user: User, page: number, limit: number, communityId?: string): Promise<{
        items: import("../../database/entities/poll.entity").Poll[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(user: User, id: string): Promise<{
        userVotes: string[];
        id: string;
        question: string;
        type: import("../../database/entities/poll.entity").PollType;
        status: import("../../database/entities/poll.entity").PollStatus;
        isAnonymous: boolean;
        totalVotes: number;
        endsAt: Date;
        author: User;
        authorId: string;
        community: import("../../database/entities/community.entity").Community;
        communityId: string;
        universityId: string;
        options: import("../../database/entities/poll-option.entity").PollOption[];
        votes: import("../../database/entities/poll-vote.entity").PollVote[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    vote(user: User, id: string, body: {
        optionIds: string[];
    }): Promise<void>;
    close(user: User, id: string): Promise<void>;
    remove(user: User, id: string): Promise<void>;
}
