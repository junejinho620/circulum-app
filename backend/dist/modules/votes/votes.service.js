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
exports.VotesService = exports.VoteDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vote_entity_1 = require("../../database/entities/vote.entity");
const post_entity_1 = require("../../database/entities/post.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../../database/entities/notification.entity");
const class_validator_1 = require("class-validator");
class VoteDto {
}
exports.VoteDto = VoteDto;
__decorate([
    (0, class_validator_1.IsEnum)(vote_entity_1.VoteValue),
    __metadata("design:type", Number)
], VoteDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], VoteDto.prototype, "postId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], VoteDto.prototype, "commentId", void 0);
const VOTE_MILESTONES = [10, 50, 100, 500, 1000];
let VotesService = class VotesService {
    constructor(voteRepo, postRepo, commentRepo, notificationsService, dataSource) {
        this.voteRepo = voteRepo;
        this.postRepo = postRepo;
        this.commentRepo = commentRepo;
        this.notificationsService = notificationsService;
        this.dataSource = dataSource;
    }
    async vote(dto, user) {
        if (!dto.postId && !dto.commentId) {
            throw new common_1.BadRequestException('Must specify postId or commentId');
        }
        if (dto.postId && dto.commentId) {
            throw new common_1.BadRequestException('Cannot vote on both post and comment simultaneously');
        }
        if (dto.postId) {
            return this.voteOnPost(dto.postId, dto.value, user);
        }
        return this.voteOnComment(dto.commentId, dto.value, user);
    }
    async voteOnPost(postId, value, user) {
        const post = await this.postRepo.findOne({
            where: { id: postId, status: post_entity_1.PostStatus.ACTIVE },
            select: ['id', 'authorId', 'upvotes', 'downvotes'],
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const existing = await this.voteRepo.findOne({ where: { postId, userId: user.id } });
        await this.dataSource.transaction(async (manager) => {
            if (existing) {
                if (existing.value === value) {
                    await manager.delete(vote_entity_1.Vote, { id: existing.id });
                    if (value === 1) {
                        await manager.decrement(post_entity_1.Post, { id: postId }, 'upvotes', 1);
                    }
                    else {
                        await manager.decrement(post_entity_1.Post, { id: postId }, 'downvotes', 1);
                    }
                }
                else {
                    await manager.update(vote_entity_1.Vote, { id: existing.id }, { value });
                    if (value === 1) {
                        await manager.increment(post_entity_1.Post, { id: postId }, 'upvotes', 1);
                        await manager.decrement(post_entity_1.Post, { id: postId }, 'downvotes', 1);
                    }
                    else {
                        await manager.decrement(post_entity_1.Post, { id: postId }, 'upvotes', 1);
                        await manager.increment(post_entity_1.Post, { id: postId }, 'downvotes', 1);
                    }
                }
            }
            else {
                await manager.save(vote_entity_1.Vote, { postId, userId: user.id, value });
                if (value === 1) {
                    await manager.increment(post_entity_1.Post, { id: postId }, 'upvotes', 1);
                }
                else {
                    await manager.increment(post_entity_1.Post, { id: postId }, 'downvotes', 1);
                }
            }
        });
        if (value === 1 && !existing) {
            const updated = await this.postRepo.findOne({ where: { id: postId }, select: ['upvotes', 'authorId'] });
            if (updated && VOTE_MILESTONES.includes(updated.upvotes)) {
                await this.notificationsService.create(updated.authorId, notification_entity_1.NotificationType.VOTE_MILESTONE, { postId, upvotes: updated.upvotes });
            }
            await this.postRepo
                .createQueryBuilder()
                .update(user_entity_1.User)
                .set({ totalKarma: () => '"totalKarma" + 1' })
                .where('id = :id', { id: post.authorId })
                .execute();
        }
        return { success: true };
    }
    async voteOnComment(commentId, value, user) {
        const comment = await this.commentRepo.findOne({
            where: { id: commentId, status: comment_entity_1.CommentStatus.ACTIVE },
        });
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        const existing = await this.voteRepo.findOne({ where: { commentId, userId: user.id } });
        await this.dataSource.transaction(async (manager) => {
            if (existing) {
                if (existing.value === value) {
                    await manager.delete(vote_entity_1.Vote, { id: existing.id });
                    if (value === 1) {
                        await manager.decrement(comment_entity_1.Comment, { id: commentId }, 'upvotes', 1);
                    }
                    else {
                        await manager.decrement(comment_entity_1.Comment, { id: commentId }, 'downvotes', 1);
                    }
                }
                else {
                    await manager.update(vote_entity_1.Vote, { id: existing.id }, { value });
                    if (value === 1) {
                        await manager.increment(comment_entity_1.Comment, { id: commentId }, 'upvotes', 1);
                        await manager.decrement(comment_entity_1.Comment, { id: commentId }, 'downvotes', 1);
                    }
                    else {
                        await manager.decrement(comment_entity_1.Comment, { id: commentId }, 'upvotes', 1);
                        await manager.increment(comment_entity_1.Comment, { id: commentId }, 'downvotes', 1);
                    }
                }
            }
            else {
                await manager.save(vote_entity_1.Vote, { commentId, userId: user.id, value });
                if (value === 1) {
                    await manager.increment(comment_entity_1.Comment, { id: commentId }, 'upvotes', 1);
                }
                else {
                    await manager.increment(comment_entity_1.Comment, { id: commentId }, 'downvotes', 1);
                }
            }
        });
        return { success: true };
    }
};
exports.VotesService = VotesService;
exports.VotesService = VotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vote_entity_1.Vote)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(2, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        typeorm_2.DataSource])
], VotesService);
//# sourceMappingURL=votes.service.js.map