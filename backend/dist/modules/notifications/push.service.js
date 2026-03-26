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
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const expo_server_sdk_1 = require("expo-server-sdk");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../database/entities/user.entity");
let PushService = PushService_1 = class PushService {
    constructor(userRepo) {
        this.userRepo = userRepo;
        this.expo = new expo_server_sdk_1.Expo();
        this.logger = new common_1.Logger(PushService_1.name);
    }
    async sendToUser(userId, title, body, data) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            select: ['id', 'pushToken'],
        });
        if (!user?.pushToken)
            return;
        if (!expo_server_sdk_1.Expo.isExpoPushToken(user.pushToken)) {
            this.logger.warn(`Invalid push token for user ${userId}: ${user.pushToken}`);
            return;
        }
        await this.sendMessages([{
                to: user.pushToken,
                sound: 'default',
                title,
                body,
                data: { ...data, userId },
            }]);
    }
    async sendToUsers(userIds, title, body, data) {
        if (userIds.length === 0)
            return;
        const users = await this.userRepo
            .createQueryBuilder('user')
            .select(['user.id', 'user.pushToken'])
            .where('user.id IN (:...ids)', { ids: userIds })
            .andWhere('user.pushToken IS NOT NULL')
            .getMany();
        const messages = users
            .filter((u) => u.pushToken && expo_server_sdk_1.Expo.isExpoPushToken(u.pushToken))
            .map((u) => ({
            to: u.pushToken,
            sound: 'default',
            title,
            body,
            data: { ...data, userId: u.id },
        }));
        if (messages.length > 0) {
            await this.sendMessages(messages);
        }
    }
    async sendMessages(messages) {
        const chunks = this.expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                const tickets = await this.expo.sendPushNotificationsAsync(chunk);
                for (const ticket of tickets) {
                    if (ticket.status === 'error') {
                        this.logger.error(`Push error: ${ticket.message}`, ticket.details);
                    }
                }
            }
            catch (err) {
                this.logger.error('Failed to send push notification chunk', err);
            }
        }
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PushService);
//# sourceMappingURL=push.service.js.map