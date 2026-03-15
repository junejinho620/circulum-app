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
exports.Community = exports.CommunityType = void 0;
const typeorm_1 = require("typeorm");
const university_entity_1 = require("./university.entity");
const post_entity_1 = require("./post.entity");
const community_member_entity_1 = require("./community-member.entity");
var CommunityType;
(function (CommunityType) {
    CommunityType["CAMPUS"] = "campus";
    CommunityType["MAJOR"] = "major";
    CommunityType["COURSE"] = "course";
    CommunityType["CUSTOM"] = "custom";
})(CommunityType || (exports.CommunityType = CommunityType = {}));
let Community = class Community {
};
exports.Community = Community;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Community.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Community.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Community.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Community.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CommunityType }),
    __metadata("design:type", String)
], Community.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Community.prototype, "iconUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Community.prototype, "bannerUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Community.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => university_entity_1.University, (u) => u.communities),
    (0, typeorm_1.JoinColumn)({ name: 'universityId' }),
    __metadata("design:type", university_entity_1.University)
], Community.prototype, "university", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Community.prototype, "universityId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => post_entity_1.Post, (p) => p.community),
    __metadata("design:type", Array)
], Community.prototype, "posts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => community_member_entity_1.CommunityMember, (cm) => cm.community),
    __metadata("design:type", Array)
], Community.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Community.prototype, "memberCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Community.prototype, "postCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Community.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Community.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Community.prototype, "updatedAt", void 0);
exports.Community = Community = __decorate([
    (0, typeorm_1.Entity)('communities'),
    (0, typeorm_1.Index)(['slug', 'universityId'], { unique: true })
], Community);
//# sourceMappingURL=community.entity.js.map