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
exports.UniversitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const university_entity_1 = require("../../database/entities/university.entity");
const major_entity_1 = require("../../database/entities/major.entity");
const course_entity_1 = require("../../database/entities/course.entity");
const user_course_entity_1 = require("../../database/entities/user-course.entity");
const user_entity_1 = require("../../database/entities/user.entity");
let UniversitiesService = class UniversitiesService {
    constructor(universityRepo, majorRepo, courseRepo, userCourseRepo, userRepo) {
        this.universityRepo = universityRepo;
        this.majorRepo = majorRepo;
        this.courseRepo = courseRepo;
        this.userCourseRepo = userCourseRepo;
        this.userRepo = userRepo;
    }
    async findAll() {
        return this.universityRepo.find({
            where: { isActive: true },
            select: ['id', 'name', 'emailDomain', 'country', 'city', 'logoUrl'],
            order: { name: 'ASC' },
        });
    }
    async findOne(id) {
        const university = await this.universityRepo.findOne({ where: { id, isActive: true } });
        if (!university)
            throw new common_1.NotFoundException('University not found');
        return university;
    }
    async getMajors(universityId) {
        return this.majorRepo.find({
            where: { universityId, isActive: true },
            select: ['id', 'name', 'code'],
            order: { name: 'ASC' },
        });
    }
    async getCourses(universityId, search) {
        const qb = this.courseRepo.createQueryBuilder('course')
            .where('course.universityId = :universityId', { universityId })
            .andWhere('course.isActive = true');
        if (search) {
            qb.andWhere('(course.code ILIKE :search OR course.name ILIKE :search)', {
                search: `%${search}%`,
            });
        }
        return qb.select(['course.id', 'course.code', 'course.name', 'course.department'])
            .orderBy('course.code', 'ASC')
            .limit(50)
            .getMany();
    }
    async enrollCourse(userId, courseId, universityId) {
        const course = await this.courseRepo.findOne({ where: { id: courseId, universityId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const existing = await this.userCourseRepo.findOne({ where: { userId, courseId } });
        if (existing)
            return { message: 'Already enrolled in this course' };
        await this.userCourseRepo.save({ userId, courseId });
        return { message: 'Enrolled in course' };
    }
    async unenrollCourse(userId, courseId) {
        await this.userCourseRepo.delete({ userId, courseId });
        return { message: 'Unenrolled from course' };
    }
    async getUserCourses(userId) {
        return this.userCourseRepo.find({
            where: { userId },
            relations: ['course'],
        });
    }
    async updateMajor(userId, majorId, universityId) {
        const major = await this.majorRepo.findOne({ where: { id: majorId, universityId } });
        if (!major)
            throw new common_1.NotFoundException('Major not found');
        await this.userRepo.update(userId, { majorId });
        return { message: 'Major updated' };
    }
};
exports.UniversitiesService = UniversitiesService;
exports.UniversitiesService = UniversitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(university_entity_1.University)),
    __param(1, (0, typeorm_1.InjectRepository)(major_entity_1.Major)),
    __param(2, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(3, (0, typeorm_1.InjectRepository)(user_course_entity_1.UserCourse)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UniversitiesService);
//# sourceMappingURL=universities.service.js.map