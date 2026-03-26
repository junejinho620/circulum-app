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
exports.PollVote = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const poll_entity_1 = require("./poll.entity");
const poll_option_entity_1 = require("./poll-option.entity");
let PollVote = class PollVote {
};
exports.PollVote = PollVote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PollVote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], PollVote.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PollVote.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => poll_entity_1.Poll, (p) => p.votes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'pollId' }),
    __metadata("design:type", poll_entity_1.Poll)
], PollVote.prototype, "poll", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PollVote.prototype, "pollId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => poll_option_entity_1.PollOption, (o) => o.votes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'optionId' }),
    __metadata("design:type", poll_option_entity_1.PollOption)
], PollVote.prototype, "option", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PollVote.prototype, "optionId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PollVote.prototype, "createdAt", void 0);
exports.PollVote = PollVote = __decorate([
    (0, typeorm_1.Entity)('poll_votes'),
    (0, typeorm_1.Unique)(['userId', 'pollId', 'optionId'])
], PollVote);
//# sourceMappingURL=poll-vote.entity.js.map