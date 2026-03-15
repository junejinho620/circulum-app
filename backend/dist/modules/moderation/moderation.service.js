"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = exports.TakeActionDto = exports.CreateReportDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const report_entity_1 = require("../../database/entities/report.entity");
const moderation_action_entity_1 = require("../../database/entities/moderation-action.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const post_entity_1 = require("../../database/entities/post.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../../database/entities/notification.entity");
const email_service_1 = require("../notifications/email.service");
const class_validator_1 = require("class-validator");
class CreateReportDto {
}
exports.CreateReportDto = CreateReportDto;
__decorate([
    (0, class_validator_1.IsEnum)(report_entity_1.ReportType),
    __metadata("design:type", String)
], CreateReportDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(report_entity_1.ReportReason),
    __metadata("design:type", String)
], CreateReportDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateReportDto.prototype, "details", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "postId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "commentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "messageId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReportDto.prototype, "targetUserId", void 0);
class TakeActionDto {
}
exports.TakeActionDto = TakeActionDto;
__decorate([
    (0, class_validator_1.IsEnum)(moderation_action_entity_1.ModerationActionType),
    __metadata("design:type", String)
], TakeActionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], TakeActionDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TakeActionDto.prototype, "targetUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TakeActionDto.prototype, "contentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TakeActionDto.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TakeActionDto.prototype, "reportId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TakeActionDto.prototype, "suspendUntil", void 0);
let ModerationService = class ModerationService {
    constructor(reportRepo, actionRepo, userRepo, postRepo, commentRepo, notificationsService, emailService, dataSource) {
        this.reportRepo = reportRepo;
        this.actionRepo = actionRepo;
        this.userRepo = userRepo;
        this.postRepo = postRepo;
        this.commentRepo = commentRepo;
        this.notificationsService = notificationsService;
        this.emailService = emailService;
        this.dataSource = dataSource;
    }
    async createReport(dto, reporterId) {
        if (!dto.postId && !dto.commentId && !dto.messageId && !dto.targetUserId) {
            throw new common_1.BadRequestException('Must specify a target for the report');
        }
        const report = this.reportRepo.create({ ...dto, reporterId });
        await this.reportRepo.save(report);
        return { message: 'Report submitted. Our moderation team will review it.' };
    }
    async getPendingReports(page = 1, limit = 20) {
        const [items, total] = await this.reportRepo.findAndCount({
            where: { status: report_entity_1.ReportStatus.PENDING },
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['reporter'],
        });
        return { items, total, page, limit };
    }
    async getReport(id) {
        const report = await this.reportRepo.findOne({
            where: { id },
            relations: ['reporter', 'post', 'comment'],
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        return report;
    }
    async takeAction(dto, moderatorId) {
        const target = await this.userRepo.findOne({ where: { id: dto.targetUserId } });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        await this.dataSource.transaction(async (manager) => {
            await manager.save(moderation_action_entity_1.ModerationAction, {
                type: dto.type,
                reason: dto.reason,
                targetUserId: dto.targetUserId,
                moderatorId,
                contentId: dto.contentId,
                contentType: dto.contentType,
                reportId: dto.reportId,
                expiresAt: dto.suspendUntil ? new Date(dto.suspendUntil) : null,
            });
            switch (dto.type) {
                case moderation_action_entity_1.ModerationActionType.WARN:
                    await manager.update(user_entity_1.User, dto.targetUserId, { status: user_entity_1.UserStatus.WARNED });
                    break;
                case moderation_action_entity_1.ModerationActionType.REMOVE_CONTENT:
                    if (dto.contentType === 'post' && dto.contentId) {
                        await manager.update(post_entity_1.Post, dto.contentId, {
                            status: post_entity_1.PostStatus.REMOVED,
                            removedReason: dto.reason,
                        });
                    }
                    else if (dto.contentType === 'comment' && dto.contentId) {
                        await manager.update(comment_entity_1.Comment, dto.contentId, {
                            status: comment_entity_1.CommentStatus.REMOVED,
                            removedReason: dto.reason,
                            body: '[removed by moderator]',
                        });
                    }
                    break;
                case moderation_action_entity_1.ModerationActionType.SUSPEND:
                    const suspendUntil = dto.suspendUntil
                        ? new Date(dto.suspendUntil)
                        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    await manager.update(user_entity_1.User, dto.targetUserId, {
                        status: user_entity_1.UserStatus.SUSPENDED,
                        suspendedUntil: suspendUntil,
                    });
                    break;
                case moderation_action_entity_1.ModerationActionType.BAN:
                    await manager.update(user_entity_1.User, dto.targetUserId, {
                        status: user_entity_1.UserStatus.BANNED,
                        refreshTokenHash: null,
                    });
                    break;
                case moderation_action_entity_1.ModerationActionType.UNBAN:
                    await manager.update(user_entity_1.User, dto.targetUserId, {
                        status: user_entity_1.UserStatus.ACTIVE,
                        suspendedUntil: null,
                    });
                    break;
            }
            if (dto.reportId) {
                await manager.update(report_entity_1.Report, dto.reportId, {
                    status: report_entity_1.ReportStatus.RESOLVED,
                    resolvedBy: moderatorId,
                    resolution: dto.reason,
                });
            }
        });
        const notifType = dto.type === moderation_action_entity_1.ModerationActionType.WARN
            ? notification_entity_1.NotificationType.MODERATION_WARNING
            : dto.type === moderation_action_entity_1.ModerationActionType.SUSPEND
                ? notification_entity_1.NotificationType.MODERATION_SUSPENSION
                : dto.type === moderation_action_entity_1.ModerationActionType.BAN
                    ? notification_entity_1.NotificationType.MODERATION_BAN
                    : null;
        if (notifType) {
            await this.notificationsService.create(dto.targetUserId, notifType, {
                reason: dto.reason,
                type: dto.type,
            });
            this.emailService.sendModerationEmail(target.email, target.handle, dto.type, dto.reason).catch(() => { });
        }
        return { message: 'Action taken successfully' };
    }
    async dismissReport(reportId, moderatorId) {
        await this.reportRepo.update(reportId, {
            status: report_entity_1.ReportStatus.DISMISSED,
            resolvedBy: moderatorId,
        });
        return { message: 'Report dismissed' };
    }
    async getModerationHistory(userId) {
        return this.actionRepo.find({
            where: { targetUserId: userId },
            order: { createdAt: 'DESC' },
        });
    }
    async getStats() {
        const [pending, resolved, dismissed] = await Promise.all([
            this.reportRepo.count({ where: { status: report_entity_1.ReportStatus.PENDING } }),
            this.reportRepo.count({ where: { status: report_entity_1.ReportStatus.RESOLVED } }),
            this.reportRepo.count({ where: { status: report_entity_1.ReportStatus.DISMISSED } }),
        ]);
        const [warned, suspended, banned] = await Promise.all([
            this.userRepo.count({ where: { status: user_entity_1.UserStatus.WARNED } }),
            this.userRepo.count({ where: { status: user_entity_1.UserStatus.SUSPENDED } }),
            this.userRepo.count({ where: { status: user_entity_1.UserStatus.BANNED } }),
        ]);
        return {
            reports: { pending, resolved, dismissed },
            users: { warned, suspended, banned },
        };
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __param(1, (0, typeorm_1.InjectRepository)(moderation_action_entity_1.ModerationAction)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(4, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        email_service_1.EmailService,
        typeorm_2.DataSource])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map