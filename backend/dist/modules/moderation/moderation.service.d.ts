import { Repository, DataSource } from 'typeorm';
import { Report, ReportType, ReportReason } from '../../database/entities/report.entity';
import { ModerationAction, ModerationActionType } from '../../database/entities/moderation-action.entity';
import { User } from '../../database/entities/user.entity';
import { Post } from '../../database/entities/post.entity';
import { Comment } from '../../database/entities/comment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
export declare class CreateReportDto {
    type: ReportType;
    reason: ReportReason;
    details?: string;
    postId?: string;
    commentId?: string;
    messageId?: string;
    targetUserId?: string;
}
export declare class TakeActionDto {
    type: ModerationActionType;
    reason: string;
    targetUserId: string;
    contentId?: string;
    contentType?: string;
    reportId?: string;
    suspendUntil?: string;
}
export declare class ModerationService {
    private reportRepo;
    private actionRepo;
    private userRepo;
    private postRepo;
    private commentRepo;
    private notificationsService;
    private emailService;
    private dataSource;
    constructor(reportRepo: Repository<Report>, actionRepo: Repository<ModerationAction>, userRepo: Repository<User>, postRepo: Repository<Post>, commentRepo: Repository<Comment>, notificationsService: NotificationsService, emailService: EmailService, dataSource: DataSource);
    createReport(dto: CreateReportDto, reporterId: string): Promise<{
        message: string;
    }>;
    getPendingReports(page?: number, limit?: number): Promise<{
        items: Report[];
        total: number;
        page: number;
        limit: number;
    }>;
    getReport(id: string): Promise<Report>;
    takeAction(dto: TakeActionDto, moderatorId: string): Promise<{
        message: string;
    }>;
    dismissReport(reportId: string, moderatorId: string): Promise<{
        message: string;
    }>;
    getModerationHistory(userId: string): Promise<ModerationAction[]>;
    getStats(): Promise<{
        reports: {
            pending: number;
            resolved: number;
            dismissed: number;
        };
        users: {
            warned: number;
            suspended: number;
            banned: number;
        };
    }>;
}
