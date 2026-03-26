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
exports.BookmarksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bookmark_entity_1 = require("../../database/entities/bookmark.entity");
let BookmarksService = class BookmarksService {
    constructor(bookmarkRepo) {
        this.bookmarkRepo = bookmarkRepo;
    }
    async add(userId, postId) {
        const existing = await this.bookmarkRepo.findOne({ where: { userId, postId } });
        if (existing)
            throw new common_1.ConflictException('Already bookmarked');
        const bookmark = this.bookmarkRepo.create({ userId, postId });
        return this.bookmarkRepo.save(bookmark);
    }
    async remove(userId, postId) {
        await this.bookmarkRepo.delete({ userId, postId });
    }
    async toggle(userId, postId) {
        const existing = await this.bookmarkRepo.findOne({ where: { userId, postId } });
        if (existing) {
            await this.bookmarkRepo.remove(existing);
            return { bookmarked: false };
        }
        await this.bookmarkRepo.save(this.bookmarkRepo.create({ userId, postId }));
        return { bookmarked: true };
    }
    async getForUser(userId, page = 1, limit = 20) {
        const [items, total] = await this.bookmarkRepo.findAndCount({
            where: { userId },
            relations: ['post', 'post.author', 'post.community'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit };
    }
    async isBookmarked(userId, postId) {
        return !!(await this.bookmarkRepo.findOne({ where: { userId, postId } }));
    }
    async getBookmarkedPostIds(userId, postIds) {
        if (postIds.length === 0)
            return new Set();
        const bookmarks = await this.bookmarkRepo
            .createQueryBuilder('b')
            .select('b.postId')
            .where('b.userId = :userId', { userId })
            .andWhere('b.postId IN (:...postIds)', { postIds })
            .getMany();
        return new Set(bookmarks.map((b) => b.postId));
    }
};
exports.BookmarksService = BookmarksService;
exports.BookmarksService = BookmarksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bookmark_entity_1.Bookmark)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BookmarksService);
//# sourceMappingURL=bookmarks.service.js.map