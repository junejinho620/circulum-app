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
exports.BlocksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_block_entity_1 = require("../../database/entities/user-block.entity");
let BlocksService = class BlocksService {
    constructor(blockRepo) {
        this.blockRepo = blockRepo;
    }
    async block(blockerId, blockedId) {
        if (blockerId === blockedId) {
            throw new common_1.BadRequestException('Cannot block yourself');
        }
        const existing = await this.blockRepo.findOne({
            where: { blockerId, blockedId },
        });
        if (existing)
            return existing;
        const block = this.blockRepo.create({ blockerId, blockedId });
        return this.blockRepo.save(block);
    }
    async unblock(blockerId, blockedId) {
        await this.blockRepo.delete({ blockerId, blockedId });
    }
    async getBlockedUsers(blockerId) {
        return this.blockRepo.find({
            where: { blockerId },
            relations: ['blocked'],
            order: { createdAt: 'DESC' },
        });
    }
    async getBlockedUserIds(blockerId) {
        const blocks = await this.blockRepo.find({
            where: { blockerId },
            select: ['blockedId'],
        });
        return new Set(blocks.map((b) => b.blockedId));
    }
    async isBlocked(blockerId, blockedId) {
        return !!(await this.blockRepo.findOne({ where: { blockerId, blockedId } }));
    }
    async isBlockedEitherWay(userA, userB) {
        const count = await this.blockRepo
            .createQueryBuilder('b')
            .where('(b.blockerId = :a AND b.blockedId = :b)', { a: userA, b: userB })
            .orWhere('(b.blockerId = :b AND b.blockedId = :a)', { a: userA, b: userB })
            .getCount();
        return count > 0;
    }
    async getBlockCount(blockerId) {
        return this.blockRepo.count({ where: { blockerId } });
    }
};
exports.BlocksService = BlocksService;
exports.BlocksService = BlocksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_block_entity_1.UserBlock)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BlocksService);
//# sourceMappingURL=blocks.service.js.map