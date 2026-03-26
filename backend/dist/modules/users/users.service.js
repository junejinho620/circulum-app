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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../database/entities/user.entity");
let UsersService = class UsersService {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async findById(id) {
        return this.userRepo.findOne({ where: { id } });
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['university', 'major'],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return {
            id: user.id,
            handle: user.handle,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            year: user.year,
            interests: user.interests,
            university: { id: user.university.id, name: user.university.name },
            major: user.major ? { id: user.major.id, name: user.major.name } : null,
            postCount: user.postCount,
            commentCount: user.commentCount,
            totalKarma: user.totalKarma,
            createdAt: user.createdAt,
        };
    }
    async getPublicProfile(targetUserId) {
        const user = await this.userRepo.findOne({
            where: { id: targetUserId },
            relations: ['university'],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return {
            id: user.id,
            handle: user.handle,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            year: user.year,
            interests: user.interests,
            university: { id: user.university.id, name: user.university.name },
            postCount: user.postCount,
            commentCount: user.commentCount,
            totalKarma: user.totalKarma,
            createdAt: user.createdAt,
        };
    }
    async updateProfile(userId, dto) {
        if (dto.handle) {
            const existing = await this.userRepo.findOne({
                where: { handle: dto.handle },
            });
            if (existing && existing.id !== userId) {
                throw new common_1.ConflictException('Handle already taken');
            }
        }
        if (dto.interests && dto.interests.length > 8) {
            dto.interests = dto.interests.slice(0, 8);
        }
        await this.userRepo.update(userId, {
            ...(dto.handle !== undefined && { handle: dto.handle }),
            ...(dto.bio !== undefined && { bio: dto.bio }),
            ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
            ...(dto.year !== undefined && { year: dto.year }),
            ...(dto.interests !== undefined && { interests: dto.interests }),
        });
        return this.getProfile(userId);
    }
    async updatePushToken(userId, pushToken) {
        await this.userRepo.update(userId, { pushToken });
    }
    async getPushToken(userId) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            select: ['id', 'pushToken'],
        });
        return user?.pushToken ?? null;
    }
    async search(query, universityId, limit = 20) {
        return this.userRepo
            .createQueryBuilder('u')
            .select(['u.id', 'u.handle', 'u.avatarUrl', 'u.bio', 'u.totalKarma'])
            .where('u.universityId = :universityId', { universityId })
            .andWhere('u.handle ILIKE :q', { q: `%${query}%` })
            .andWhere('u.status = :status', { status: 'active' })
            .orderBy('u.totalKarma', 'DESC')
            .limit(Math.min(limit, 50))
            .getMany();
    }
    async updateLastSeen(userId) {
        await this.userRepo.update(userId, { lastSeenAt: new Date() });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map