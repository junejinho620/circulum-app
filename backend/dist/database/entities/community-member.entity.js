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
exports.CommunityMember = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const community_entity_1 = require("./community.entity");
let CommunityMember = class CommunityMember {
};
exports.CommunityMember = CommunityMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CommunityMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], CommunityMember.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CommunityMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => community_entity_1.Community, (c) => c.members, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'communityId' }),
    __metadata("design:type", community_entity_1.Community)
], CommunityMember.prototype, "community", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CommunityMember.prototype, "communityId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CommunityMember.prototype, "joinedAt", void 0);
exports.CommunityMember = CommunityMember = __decorate([
    (0, typeorm_1.Entity)('community_members'),
    (0, typeorm_1.Index)(['userId', 'communityId'], { unique: true })
], CommunityMember);
//# sourceMappingURL=community-member.entity.js.map