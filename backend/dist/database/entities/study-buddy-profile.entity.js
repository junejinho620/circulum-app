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
exports.StudyBuddyProfile = exports.StudyPreference = exports.StudyIntensity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var StudyIntensity;
(function (StudyIntensity) {
    StudyIntensity["LIGHT"] = "light";
    StudyIntensity["MODERATE"] = "moderate";
    StudyIntensity["INTENSE"] = "intense";
})(StudyIntensity || (exports.StudyIntensity = StudyIntensity = {}));
var StudyPreference;
(function (StudyPreference) {
    StudyPreference["IN_PERSON"] = "in_person";
    StudyPreference["ONLINE"] = "online";
    StudyPreference["BOTH"] = "both";
})(StudyPreference || (exports.StudyPreference = StudyPreference = {}));
let StudyBuddyProfile = class StudyBuddyProfile {
};
exports.StudyBuddyProfile = StudyBuddyProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StudyBuddyProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], StudyBuddyProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], StudyBuddyProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudyBuddyProfile.prototype, "universityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: StudyIntensity, default: StudyIntensity.MODERATE }),
    __metadata("design:type", String)
], StudyBuddyProfile.prototype, "intensity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], StudyBuddyProfile.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: StudyPreference, default: StudyPreference.BOTH }),
    __metadata("design:type", String)
], StudyBuddyProfile.prototype, "preference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StudyBuddyProfile.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], StudyBuddyProfile.prototype, "studyStyle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], StudyBuddyProfile.prototype, "availability", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], StudyBuddyProfile.prototype, "courses", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StudyBuddyProfile.prototype, "isVisible", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], StudyBuddyProfile.prototype, "sessionsCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 80 }),
    __metadata("design:type", Number)
], StudyBuddyProfile.prototype, "reliability", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudyBuddyProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudyBuddyProfile.prototype, "updatedAt", void 0);
exports.StudyBuddyProfile = StudyBuddyProfile = __decorate([
    (0, typeorm_1.Entity)('study_buddy_profiles'),
    (0, typeorm_1.Index)(['universityId', 'isVisible'])
], StudyBuddyProfile);
//# sourceMappingURL=study-buddy-profile.entity.js.map