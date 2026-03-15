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
var FeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../../database/entities/post.entity");
let FeedService = FeedService_1 = class FeedService {
    constructor(postRepo) {
        this.postRepo = postRepo;
        this.logger = new common_1.Logger(FeedService_1.name);
    }
    async recalculateHotScores() {
        this.logger.debug('Recalculating hot scores...');
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const posts = await this.postRepo
            .createQueryBuilder('p')
            .select(['p.id', 'p.upvotes', 'p.downvotes', 'p.createdAt'])
            .where('p.status = :status', { status: post_entity_1.PostStatus.ACTIVE })
            .andWhere('p.createdAt > :cutoff', { cutoff })
            .getMany();
        if (posts.length === 0)
            return;
        const values = posts
            .map((p) => `('${p.id}', ${this.computeHotScore(p.upvotes, p.downvotes, p.createdAt)})`)
            .join(', ');
        await this.postRepo.query(`
      UPDATE posts AS p SET "hotScore" = v."hotScore"
      FROM (VALUES ${values}) AS v(id, "hotScore")
      WHERE p.id = v.id::uuid
    `);
        this.logger.debug(`Updated hot scores for ${posts.length} posts`);
    }
    computeHotScore(upvotes, downvotes, createdAt) {
        const n = upvotes + downvotes;
        const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (n === 0) {
            return Math.max(0, 1 - ageHours * 0.05);
        }
        const z = 1.96;
        const p = upvotes / n;
        const wilson = (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
        const gravity = 1.8;
        const timeFactor = Math.pow(ageHours + 2, gravity);
        return wilson / timeFactor;
    }
};
exports.FeedService = FeedService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeedService.prototype, "recalculateHotScores", null);
exports.FeedService = FeedService = FeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FeedService);
//# sourceMappingURL=feed.service.js.map