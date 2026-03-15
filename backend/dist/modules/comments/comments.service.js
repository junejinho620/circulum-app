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
exports.CommentsService = exports.CreateCommentDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const comment_entity_1 = require("../../database/entities/comment.entity");
const post_entity_1 = require("../../database/entities/post.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../../database/entities/notification.entity");
const class_validator_1 = require("class-validator");
class CreateCommentDto {
}
exports.CreateCommentDto = CreateCommentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "parentId", void 0);
let CommentsService = class CommentsService {
    constructor(commentRepo, postRepo, notificationsService, dataSource) {
        this.commentRepo = commentRepo;
        this.postRepo = postRepo;
        this.notificationsService = notificationsService;
        this.dataSource = dataSource;
    }
    async create(postId, dto, author) {
        const post = await this.postRepo.findOne({
            where: { id: postId, status: post_entity_1.PostStatus.ACTIVE },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.isLocked)
            throw new common_1.ForbiddenException('Post is locked');
        if (dto.parentId) {
            const parent = await this.commentRepo.findOne({
                where: { id: dto.parentId, postId, status: comment_entity_1.CommentStatus.ACTIVE },
            });
            if (!parent)
                throw new common_1.NotFoundException('Parent comment not found');
        }
        const comment = await this.dataSource.transaction(async (manager) => {
            const c = manager.create(comment_entity_1.Comment, {
                body: dto.body,
                postId,
                authorId: author.id,
                parentId: dto.parentId || null,
            });
            const saved = await manager.save(comment_entity_1.Comment, c);
            await manager.increment(post_entity_1.Post, { id: postId }, 'commentCount', 1);
            if (dto.parentId) {
                await manager.increment(comment_entity_1.Comment, { id: dto.parentId }, 'replyCount', 1);
            }
            await manager
                .createQueryBuilder()
                .update(user_entity_1.User)
                .set({ commentCount: () => '"commentCount" + 1' })
                .where('id = :id', { id: author.id })
                .execute();
            return saved;
        });
        this.sendCommentNotifications(comment, post, author).catch(() => { });
        return comment;
    }
    async getForPost(postId, page = 1, limit = 50) {
        const topLevel = await this.commentRepo
            .createQueryBuilder('c')
            .leftJoin('c.author', 'author')
            .select([
            'c.id', 'c.body', 'c.upvotes', 'c.downvotes', 'c.replyCount',
            'c.createdAt', 'c.status', 'c.parentId',
            'author.id', 'author.handle',
        ])
            .where('c.postId = :postId', { postId })
            .andWhere('c.parentId IS NULL')
            .andWhere('c.status = :status', { status: comment_entity_1.CommentStatus.ACTIVE })
            .orderBy('c.upvotes - c.downvotes', 'DESC')
            .addOrderBy('c.createdAt', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        if (topLevel.length > 0) {
            const topIds = topLevel.map((c) => c.id);
            const replies = await this.commentRepo
                .createQueryBuilder('c')
                .leftJoin('c.author', 'author')
                .select([
                'c.id', 'c.body', 'c.upvotes', 'c.downvotes',
                'c.createdAt', 'c.status', 'c.parentId',
                'author.id', 'author.handle',
            ])
                .where('c.parentId IN (:...topIds)', { topIds })
                .andWhere('c.status = :status', { status: comment_entity_1.CommentStatus.ACTIVE })
                .orderBy('c.createdAt', 'ASC')
                .getMany();
            const repliesByParent = replies.reduce((acc, r) => {
                if (!acc[r.parentId])
                    acc[r.parentId] = [];
                acc[r.parentId].push(r);
                return acc;
            }, {});
            return topLevel.map((c) => ({
                ...c,
                replies: repliesByParent[c.id] || [],
            }));
        }
        return topLevel;
    }
    async delete(id, userId) {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        if (comment.authorId !== userId)
            throw new common_1.ForbiddenException('Not authorized');
        await this.commentRepo.update(id, { status: comment_entity_1.CommentStatus.REMOVED, body: '[deleted]' });
    }
    async sendCommentNotifications(comment, post, author) {
        if (post.authorId !== author.id) {
            await this.notificationsService.create(post.authorId, notification_entity_1.NotificationType.POST_COMMENT, {
                postId: post.id,
                postTitle: post.title,
                commentId: comment.id,
                commenterHandle: author.handle,
            });
        }
        if (comment.parentId) {
            const parent = await this.commentRepo.findOne({
                where: { id: comment.parentId },
                select: ['authorId'],
            });
            if (parent && parent.authorId !== author.id) {
                await this.notificationsService.create(parent.authorId, notification_entity_1.NotificationType.COMMENT_REPLY, {
                    postId: post.id,
                    commentId: comment.id,
                    replierHandle: author.handle,
                });
            }
        }
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        typeorm_2.DataSource])
], CommentsService);
//# sourceMappingURL=comments.service.js.map