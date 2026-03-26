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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../../database/entities/notification.entity");
const push_service_1 = require("./push.service");
const PUSH_CONTENT = {
    [notification_entity_1.NotificationType.COMMENT_REPLY]: { title: 'New Reply', bodyTemplate: 'Someone replied to your comment' },
    [notification_entity_1.NotificationType.POST_COMMENT]: { title: 'New Comment', bodyTemplate: 'Someone commented on your post' },
    [notification_entity_1.NotificationType.NEW_MESSAGE]: { title: 'New Message', bodyTemplate: 'You have a new message' },
    [notification_entity_1.NotificationType.MESSAGE_REQUEST]: { title: 'Message Request', bodyTemplate: 'Someone wants to message you' },
    [notification_entity_1.NotificationType.VOTE_MILESTONE]: { title: 'Milestone!', bodyTemplate: 'Your post hit a vote milestone' },
    [notification_entity_1.NotificationType.MODERATION_WARNING]: { title: 'Warning', bodyTemplate: 'You received a moderation warning' },
    [notification_entity_1.NotificationType.MODERATION_SUSPENSION]: { title: 'Account Suspended', bodyTemplate: 'Your account has been suspended' },
    [notification_entity_1.NotificationType.MODERATION_BAN]: { title: 'Account Banned', bodyTemplate: 'Your account has been banned' },
};
let NotificationsService = class NotificationsService {
    constructor(notificationRepo, pushService) {
        this.notificationRepo = notificationRepo;
        this.pushService = pushService;
    }
    async create(userId, type, payload) {
        const notification = this.notificationRepo.create({ userId, type, payload });
        const saved = await this.notificationRepo.save(notification);
        const content = PUSH_CONTENT[type];
        this.pushService.sendToUser(userId, content.title, payload.message ?? content.bodyTemplate, { type, notificationId: saved.id, ...payload }).catch(() => { });
        return saved;
    }
    async getForUser(userId, page = 1, limit = 30) {
        const [items, total] = await this.notificationRepo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit };
    }
    async markRead(userId, notificationId) {
        await this.notificationRepo.update({ id: notificationId, userId }, { isRead: true });
        return { success: true };
    }
    async markAllRead(userId) {
        await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
        return { success: true };
    }
    async getUnreadCount(userId) {
        return this.notificationRepo.count({ where: { userId, isRead: false } });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        push_service_1.PushService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map