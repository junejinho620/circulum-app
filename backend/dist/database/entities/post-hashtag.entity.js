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
exports.PostHashtag = void 0;
const typeorm_1 = require("typeorm");
const post_entity_1 = require("./post.entity");
const hashtag_entity_1 = require("./hashtag.entity");
let PostHashtag = class PostHashtag {
};
exports.PostHashtag = PostHashtag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PostHashtag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.Post, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'postId' }),
    __metadata("design:type", post_entity_1.Post)
], PostHashtag.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PostHashtag.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hashtag_entity_1.Hashtag, (h) => h.postHashtags, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'hashtagId' }),
    __metadata("design:type", hashtag_entity_1.Hashtag)
], PostHashtag.prototype, "hashtag", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PostHashtag.prototype, "hashtagId", void 0);
exports.PostHashtag = PostHashtag = __decorate([
    (0, typeorm_1.Entity)('post_hashtags'),
    (0, typeorm_1.Unique)(['postId', 'hashtagId'])
], PostHashtag);
//# sourceMappingURL=post-hashtag.entity.js.map