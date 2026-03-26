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
exports.HashtagsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hashtag_entity_1 = require("../../database/entities/hashtag.entity");
const post_hashtag_entity_1 = require("../../database/entities/post-hashtag.entity");
let HashtagsService = class HashtagsService {
    constructor(hashtagRepo, postHashtagRepo) {
        this.hashtagRepo = hashtagRepo;
        this.postHashtagRepo = postHashtagRepo;
    }
    async processPostHashtags(postId, text) {
        const tags = this.extractHashtags(text);
        if (tags.length === 0)
            return;
        for (const name of tags) {
            let hashtag = await this.hashtagRepo.findOne({ where: { name } });
            if (!hashtag) {
                hashtag = await this.hashtagRepo.save(this.hashtagRepo.create({ name }));
            }
            const exists = await this.postHashtagRepo.findOne({
                where: { postId, hashtagId: hashtag.id },
            });
            if (!exists) {
                await this.postHashtagRepo.save(this.postHashtagRepo.create({ postId, hashtagId: hashtag.id }));
                await this.hashtagRepo.increment({ id: hashtag.id }, 'usageCount', 1);
            }
        }
    }
    async removePostHashtags(postId) {
        const links = await this.postHashtagRepo.find({ where: { postId } });
        for (const link of links) {
            await this.hashtagRepo.decrement({ id: link.hashtagId }, 'usageCount', 1);
        }
        await this.postHashtagRepo.delete({ postId });
    }
    async getTrending(limit = 20) {
        return this.hashtagRepo
            .createQueryBuilder('h')
            .where('h.usageCount > 0')
            .orderBy('h.usageCount', 'DESC')
            .limit(limit)
            .getMany();
    }
    async search(query, limit = 10) {
        return this.hashtagRepo
            .createQueryBuilder('h')
            .where('h.name ILIKE :q', { q: `${query.toLowerCase()}%` })
            .orderBy('h.usageCount', 'DESC')
            .limit(limit)
            .getMany();
    }
    async getPostsByHashtag(hashtagName, page = 1, limit = 20) {
        const hashtag = await this.hashtagRepo.findOne({
            where: { name: hashtagName.toLowerCase() },
        });
        if (!hashtag)
            return { items: [], total: 0, page, limit };
        const [items, total] = await this.postHashtagRepo.findAndCount({
            where: { hashtagId: hashtag.id },
            relations: ['post', 'post.author', 'post.community'],
            order: { post: { createdAt: 'DESC' } },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            hashtag,
            items: items.map((ph) => ph.post),
            total,
            page,
            limit,
        };
    }
    extractHashtags(text) {
        const matches = text.match(/#([a-zA-Z0-9_]+)/g);
        if (!matches)
            return [];
        const unique = new Set(matches
            .map((m) => m.slice(1).toLowerCase())
            .filter((t) => t.length >= 2 && t.length <= 100));
        return Array.from(unique).slice(0, 20);
    }
};
exports.HashtagsService = HashtagsService;
exports.HashtagsService = HashtagsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hashtag_entity_1.Hashtag)),
    __param(1, (0, typeorm_1.InjectRepository)(post_hashtag_entity_1.PostHashtag)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], HashtagsService);
//# sourceMappingURL=hashtags.service.js.map