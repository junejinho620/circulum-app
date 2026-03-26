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
exports.CampusEvent = void 0;
const typeorm_1 = require("typeorm");
const campus_location_entity_1 = require("./campus-location.entity");
let CampusEvent = class CampusEvent {
};
exports.CampusEvent = CampusEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampusEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], CampusEvent.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => campus_location_entity_1.CampusLocation, (l) => l.events, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'locationId' }),
    __metadata("design:type", campus_location_entity_1.CampusLocation)
], CampusEvent.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CampusEvent.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CampusEvent.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CampusEvent.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CampusEvent.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], CampusEvent.prototype, "participantCount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CampusEvent.prototype, "universityId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CampusEvent.prototype, "createdAt", void 0);
exports.CampusEvent = CampusEvent = __decorate([
    (0, typeorm_1.Entity)('campus_events'),
    (0, typeorm_1.Index)(['universityId', 'startTime'])
], CampusEvent);
//# sourceMappingURL=campus-event.entity.js.map