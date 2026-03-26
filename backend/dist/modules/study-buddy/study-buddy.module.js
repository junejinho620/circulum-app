"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyBuddyModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const study_buddy_profile_entity_1 = require("../../database/entities/study-buddy-profile.entity");
const study_session_entity_1 = require("../../database/entities/study-session.entity");
const study_session_participant_entity_1 = require("../../database/entities/study-session-participant.entity");
const user_course_entity_1 = require("../../database/entities/user-course.entity");
const course_entity_1 = require("../../database/entities/course.entity");
const study_buddy_service_1 = require("./study-buddy.service");
const study_buddy_controller_1 = require("./study-buddy.controller");
let StudyBuddyModule = class StudyBuddyModule {
};
exports.StudyBuddyModule = StudyBuddyModule;
exports.StudyBuddyModule = StudyBuddyModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([
                study_buddy_profile_entity_1.StudyBuddyProfile, study_session_entity_1.StudySession, study_session_participant_entity_1.StudySessionParticipant,
                user_course_entity_1.UserCourse, course_entity_1.Course,
            ])],
        controllers: [study_buddy_controller_1.StudyBuddyController],
        providers: [study_buddy_service_1.StudyBuddyService],
        exports: [study_buddy_service_1.StudyBuddyService],
    })
], StudyBuddyModule);
//# sourceMappingURL=study-buddy.module.js.map