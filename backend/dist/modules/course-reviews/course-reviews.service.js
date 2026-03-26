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
exports.CourseReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const course_entity_1 = require("../../database/entities/course.entity");
const course_review_entity_1 = require("../../database/entities/course-review.entity");
let CourseReviewsService = class CourseReviewsService {
    constructor(courseRepo, reviewRepo) {
        this.courseRepo = courseRepo;
        this.reviewRepo = reviewRepo;
    }
    async getCourses(universityId, department, sort = 'rating', search) {
        const qb = this.courseRepo
            .createQueryBuilder('c')
            .where('c.universityId = :universityId', { universityId })
            .andWhere('c.isActive = true');
        if (department) {
            qb.andWhere('c.department = :department', { department });
        }
        if (search) {
            qb.andWhere('(c.code ILIKE :q OR c.name ILIKE :q OR c.department ILIKE :q)', { q: `%${search}%` });
        }
        switch (sort) {
            case 'rating':
                qb.orderBy('c.avgRating', 'DESC').addOrderBy('c.name', 'ASC');
                break;
            case 'difficulty':
                qb.orderBy('c.avgDifficulty', 'ASC').addOrderBy('c.name', 'ASC');
                break;
            case 'reviews':
                qb.orderBy('c.reviewCount', 'DESC').addOrderBy('c.name', 'ASC');
                break;
            default: qb.orderBy('c.name', 'ASC');
        }
        if (!department && !search) {
            qb.take(100);
        }
        return qb.getMany();
    }
    async getCourseDetail(courseId) {
        const course = await this.courseRepo.findOne({ where: { id: courseId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const reviews = await this.reviewRepo.find({ where: { courseId } });
        const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        for (const r of reviews) {
            if (r.grade) {
                const letter = r.grade.charAt(0).toUpperCase();
                if (gradeDistribution[letter] !== undefined)
                    gradeDistribution[letter]++;
            }
        }
        const tips = reviews.filter((r) => r.tips).map((r) => r.tips);
        const pitfalls = reviews.filter((r) => r.pitfalls).map((r) => r.pitfalls);
        const topProfessors = [...new Set(reviews.filter((r) => r.professorName).map((r) => r.professorName))].slice(0, 5);
        return { ...course, gradeDistribution, tips, pitfalls, topProfessors };
    }
    async getReviews(courseId, page = 1, limit = 20) {
        const [items, total] = await this.reviewRepo.findAndCount({
            where: { courseId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit };
    }
    async createReview(courseId, userId, dto) {
        const course = await this.courseRepo.findOne({ where: { id: courseId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const existing = await this.reviewRepo.findOne({ where: { courseId, userId } });
        if (existing)
            throw new common_1.ConflictException('You already reviewed this course');
        const review = await this.reviewRepo.save(this.reviewRepo.create({ ...dto, courseId, userId }));
        await this.recomputeAverages(courseId);
        return review;
    }
    async recomputeAverages(courseId) {
        const result = await this.reviewRepo
            .createQueryBuilder('r')
            .select('AVG(r.rating)', 'avgRating')
            .addSelect('AVG(r.difficulty)', 'avgDifficulty')
            .addSelect('AVG(r.workload)', 'avgWorkload')
            .addSelect('COUNT(*)', 'reviewCount')
            .where('r.courseId = :courseId', { courseId })
            .getRawOne();
        await this.courseRepo.update(courseId, {
            avgRating: parseFloat(result.avgRating) || 0,
            avgDifficulty: parseFloat(result.avgDifficulty) || 0,
            avgWorkload: parseFloat(result.avgWorkload) || 0,
            reviewCount: parseInt(result.reviewCount) || 0,
        });
    }
};
exports.CourseReviewsService = CourseReviewsService;
exports.CourseReviewsService = CourseReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(1, (0, typeorm_1.InjectRepository)(course_review_entity_1.CourseReview)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CourseReviewsService);
//# sourceMappingURL=course-reviews.service.js.map