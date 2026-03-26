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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../../database/entities/post.entity");
const community_entity_1 = require("../../database/entities/community.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const community_member_entity_1 = require("../../database/entities/community-member.entity");
const vote_entity_1 = require("../../database/entities/vote.entity");
const hashtags_service_1 = require("../hashtags/hashtags.service");
let PostsService = class PostsService {
    constructor(postRepo, communityRepo, memberRepo, voteRepo, dataSource, hashtagsService) {
        this.postRepo = postRepo;
        this.communityRepo = communityRepo;
        this.memberRepo = memberRepo;
        this.voteRepo = voteRepo;
        this.dataSource = dataSource;
        this.hashtagsService = hashtagsService;
    }
    async create(dto, author) {
        const community = await this.communityRepo.findOne({
            where: { id: dto.communityId, universityId: author.universityId, isActive: true },
        });
        if (!community)
            throw new common_1.NotFoundException('Community not found');
        const post = this.postRepo.create({
            ...dto,
            authorId: author.id,
            universityId: author.universityId,
            hotScore: this.computeHotScore(0, 0, new Date()),
        });
        const saved = await this.postRepo.save(post);
        await this.communityRepo.increment({ id: dto.communityId }, 'postCount', 1);
        await this.postRepo
            .createQueryBuilder()
            .update(user_entity_1.User)
            .set({ postCount: () => '"postCount" + 1' })
            .where('id = :id', { id: author.id })
            .execute();
        const text = `${dto.title} ${dto.body || ''}`;
        this.hashtagsService.processPostHashtags(saved.id, text).catch(() => { });
        return saved;
    }
    async findById(id, requestingUserId) {
        const post = await this.postRepo
            .createQueryBuilder('p')
            .leftJoin('p.author', 'author')
            .leftJoin('p.community', 'community')
            .select([
            'p.id', 'p.title', 'p.body', 'p.imageUrls', 'p.category', 'p.status',
            'p.upvotes', 'p.downvotes', 'p.commentCount', 'p.createdAt',
            'author.id', 'author.handle',
            'community.id', 'community.name', 'community.slug',
        ])
            .where('p.id = :id', { id })
            .andWhere('p.status = :status', { status: post_entity_1.PostStatus.ACTIVE })
            .getOne();
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        let userVote;
        if (requestingUserId) {
            const vote = await this.voteRepo.findOne({
                where: { postId: id, userId: requestingUserId },
            });
            userVote = vote?.value;
        }
        return { ...post, userVote };
    }
    async getFeedForCommunity(communityId, sort = 'hot', page = 1, limit = 20, requestingUserId) {
        const qb = this.postRepo
            .createQueryBuilder('p')
            .leftJoin('p.author', 'author')
            .select([
            'p.id', 'p.title', 'p.category', 'p.upvotes', 'p.downvotes',
            'p.commentCount', 'p.createdAt', 'p.imageUrls', 'p.hotScore',
            'author.id', 'author.handle',
        ])
            .where('p.communityId = :communityId', { communityId })
            .andWhere('p.status = :status', { status: post_entity_1.PostStatus.ACTIVE })
            .skip((page - 1) * limit)
            .take(limit);
        this.applySorting(qb, sort);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async getCampusFeed(universityId, sort = 'hot', page = 1, limit = 20) {
        const qb = this.postRepo
            .createQueryBuilder('p')
            .leftJoin('p.author', 'author')
            .leftJoin('p.community', 'community')
            .select([
            'p.id', 'p.title', 'p.category', 'p.upvotes', 'p.downvotes',
            'p.commentCount', 'p.createdAt', 'p.imageUrls', 'p.hotScore',
            'author.id', 'author.handle',
            'community.id', 'community.name', 'community.slug',
        ])
            .where('p.universityId = :universityId', { universityId })
            .andWhere('p.status = :status', { status: post_entity_1.PostStatus.ACTIVE })
            .skip((page - 1) * limit)
            .take(limit);
        this.applySorting(qb, sort);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async getPersonalizedFeed(userId, universityId, sort = 'hot', page = 1, limit = 20) {
        const memberships = await this.memberRepo.find({ where: { userId } });
        const communityIds = memberships.map((m) => m.communityId);
        if (communityIds.length === 0) {
            return this.getCampusFeed(universityId, sort, page, limit);
        }
        const qb = this.postRepo
            .createQueryBuilder('p')
            .leftJoin('p.author', 'author')
            .leftJoin('p.community', 'community')
            .select([
            'p.id', 'p.title', 'p.category', 'p.upvotes', 'p.downvotes',
            'p.commentCount', 'p.createdAt', 'p.imageUrls', 'p.hotScore',
            'author.id', 'author.handle',
            'community.id', 'community.name', 'community.slug',
        ])
            .where('p.communityId IN (:...communityIds)', { communityIds })
            .andWhere('p.status = :status', { status: post_entity_1.PostStatus.ACTIVE })
            .skip((page - 1) * limit)
            .take(limit);
        this.applySorting(qb, sort);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async delete(id, userId) {
        const post = await this.postRepo.findOne({ where: { id } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.authorId !== userId)
            throw new common_1.ForbiddenException('Not authorized');
        await this.postRepo.update(id, { status: post_entity_1.PostStatus.REMOVED });
        this.hashtagsService.removePostHashtags(id).catch(() => { });
    }
    async recalculateHotScores() {
        const posts = await this.postRepo.find({
            where: { status: post_entity_1.PostStatus.ACTIVE },
            select: ['id', 'upvotes', 'downvotes', 'createdAt'],
        });
        const updates = posts.map((p) => ({
            id: p.id,
            hotScore: this.computeHotScore(p.upvotes, p.downvotes, p.createdAt),
        }));
        await Promise.all(updates.map((u) => this.postRepo.update(u.id, { hotScore: u.hotScore })));
    }
    applySorting(qb, sort) {
        switch (sort) {
            case 'hot':
                qb.orderBy('p.hotScore', 'DESC');
                break;
            case 'new':
                qb.orderBy('p.createdAt', 'DESC');
                break;
            case 'top':
                qb.orderBy('p.upvotes - p.downvotes', 'DESC');
                break;
        }
    }
    computeHotScore(upvotes, downvotes, createdAt) {
        const n = upvotes + downvotes;
        if (n === 0) {
            const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
            return Math.max(0, 1 - ageHours * 0.05);
        }
        const z = 1.96;
        const p = upvotes / n;
        const wilson = (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
        const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        const gravity = 1.8;
        const timeFactor = Math.pow(ageHours + 2, gravity);
        return wilson / timeFactor;
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(community_entity_1.Community)),
    __param(2, (0, typeorm_1.InjectRepository)(community_member_entity_1.CommunityMember)),
    __param(3, (0, typeorm_1.InjectRepository)(vote_entity_1.Vote)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        hashtags_service_1.HashtagsService])
], PostsService);
//# sourceMappingURL=posts.service.js.map