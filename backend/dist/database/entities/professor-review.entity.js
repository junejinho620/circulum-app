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
exports.ProfessorReview = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const professor_entity_1 = require("./professor.entity");
let ProfessorReview = class ProfessorReview {
};
exports.ProfessorReview = ProfessorReview;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProfessorReview.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], ProfessorReview.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProfessorReview.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => professor_entity_1.Professor, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'professorId' }),
    __metadata("design:type", professor_entity_1.Professor)
], ProfessorReview.prototype, "professor", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProfessorReview.prototype, "professorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], ProfessorReview.prototype, "courseCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], ProfessorReview.prototype, "overall", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], ProfessorReview.prototype, "clarity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], ProfessorReview.prototype, "fairness", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], ProfessorReview.prototype, "workload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], ProfessorReview.prototype, "engagement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProfessorReview.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], ProfessorReview.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProfessorReview.prototype, "createdAt", void 0);
exports.ProfessorReview = ProfessorReview = __decorate([
    (0, typeorm_1.Entity)('professor_reviews'),
    (0, typeorm_1.Unique)(['userId', 'professorId']),
    (0, typeorm_1.Index)(['professorId', 'createdAt'])
], ProfessorReview);
//# sourceMappingURL=professor-review.entity.js.map