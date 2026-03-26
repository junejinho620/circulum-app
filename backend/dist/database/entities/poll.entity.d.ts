import { User } from './user.entity';
import { Community } from './community.entity';
import { PollOption } from './poll-option.entity';
import { PollVote } from './poll-vote.entity';
export declare enum PollType {
    SINGLE = "single",
    MULTIPLE = "multiple"
}
export declare enum PollStatus {
    ACTIVE = "active",
    CLOSED = "closed",
    REMOVED = "removed"
}
export declare class Poll {
    id: string;
    question: string;
    type: PollType;
    status: PollStatus;
    isAnonymous: boolean;
    totalVotes: number;
    endsAt: Date;
    author: User;
    authorId: string;
    community: Community;
    communityId: string;
    universityId: string;
    options: PollOption[];
    votes: PollVote[];
    createdAt: Date;
    updatedAt: Date;
}
