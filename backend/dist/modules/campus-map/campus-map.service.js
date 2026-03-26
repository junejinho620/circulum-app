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
exports.CampusMapService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const campus_location_entity_1 = require("../../database/entities/campus-location.entity");
const campus_event_entity_1 = require("../../database/entities/campus-event.entity");
const saved_place_entity_1 = require("../../database/entities/saved-place.entity");
let CampusMapService = class CampusMapService {
    constructor(locationRepo, eventRepo, savedRepo) {
        this.locationRepo = locationRepo;
        this.eventRepo = eventRepo;
        this.savedRepo = savedRepo;
    }
    async getLocations(universityId, category) {
        const qb = this.locationRepo
            .createQueryBuilder('l')
            .where('l.universityId = :universityId', { universityId })
            .andWhere('l.isActive = true');
        if (category) {
            qb.andWhere('l.category = :category', { category });
        }
        return qb.orderBy('l.name', 'ASC').getMany();
    }
    async getLocationDetail(locationId) {
        const location = await this.locationRepo.findOne({
            where: { id: locationId },
            relations: ['events'],
        });
        if (!location)
            throw new common_1.NotFoundException('Location not found');
        return location;
    }
    async getUpcomingEvents(universityId) {
        return this.eventRepo.find({
            where: {
                universityId,
                startTime: (0, typeorm_2.MoreThan)(new Date()),
            },
            relations: ['location'],
            order: { startTime: 'ASC' },
            take: 20,
        });
    }
    async getEventsAtLocation(locationId) {
        return this.eventRepo.find({
            where: {
                locationId,
                startTime: (0, typeorm_2.MoreThan)(new Date()),
            },
            order: { startTime: 'ASC' },
        });
    }
    async getSavedPlaces(userId) {
        return this.savedRepo.find({
            where: { userId },
            relations: ['location'],
            order: { createdAt: 'DESC' },
        });
    }
    async toggleSaved(userId, locationId, type = 'favorite') {
        const existing = await this.savedRepo.findOne({ where: { userId, locationId } });
        if (existing) {
            await this.savedRepo.remove(existing);
            return { saved: false };
        }
        await this.savedRepo.save(this.savedRepo.create({ userId, locationId, type: type }));
        return { saved: true };
    }
    async removeSaved(userId, locationId) {
        await this.savedRepo.delete({ userId, locationId });
        return { success: true };
    }
};
exports.CampusMapService = CampusMapService;
exports.CampusMapService = CampusMapService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(campus_location_entity_1.CampusLocation)),
    __param(1, (0, typeorm_1.InjectRepository)(campus_event_entity_1.CampusEvent)),
    __param(2, (0, typeorm_1.InjectRepository)(saved_place_entity_1.SavedPlace)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CampusMapService);
//# sourceMappingURL=campus-map.service.js.map