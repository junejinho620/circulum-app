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
exports.ScheduleBlock = exports.BlockType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var BlockType;
(function (BlockType) {
    BlockType["CLASS"] = "class";
    BlockType["EVENT"] = "event";
    BlockType["PERSONAL"] = "personal";
})(BlockType || (exports.BlockType = BlockType = {}));
let ScheduleBlock = class ScheduleBlock {
};
exports.ScheduleBlock = ScheduleBlock;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ScheduleBlock.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], ScheduleBlock.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], ScheduleBlock.prototype, "subtitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], ScheduleBlock.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], ScheduleBlock.prototype, "professor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], ScheduleBlock.prototype, "day", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ScheduleBlock.prototype, "startHour", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ScheduleBlock.prototype, "endHour", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 0 }),
    __metadata("design:type", Number)
], ScheduleBlock.prototype, "colorIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: BlockType, default: BlockType.CLASS }),
    __metadata("design:type", String)
], ScheduleBlock.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], ScheduleBlock.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScheduleBlock.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleBlock.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleBlock.prototype, "updatedAt", void 0);
exports.ScheduleBlock = ScheduleBlock = __decorate([
    (0, typeorm_1.Entity)('schedule_blocks'),
    (0, typeorm_1.Index)(['userId', 'day'])
], ScheduleBlock);
//# sourceMappingURL=schedule-block.entity.js.map