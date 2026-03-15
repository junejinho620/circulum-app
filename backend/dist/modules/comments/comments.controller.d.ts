import { User } from '../../database/entities/user.entity';
import { CommentsService, CreateCommentDto } from './comments.service';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    create(postId: string, dto: CreateCommentDto, user: User): Promise<import("../../database/entities/comment.entity").Comment>;
    getForPost(postId: string, page: number, limit: number): Promise<import("../../database/entities/comment.entity").Comment[]>;
    delete(commentId: string, user: User): Promise<void>;
}
