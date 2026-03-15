import { User } from '../../database/entities/user.entity';
import { VotesService, VoteDto } from './votes.service';
export declare class VotesController {
    private readonly votesService;
    constructor(votesService: VotesService);
    vote(dto: VoteDto, user: User): Promise<{
        success: boolean;
    }>;
}
