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
exports.UserBlock = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserBlock = class UserBlock {
};
exports.UserBlock = UserBlock;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserBlock.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'blockerId' }),
    __metadata("design:type", user_entity_1.User)
], UserBlock.prototype, "blocker", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserBlock.prototype, "blockerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'blockedId' }),
    __metadata("design:type", user_entity_1.User)
], UserBlock.prototype, "blocked", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserBlock.prototype, "blockedId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserBlock.prototype, "createdAt", void 0);
exports.UserBlock = UserBlock = __decorate([
    (0, typeorm_1.Entity)('user_blocks'),
    (0, typeorm_1.Unique)(['blockerId', 'blockedId']),
    (0, typeorm_1.Index)(['blockerId']),
    (0, typeorm_1.Index)(['blockedId'])
], UserBlock);
//# sourceMappingURL=user-block.entity.js.map