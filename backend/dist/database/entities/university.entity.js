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
exports.University = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const community_entity_1 = require("./community.entity");
const major_entity_1 = require("./major.entity");
const course_entity_1 = require("./course.entity");
let University = class University {
};
exports.University = University;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], University.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], University.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], University.prototype, "emailDomain", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], University.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], University.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], University.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], University.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_entity_1.User, (user) => user.university),
    __metadata("design:type", Array)
], University.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => community_entity_1.Community, (c) => c.university),
    __metadata("design:type", Array)
], University.prototype, "communities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => major_entity_1.Major, (m) => m.university),
    __metadata("design:type", Array)
], University.prototype, "majors", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => course_entity_1.Course, (c) => c.university),
    __metadata("design:type", Array)
], University.prototype, "courses", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], University.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], University.prototype, "updatedAt", void 0);
exports.University = University = __decorate([
    (0, typeorm_1.Entity)('universities')
], University);
//# sourceMappingURL=university.entity.js.map