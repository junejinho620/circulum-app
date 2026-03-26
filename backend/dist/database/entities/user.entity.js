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
exports.User = exports.UserStatus = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const university_entity_1 = require("./university.entity");
const major_entity_1 = require("./major.entity");
const post_entity_1 = require("./post.entity");
const comment_entity_1 = require("./comment.entity");
const vote_entity_1 = require("./vote.entity");
const conversation_participant_entity_1 = require("./conversation-participant.entity");
const notification_entity_1 = require("./notification.entity");
const report_entity_1 = require("./report.entity");
const moderation_action_entity_1 = require("./moderation-action.entity");
const user_course_entity_1 = require("./user-course.entity");
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "student";
    UserRole["MODERATOR"] = "moderator";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING_VERIFICATION"] = "pending_verification";
    UserStatus["ACTIVE"] = "active";
    UserStatus["WARNED"] = "warned";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["BANNED"] = "banned";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 30 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "handle", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isEmailVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, select: false }),
    __metadata("design:type", String)
], User.prototype, "emailVerificationToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz', select: false }),
    __metadata("design:type", Date)
], User.prototype, "emailVerificationExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, select: false }),
    __metadata("design:type", String)
], User.prototype, "refreshTokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, select: false }),
    __metadata("design:type", String)
], User.prototype, "passwordResetToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz', select: false }),
    __metadata("design:type", Date)
], User.prototype, "passwordResetExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: UserRole, default: UserRole.STUDENT }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], User.prototype, "suspendedUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "postCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "commentCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "totalKarma", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => university_entity_1.University, (u) => u.users, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'universityId' }),
    __metadata("design:type", university_entity_1.University)
], User.prototype, "university", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "universityId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => major_entity_1.Major, (m) => m.users, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'majorId' }),
    __metadata("design:type", major_entity_1.Major)
], User.prototype, "major", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "majorId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_course_entity_1.UserCourse, (uc) => uc.user),
    __metadata("design:type", Array)
], User.prototype, "userCourses", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => post_entity_1.Post, (p) => p.author),
    __metadata("design:type", Array)
], User.prototype, "posts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, (c) => c.author),
    __metadata("design:type", Array)
], User.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => vote_entity_1.Vote, (v) => v.user),
    __metadata("design:type", Array)
], User.prototype, "votes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => conversation_participant_entity_1.ConversationParticipant, (cp) => cp.user),
    __metadata("design:type", Array)
], User.prototype, "conversationParticipants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => notification_entity_1.Notification, (n) => n.user),
    __metadata("design:type", Array)
], User.prototype, "notifications", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => report_entity_1.Report, (r) => r.reporter),
    __metadata("design:type", Array)
], User.prototype, "reports", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => moderation_action_entity_1.ModerationAction, (ma) => ma.targetUser),
    __metadata("design:type", Array)
], User.prototype, "moderationActions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], User.prototype, "interests", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "pushToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], User.prototype, "lastSeenAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map