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
exports.CampusLocation = exports.LocationCategory = void 0;
const typeorm_1 = require("typeorm");
const university_entity_1 = require("./university.entity");
const campus_event_entity_1 = require("./campus-event.entity");
var LocationCategory;
(function (LocationCategory) {
    LocationCategory["LECTURES"] = "lectures";
    LocationCategory["STUDY"] = "study";
    LocationCategory["FOOD"] = "food";
    LocationCategory["EVENTS"] = "events";
    LocationCategory["QUIET"] = "quiet";
    LocationCategory["POPULAR"] = "popular";
})(LocationCategory || (exports.LocationCategory = LocationCategory = {}));
let CampusLocation = class CampusLocation {
};
exports.CampusLocation = CampusLocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CampusLocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], CampusLocation.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], CampusLocation.prototype, "subtitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: LocationCategory }),
    __metadata("design:type", String)
], CampusLocation.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], CampusLocation.prototype, "building", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], CampusLocation.prototype, "floor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], CampusLocation.prototype, "coordX", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], CampusLocation.prototype, "coordY", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], CampusLocation.prototype, "avgRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], CampusLocation.prototype, "currentOccupancy", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], CampusLocation.prototype, "bestTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], CampusLocation.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => university_entity_1.University),
    (0, typeorm_1.JoinColumn)({ name: 'universityId' }),
    __metadata("design:type", university_entity_1.University)
], CampusLocation.prototype, "university", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CampusLocation.prototype, "universityId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => campus_event_entity_1.CampusEvent, (e) => e.location),
    __metadata("design:type", Array)
], CampusLocation.prototype, "events", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], CampusLocation.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CampusLocation.prototype, "createdAt", void 0);
exports.CampusLocation = CampusLocation = __decorate([
    (0, typeorm_1.Entity)('campus_locations'),
    (0, typeorm_1.Index)(['universityId', 'category'])
], CampusLocation);
//# sourceMappingURL=campus-location.entity.js.map