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
exports.ModerationAction = exports.ModerationActionType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var ModerationActionType;
(function (ModerationActionType) {
    ModerationActionType["WARN"] = "warn";
    ModerationActionType["REMOVE_CONTENT"] = "remove_content";
    ModerationActionType["SUSPEND"] = "suspend";
    ModerationActionType["BAN"] = "ban";
    ModerationActionType["UNBAN"] = "unban";
})(ModerationActionType || (exports.ModerationActionType = ModerationActionType = {}));
let ModerationAction = class ModerationAction {
};
exports.ModerationAction = ModerationAction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ModerationAction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ModerationActionType }),
    __metadata("design:type", String)
], ModerationAction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ModerationAction.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.moderationActions, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'targetUserId' }),
    __metadata("design:type", user_entity_1.User)
], ModerationAction.prototype, "targetUser", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ModerationAction.prototype, "targetUserId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ModerationAction.prototype, "moderatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ModerationAction.prototype, "contentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ModerationAction.prototype, "contentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ModerationAction.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], ModerationAction.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'jsonb' }),
    __metadata("design:type", Object)
], ModerationAction.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ModerationAction.prototype, "createdAt", void 0);
exports.ModerationAction = ModerationAction = __decorate([
    (0, typeorm_1.Entity)('moderation_actions'),
    (0, typeorm_1.Index)(['targetUserId', 'createdAt'])
], ModerationAction);
//# sourceMappingURL=moderation-action.entity.js.map