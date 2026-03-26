import { User } from './user.entity';
import { Poll } from './poll.entity';
import { PollOption } from './poll-option.entity';
export declare class PollVote {
    id: string;
    user: User;
    userId: string;
    poll: Poll;
    pollId: string;
    option: PollOption;
    optionId: string;
    createdAt: Date;
}
