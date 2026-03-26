"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampusMapModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const campus_location_entity_1 = require("../../database/entities/campus-location.entity");
const campus_event_entity_1 = require("../../database/entities/campus-event.entity");
const saved_place_entity_1 = require("../../database/entities/saved-place.entity");
const campus_map_service_1 = require("./campus-map.service");
const campus_map_controller_1 = require("./campus-map.controller");
let CampusMapModule = class CampusMapModule {
};
exports.CampusMapModule = CampusMapModule;
exports.CampusMapModule = CampusMapModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([campus_location_entity_1.CampusLocation, campus_event_entity_1.CampusEvent, saved_place_entity_1.SavedPlace])],
        controllers: [campus_map_controller_1.CampusMapController],
        providers: [campus_map_service_1.CampusMapService],
        exports: [campus_map_service_1.CampusMapService],
    })
], CampusMapModule);
//# sourceMappingURL=campus-map.module.js.map