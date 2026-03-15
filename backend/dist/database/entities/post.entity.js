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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = exports.PostStatus = exports.PostCategory = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const community_entity_1 = require("./community.entity");
const comment_entity_1 = require("./comment.entity");
const vote_entity_1 = require("./vote.entity");
const report_entity_1 = require("./report.entity");
var PostCategory;
(function (PostCategory) {
    PostCategory["GENERAL"] = "general";
    PostCategory["STUDY"] = "study";
    PostCategory["MEME"] = "meme";
    PostCategory["EVENT"] = "event";
    PostCategory["BUY_SELL"] = "buy_sell";
    PostCategory["LOST_FOUND"] = "lost_found";
})(PostCategory || (exports.PostCategory = PostCategory = {}));
var PostStatus;
(function (PostStatus) {
    PostStatus["ACTIVE"] = "active";
    PostStatus["REMOVED"] = "removed";
    PostStatus["FLAGGED"] = "flagged";
})(PostStatus || (exports.PostStatus = PostStatus = {}));
let Post = class Post {
};
exports.Post = Post;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Post.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], Post.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Post.prototype, "imageUrls", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PostCategory, default: PostCategory.GENERAL }),
    __metadata("design:type", String)
], Post.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PostStatus, default: PostStatus.ACTIVE }),
    __metadata("design:type", String)
], Post.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Post.prototype, "hotScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "upvotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "downvotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "commentCount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.posts, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'authorId' }),
    __metadata("design:type", user_entity_1.User)
], Post.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Post.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => community_entity_1.Community, (c) => c.posts, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'communityId' }),
    __metadata("design:type", community_entity_1.Community)
], Post.prototype, "community", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Post.prototype, "communityId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Post.prototype, "universityId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, (c) => c.post),
    __metadata("design:type", Array)
], Post.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => vote_entity_1.Vote, (v) => v.post),
    __metadata("design:type", Array)
], Post.prototype, "votes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => report_entity_1.Report, (r) => r.post),
    __metadata("design:type", Array)
], Post.prototype, "reports", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Post.prototype, "isLocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "removedReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], Post.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Post.prototype, "updatedAt", void 0);
exports.Post = Post = __decorate([
    (0, typeorm_1.Entity)('posts'),
    (0, typeorm_1.Index)(['communityId', 'createdAt']),
    (0, typeorm_1.Index)(['communityId', 'hotScore']),
    (0, typeorm_1.Index)(['universityId', 'createdAt'])
], Post);
//# sourceMappingURL=post.entity.js.map