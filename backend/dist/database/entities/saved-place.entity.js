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
exports.SavedPlace = exports.SavedPlaceType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const campus_location_entity_1 = require("./campus-location.entity");
var SavedPlaceType;
(function (SavedPlaceType) {
    SavedPlaceType["FAVORITE"] = "favorite";
    SavedPlaceType["FREQUENT"] = "frequent";
    SavedPlaceType["RECENT"] = "recent";
})(SavedPlaceType || (exports.SavedPlaceType = SavedPlaceType = {}));
let SavedPlace = class SavedPlace {
};
exports.SavedPlace = SavedPlace;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SavedPlace.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], SavedPlace.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SavedPlace.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => campus_location_entity_1.CampusLocation, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'locationId' }),
    __metadata("design:type", campus_location_entity_1.CampusLocation)
], SavedPlace.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SavedPlace.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SavedPlaceType, default: SavedPlaceType.FAVORITE }),
    __metadata("design:type", String)
], SavedPlace.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SavedPlace.prototype, "createdAt", void 0);
exports.SavedPlace = SavedPlace = __decorate([
    (0, typeorm_1.Entity)('saved_places'),
    (0, typeorm_1.Unique)(['userId', 'locationId']),
    (0, typeorm_1.Index)(['userId'])
], SavedPlace);
//# sourceMappingURL=saved-place.entity.js.map