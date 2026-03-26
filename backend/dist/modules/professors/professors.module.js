"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessorsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const professor_entity_1 = require("../../database/entities/professor.entity");
const professor_review_entity_1 = require("../../database/entities/professor-review.entity");
const professors_service_1 = require("./professors.service");
const professors_controller_1 = require("./professors.controller");
let ProfessorsModule = class ProfessorsModule {
};
exports.ProfessorsModule = ProfessorsModule;
exports.ProfessorsModule = ProfessorsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([professor_entity_1.Professor, professor_review_entity_1.ProfessorReview])],
        controllers: [professors_controller_1.ProfessorsController],
        providers: [professors_service_1.ProfessorsService],
        exports: [professors_service_1.ProfessorsService],
    })
], ProfessorsModule);
//# sourceMappingURL=professors.module.js.map