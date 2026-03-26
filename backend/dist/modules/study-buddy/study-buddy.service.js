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
exports.StudyBuddyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const study_buddy_profile_entity_1 = require("../../database/entities/study-buddy-profile.entity");
const study_session_entity_1 = require("../../database/entities/study-session.entity");
const study_session_participant_entity_1 = require("../../database/entities/study-session-participant.entity");
const user_course_entity_1 = require("../../database/entities/user-course.entity");
let StudyBuddyService = class StudyBuddyService {
    constructor(profileRepo, sessionRepo, participantRepo, userCourseRepo) {
        this.profileRepo = profileRepo;
        this.sessionRepo = sessionRepo;
        this.participantRepo = participantRepo;
        this.userCourseRepo = userCourseRepo;
    }
    async getOrCreateProfile(userId, universityId) {
        let profile = await this.profileRepo.findOne({ where: { userId }, relations: ['user'] });
        if (!profile) {
            profile = await this.profileRepo.save(this.profileRepo.create({ userId, universityId }));
        }
        return profile;
    }
    async updateProfile(userId, universityId, dto) {
        let profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile) {
            profile = this.profileRepo.create({ userId, universityId });
        }
        Object.assign(profile, dto);
        return this.profileRepo.save(profile);
    }
    async findMatches(userId, universityId) {
        const myProfile = await this.profileRepo.findOne({ where: { userId } });
        const myCourses = myProfile?.courses ?? [];
        if (myCourses.length === 0) {
            const enrollments = await this.userCourseRepo.find({
                where: { userId },
                relations: ['course'],
            });
            myCourses.push(...enrollments.map((e) => e.course?.code).filter(Boolean));
        }
        const candidates = await this.profileRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.user', 'user')
            .where('p.universityId = :universityId', { universityId })
            .andWhere('p.userId != :userId', { userId })
            .andWhere('p.isVisible = true')
            .getMany();
        return candidates.map((c) => {
            const theirCourses = c.courses ?? [];
            const sharedCourses = myCourses.filter((mc) => theirCourses.includes(mc));
            const courseOverlap = myCourses.length > 0 ? sharedCourses.length / myCourses.length : 0;
            const intensityMatch = myProfile?.intensity === c.intensity ? 1 : 0.5;
            const prefMatch = myProfile?.preference === c.preference || c.preference === 'both' ? 1 : 0.5;
            const compatibility = Math.round((courseOverlap * 50 + intensityMatch * 25 + prefMatch * 25));
            return {
                id: c.id,
                userId: c.userId,
                name: c.user?.handle ?? 'Anonymous',
                initial: (c.user?.handle ?? 'A').charAt(0).toUpperCase(),
                courses: theirCourses,
                sharedCourses,
                freeSlots: c.availability ?? [],
                intensity: c.intensity,
                location: c.location ?? 'Not set',
                preference: c.preference,
                bio: c.bio ?? '',
                studyStyle: c.studyStyle ?? [],
                reliability: c.reliability,
                sessionsCompleted: c.sessionsCompleted,
                compatibility,
                active: true,
            };
        }).sort((a, b) => b.compatibility - a.compatibility);
    }
    async getSessions(universityId) {
        return this.sessionRepo.find({
            where: { universityId, isPublic: true },
            relations: ['creator', 'participants', 'participants.user'],
            order: { date: 'ASC' },
        });
    }
    async createSession(userId, universityId, dto) {
        const session = await this.sessionRepo.save(this.sessionRepo.create({
            ...dto,
            date: new Date(dto.date),
            creatorId: userId,
            universityId,
            participantCount: 1,
        }));
        await this.participantRepo.save(this.participantRepo.create({ sessionId: session.id, userId }));
        return session;
    }
    async joinSession(sessionId, userId) {
        const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        if (session.participantCount >= session.maxParticipants) {
            throw new common_1.BadRequestException('Session is full');
        }
        const existing = await this.participantRepo.findOne({ where: { sessionId, userId } });
        if (existing)
            throw new common_1.ConflictException('Already joined');
        await this.participantRepo.save(this.participantRepo.create({ sessionId, userId }));
        await this.sessionRepo.increment({ id: sessionId }, 'participantCount', 1);
        return { success: true };
    }
    async leaveSession(sessionId, userId) {
        const result = await this.participantRepo.delete({ sessionId, userId });
        if (result.affected) {
            await this.sessionRepo.decrement({ id: sessionId }, 'participantCount', 1);
        }
        return { success: true };
    }
};
exports.StudyBuddyService = StudyBuddyService;
exports.StudyBuddyService = StudyBuddyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(study_buddy_profile_entity_1.StudyBuddyProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(study_session_entity_1.StudySession)),
    __param(2, (0, typeorm_1.InjectRepository)(study_session_participant_entity_1.StudySessionParticipant)),
    __param(3, (0, typeorm_1.InjectRepository)(user_course_entity_1.UserCourse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StudyBuddyService);
//# sourceMappingURL=study-buddy.service.js.map