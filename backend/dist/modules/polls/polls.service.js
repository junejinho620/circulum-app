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
exports.PollsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const poll_entity_1 = require("../../database/entities/poll.entity");
const poll_option_entity_1 = require("../../database/entities/poll-option.entity");
const poll_vote_entity_1 = require("../../database/entities/poll-vote.entity");
let PollsService = class PollsService {
    constructor(pollRepo, optionRepo, voteRepo, dataSource) {
        this.pollRepo = pollRepo;
        this.optionRepo = optionRepo;
        this.voteRepo = voteRepo;
        this.dataSource = dataSource;
    }
    async create(userId, universityId, dto) {
        if (!dto.options || dto.options.length < 2) {
            throw new common_1.BadRequestException('Poll must have at least 2 options');
        }
        if (dto.options.length > 10) {
            throw new common_1.BadRequestException('Poll can have at most 10 options');
        }
        const poll = this.pollRepo.create({
            question: dto.question,
            type: dto.type ?? poll_entity_1.PollType.SINGLE,
            communityId: dto.communityId ?? null,
            universityId,
            authorId: userId,
            isAnonymous: dto.isAnonymous ?? false,
            endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
            options: dto.options.map((text, i) => this.optionRepo.create({ text, sortOrder: i })),
        });
        return this.pollRepo.save(poll);
    }
    async findForUniversity(universityId, page = 1, limit = 20) {
        const [items, total] = await this.pollRepo.findAndCount({
            where: { universityId, status: poll_entity_1.PollStatus.ACTIVE },
            relations: ['options', 'author'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit };
    }
    async findForCommunity(communityId, page = 1, limit = 20) {
        const [items, total] = await this.pollRepo.findAndCount({
            where: { communityId, status: poll_entity_1.PollStatus.ACTIVE },
            relations: ['options', 'author'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit };
    }
    async findById(pollId, userId) {
        const poll = await this.pollRepo.findOne({
            where: { id: pollId },
            relations: ['options', 'author'],
        });
        if (!poll)
            throw new common_1.NotFoundException('Poll not found');
        let userVotes = [];
        if (userId) {
            const votes = await this.voteRepo.find({
                where: { pollId, userId },
                select: ['optionId'],
            });
            userVotes = votes.map((v) => v.optionId);
        }
        return { ...poll, userVotes };
    }
    async vote(pollId, userId, optionIds) {
        const poll = await this.pollRepo.findOne({
            where: { id: pollId },
            relations: ['options'],
        });
        if (!poll)
            throw new common_1.NotFoundException('Poll not found');
        if (poll.status !== poll_entity_1.PollStatus.ACTIVE)
            throw new common_1.BadRequestException('Poll is closed');
        if (poll.endsAt && new Date() > poll.endsAt)
            throw new common_1.BadRequestException('Poll has ended');
        const validOptionIds = new Set(poll.options.map((o) => o.id));
        for (const id of optionIds) {
            if (!validOptionIds.has(id))
                throw new common_1.BadRequestException('Invalid option');
        }
        if (poll.type === poll_entity_1.PollType.SINGLE && optionIds.length > 1) {
            throw new common_1.BadRequestException('Single-choice poll: select one option');
        }
        await this.dataSource.transaction(async (manager) => {
            const existing = await manager.find(poll_vote_entity_1.PollVote, { where: { pollId, userId } });
            if (existing.length > 0) {
                for (const v of existing) {
                    await manager.decrement(poll_option_entity_1.PollOption, { id: v.optionId }, 'voteCount', 1);
                }
                await manager.remove(existing);
                await manager.decrement(poll_entity_1.Poll, { id: pollId }, 'totalVotes', existing.length);
            }
            const newVotes = optionIds.map((optionId) => manager.create(poll_vote_entity_1.PollVote, { pollId, userId, optionId }));
            await manager.save(newVotes);
            for (const id of optionIds) {
                await manager.increment(poll_option_entity_1.PollOption, { id }, 'voteCount', 1);
            }
            await manager.increment(poll_entity_1.Poll, { id: pollId }, 'totalVotes', optionIds.length);
        });
    }
    async close(pollId, userId) {
        const poll = await this.pollRepo.findOne({ where: { id: pollId } });
        if (!poll)
            throw new common_1.NotFoundException('Poll not found');
        if (poll.authorId !== userId)
            throw new common_1.ForbiddenException('Not your poll');
        await this.pollRepo.update(pollId, { status: poll_entity_1.PollStatus.CLOSED });
    }
    async delete(pollId, userId) {
        const poll = await this.pollRepo.findOne({ where: { id: pollId } });
        if (!poll)
            throw new common_1.NotFoundException('Poll not found');
        if (poll.authorId !== userId)
            throw new common_1.ForbiddenException('Not your poll');
        await this.pollRepo.update(pollId, { status: poll_entity_1.PollStatus.REMOVED });
    }
};
exports.PollsService = PollsService;
exports.PollsService = PollsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(poll_entity_1.Poll)),
    __param(1, (0, typeorm_1.InjectRepository)(poll_option_entity_1.PollOption)),
    __param(2, (0, typeorm_1.InjectRepository)(poll_vote_entity_1.PollVote)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], PollsService);
//# sourceMappingURL=polls.service.js.map