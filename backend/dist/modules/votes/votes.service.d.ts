import { Repository, DataSource } from 'typeorm';
import { Vote } from '../../database/entities/vote.entity';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class VoteDto {
    value: number;
    postId?: string;
    commentId?: string;
}
export declare class VotesService {
    private voteRepo;
    private postRepo;
    private commentRepo;
    private notificationsService;
    private dataSource;
    constructor(voteRepo: Repository<Vote>, postRepo: Repository<Post>, commentRepo: Repository<Comment>, notificationsService: NotificationsService, dataSource: DataSource);
    vote(dto: VoteDto, user: User): Promise<{
        success: boolean;
    }>;
    private voteOnPost;
    private voteOnComment;
}
