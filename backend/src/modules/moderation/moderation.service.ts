import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Report, ReportStatus, ReportType, ReportReason } from '../../database/entities/report.entity';
import { ModerationAction, ModerationActionType } from '../../database/entities/moderation-action.entity';
import { User, UserStatus } from '../../database/entities/user.entity';
import { Post, PostStatus } from '../../database/entities/post.entity';
import { Comment, CommentStatus } from '../../database/entities/comment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';
import { EmailService } from '../notifications/email.service';
import {
  IsEnum, IsString, IsOptional, IsUUID, MaxLength, IsDateString,
} from 'class-validator';

export class CreateReportDto {
  @IsEnum(ReportType) type: ReportType;
  @IsEnum(ReportReason) reason: ReportReason;
  @IsOptional() @IsString() @MaxLength(1000) details?: string;
  @IsOptional() @IsUUID() postId?: string;
  @IsOptional() @IsUUID() commentId?: string;
  @IsOptional() @IsUUID() messageId?: string;
  @IsOptional() @IsUUID() targetUserId?: string;
}

export class TakeActionDto {
  @IsEnum(ModerationActionType) type: ModerationActionType;
  @IsString() @MaxLength(500) reason: string;
  @IsUUID() targetUserId: string;
  @IsOptional() @IsUUID() contentId?: string;
  @IsOptional() @IsString() contentType?: string;
  @IsOptional() @IsUUID() reportId?: string;
  @IsOptional() @IsDateString() suspendUntil?: string;
}

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(ModerationAction) private actionRepo: Repository<ModerationAction>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private dataSource: DataSource,
  ) {}

  async createReport(dto: CreateReportDto, reporterId: string) {
    if (!dto.postId && !dto.commentId && !dto.messageId && !dto.targetUserId) {
      throw new BadRequestException('Must specify a target for the report');
    }

    const report = this.reportRepo.create({ ...dto, reporterId });
    await this.reportRepo.save(report);

    return { message: 'Report submitted. Our moderation team will review it.' };
  }

  async getPendingReports(page = 1, limit = 20) {
    const [items, total] = await this.reportRepo.findAndCount({
      where: { status: ReportStatus.PENDING },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['reporter'],
    });

    return { items, total, page, limit };
  }

  async getReport(id: string) {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ['reporter', 'post', 'comment'],
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async takeAction(dto: TakeActionDto, moderatorId: string) {
    const target = await this.userRepo.findOne({ where: { id: dto.targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    await this.dataSource.transaction(async (manager) => {
      // Record the action
      await manager.save(ModerationAction, {
        type: dto.type,
        reason: dto.reason,
        targetUserId: dto.targetUserId,
        moderatorId,
        contentId: dto.contentId,
        contentType: dto.contentType,
        reportId: dto.reportId,
        expiresAt: dto.suspendUntil ? new Date(dto.suspendUntil) : null,
      });

      // Apply effect based on action type
      switch (dto.type) {
        case ModerationActionType.WARN:
          await manager.update(User, dto.targetUserId, { status: UserStatus.WARNED });
          break;

        case ModerationActionType.REMOVE_CONTENT:
          if (dto.contentType === 'post' && dto.contentId) {
            await manager.update(Post, dto.contentId, {
              status: PostStatus.REMOVED,
              removedReason: dto.reason,
            });
          } else if (dto.contentType === 'comment' && dto.contentId) {
            await manager.update(Comment, dto.contentId, {
              status: CommentStatus.REMOVED,
              removedReason: dto.reason,
              body: '[removed by moderator]',
            });
          }
          break;

        case ModerationActionType.SUSPEND:
          const suspendUntil = dto.suspendUntil
            ? new Date(dto.suspendUntil)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
          await manager.update(User, dto.targetUserId, {
            status: UserStatus.SUSPENDED,
            suspendedUntil: suspendUntil,
          });
          break;

        case ModerationActionType.BAN:
          await manager.update(User, dto.targetUserId, {
            status: UserStatus.BANNED,
            refreshTokenHash: null, // Force logout
          });
          break;

        case ModerationActionType.UNBAN:
          await manager.update(User, dto.targetUserId, {
            status: UserStatus.ACTIVE,
            suspendedUntil: null,
          });
          break;
      }

      // Mark report as resolved if provided
      if (dto.reportId) {
        await manager.update(Report, dto.reportId, {
          status: ReportStatus.RESOLVED,
          resolvedBy: moderatorId,
          resolution: dto.reason,
        });
      }
    });

    // Send notification to user
    const notifType = dto.type === ModerationActionType.WARN
      ? NotificationType.MODERATION_WARNING
      : dto.type === ModerationActionType.SUSPEND
        ? NotificationType.MODERATION_SUSPENSION
        : dto.type === ModerationActionType.BAN
          ? NotificationType.MODERATION_BAN
          : null;

    if (notifType) {
      await this.notificationsService.create(dto.targetUserId, notifType, {
        reason: dto.reason,
        type: dto.type,
      });

      this.emailService.sendModerationEmail(
        target.email,
        target.handle,
        dto.type,
        dto.reason,
      ).catch(() => {});
    }

    return { message: 'Action taken successfully' };
  }

  async dismissReport(reportId: string, moderatorId: string) {
    await this.reportRepo.update(reportId, {
      status: ReportStatus.DISMISSED,
      resolvedBy: moderatorId,
    });
    return { message: 'Report dismissed' };
  }

  async getModerationHistory(userId: string) {
    return this.actionRepo.find({
      where: { targetUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getStats() {
    const [pending, resolved, dismissed] = await Promise.all([
      this.reportRepo.count({ where: { status: ReportStatus.PENDING } }),
      this.reportRepo.count({ where: { status: ReportStatus.RESOLVED } }),
      this.reportRepo.count({ where: { status: ReportStatus.DISMISSED } }),
    ]);

    const [warned, suspended, banned] = await Promise.all([
      this.userRepo.count({ where: { status: UserStatus.WARNED } }),
      this.userRepo.count({ where: { status: UserStatus.SUSPENDED } }),
      this.userRepo.count({ where: { status: UserStatus.BANNED } }),
    ]);

    return {
      reports: { pending, resolved, dismissed },
      users: { warned, suspended, banned },
    };
  }
}
