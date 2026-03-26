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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampusMapController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../database/entities/user.entity");
const campus_map_service_1 = require("./campus-map.service");
let CampusMapController = class CampusMapController {
    constructor(service) {
        this.service = service;
    }
    getLocations(user, category) {
        return this.service.getLocations(user.universityId, category);
    }
    getLocationDetail(id) {
        return this.service.getLocationDetail(id);
    }
    getEvents(user) {
        return this.service.getUpcomingEvents(user.universityId);
    }
    getEventsAtLocation(id) {
        return this.service.getEventsAtLocation(id);
    }
    getSaved(user) {
        return this.service.getSavedPlaces(user.id);
    }
    toggleSaved(user, locationId, body) {
        return this.service.toggleSaved(user.id, locationId, body?.type);
    }
    removeSaved(user, locationId) {
        return this.service.removeSaved(user.id, locationId);
    }
};
exports.CampusMapController = CampusMapController;
__decorate([
    (0, common_1.Get)('locations'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], CampusMapController.prototype, "getLocations", null);
__decorate([
    (0, common_1.Get)('locations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CampusMapController.prototype, "getLocationDetail", null);
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", void 0)
], CampusMapController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('locations/:id/events'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CampusMapController.prototype, "getEventsAtLocation", null);
__decorate([
    (0, common_1.Get)('saved'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", void 0)
], CampusMapController.prototype, "getSaved", null);
__decorate([
    (0, common_1.Post)('saved/:locationId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('locationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, Object]),
    __metadata("design:returntype", void 0)
], CampusMapController.prototype, "toggleSaved", null);
__decorate([
    (0, common_1.Delete)('saved/:locationId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('locationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], CampusMapController.prototype, "removeSaved", null);
exports.CampusMapController = CampusMapController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('campus'),
    __metadata("design:paramtypes", [campus_map_service_1.CampusMapService])
], CampusMapController);
//# sourceMappingURL=campus-map.controller.js.map