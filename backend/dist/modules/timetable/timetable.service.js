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
exports.TimetableService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_block_entity_1 = require("../../database/entities/schedule-block.entity");
let TimetableService = class TimetableService {
    constructor(blockRepo) {
        this.blockRepo = blockRepo;
    }
    async getSchedule(userId) {
        return this.blockRepo.find({
            where: { userId },
            order: { day: 'ASC', startHour: 'ASC' },
        });
    }
    async createBlock(userId, dto) {
        const block = this.blockRepo.create({
            ...dto,
            userId,
            type: dto.type ?? 'class',
        });
        return this.blockRepo.save(block);
    }
    async updateBlock(blockId, userId, dto) {
        const block = await this.blockRepo.findOne({ where: { id: blockId } });
        if (!block)
            throw new common_1.NotFoundException('Block not found');
        if (block.userId !== userId)
            throw new common_1.ForbiddenException('Not your block');
        Object.assign(block, dto);
        return this.blockRepo.save(block);
    }
    async deleteBlock(blockId, userId) {
        const block = await this.blockRepo.findOne({ where: { id: blockId } });
        if (!block)
            throw new common_1.NotFoundException('Block not found');
        if (block.userId !== userId)
            throw new common_1.ForbiddenException('Not your block');
        await this.blockRepo.remove(block);
    }
    async bulkImport(userId, dto) {
        await this.blockRepo.delete({ userId });
        const blocks = dto.blocks.map((b) => this.blockRepo.create({
            ...b,
            userId,
            type: b.type ?? 'class',
        }));
        return this.blockRepo.save(blocks);
    }
    async clearSchedule(userId) {
        await this.blockRepo.delete({ userId });
    }
};
exports.TimetableService = TimetableService;
exports.TimetableService = TimetableService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_block_entity_1.ScheduleBlock)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TimetableService);
//# sourceMappingURL=timetable.service.js.map