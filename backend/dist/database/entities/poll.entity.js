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
exports.Poll = exports.PollStatus = exports.PollType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const community_entity_1 = require("./community.entity");
const poll_option_entity_1 = require("./poll-option.entity");
const poll_vote_entity_1 = require("./poll-vote.entity");
var PollType;
(function (PollType) {
    PollType["SINGLE"] = "single";
    PollType["MULTIPLE"] = "multiple";
})(PollType || (exports.PollType = PollType = {}));
var PollStatus;
(function (PollStatus) {
    PollStatus["ACTIVE"] = "active";
    PollStatus["CLOSED"] = "closed";
    PollStatus["REMOVED"] = "removed";
})(PollStatus || (exports.PollStatus = PollStatus = {}));
let Poll = class Poll {
};
exports.Poll = Poll;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Poll.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], Poll.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PollType, default: PollType.SINGLE }),
    __metadata("design:type", String)
], Poll.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PollStatus, default: PollStatus.ACTIVE }),
    __metadata("design:type", String)
], Poll.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Poll.prototype, "isAnonymous", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Poll.prototype, "totalVotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Poll.prototype, "endsAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'authorId' }),
    __metadata("design:type", user_entity_1.User)
], Poll.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Poll.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => community_entity_1.Community, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'communityId' }),
    __metadata("design:type", community_entity_1.Community)
], Poll.prototype, "community", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Poll.prototype, "communityId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Poll.prototype, "universityId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => poll_option_entity_1.PollOption, (o) => o.poll, { cascade: true }),
    __metadata("design:type", Array)
], Poll.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => poll_vote_entity_1.PollVote, (v) => v.poll),
    __metadata("design:type", Array)
], Poll.prototype, "votes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Poll.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Poll.prototype, "updatedAt", void 0);
exports.Poll = Poll = __decorate([
    (0, typeorm_1.Entity)('polls'),
    (0, typeorm_1.Index)(['universityId', 'createdAt']),
    (0, typeorm_1.Index)(['communityId', 'createdAt'])
], Poll);
//# sourceMappingURL=poll.entity.js.map