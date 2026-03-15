import { Repository } from 'typeorm';
import { Post } from '../../database/entities/post.entity';
export declare class FeedService {
    private postRepo;
    private readonly logger;
    constructor(postRepo: Repository<Post>);
    recalculateHotScores(): Promise<void>;
    private computeHotScore;
}
