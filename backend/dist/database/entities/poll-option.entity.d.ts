import { Poll } from './poll.entity';
import { PollVote } from './poll-vote.entity';
export declare class PollOption {
    id: string;
    text: string;
    voteCount: number;
    sortOrder: number;
    poll: Poll;
    pollId: string;
    votes: PollVote[];
}
