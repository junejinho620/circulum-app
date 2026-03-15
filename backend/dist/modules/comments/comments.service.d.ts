import { Repository, DataSource } from 'typeorm';
import { Comment } from '../../database/entities/comment.entity';
import { Post } from '../../database/entities/post.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class CreateCommentDto {
    body: string;
    parentId?: string;
}
export declare class CommentsService {
    private commentRepo;
    private postRepo;
    private notificationsService;
    private dataSource;
    constructor(commentRepo: Repository<Comment>, postRepo: Repository<Post>, notificationsService: NotificationsService, dataSource: DataSource);
    create(postId: string, dto: CreateCommentDto, author: User): Promise<Comment>;
    getForPost(postId: string, page?: number, limit?: number): Promise<Comment[]>;
    delete(id: string, userId: string): Promise<void>;
    private sendCommentNotifications;
}
