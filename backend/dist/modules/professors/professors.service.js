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
exports.ProfessorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const professor_entity_1 = require("../../database/entities/professor.entity");
const professor_review_entity_1 = require("../../database/entities/professor-review.entity");
let ProfessorsService = class ProfessorsService {
    constructor(profRepo, reviewRepo) {
        this.profRepo = profRepo;
        this.reviewRepo = reviewRepo;
    }
    async findAll(universityId, department, sort = 'rating', search) {
        const qb = this.profRepo
            .createQueryBuilder('p')
            .where('p.universityId = :universityId', { universityId });
        if (department) {
            qb.andWhere('p.department = :department', { department });
        }
        if (search) {
            qb.andWhere('(p.name ILIKE :q OR p.department ILIKE :q)', { q: `%${search}%` });
        }
        switch (sort) {
            case 'rating':
                qb.orderBy('p.avgOverall', 'DESC').addOrderBy('p.name', 'ASC');
                break;
            case 'reviews':
                qb.orderBy('p.reviewCount', 'DESC').addOrderBy('p.name', 'ASC');
                break;
            case 'trending':
                qb.orderBy('p.isTrending', 'DESC').addOrderBy('p.avgOverall', 'DESC');
                break;
            default: qb.orderBy('p.name', 'ASC');
        }
        if (!department && !search) {
            qb.take(100);
        }
        return qb.getMany();
    }
    async findById(professorId) {
        const prof = await this.profRepo.findOne({ where: { id: professorId } });
        if (!prof)
            throw new common_1.NotFoundException('Professor not found');
        return prof;
    }
    async getReviews(professorId, page = 1, limit = 20) {
        const [items, total] = await this.reviewRepo.findAndCount({
            where: { professorId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit };
    }
    async createReview(professorId, userId, dto) {
        const prof = await this.profRepo.findOne({ where: { id: professorId } });
        if (!prof)
            throw new common_1.NotFoundException('Professor not found');
        const existing = await this.reviewRepo.findOne({ where: { professorId, userId } });
        if (existing)
            throw new common_1.ConflictException('You already reviewed this professor');
        const review = await this.reviewRepo.save(this.reviewRepo.create({ ...dto, professorId, userId }));
        await this.recomputeAverages(professorId);
        return review;
    }
    async recomputeAverages(professorId) {
        const result = await this.reviewRepo
            .createQueryBuilder('r')
            .select('AVG(r.overall)', 'avgOverall')
            .addSelect('AVG(r.clarity)', 'avgClarity')
            .addSelect('AVG(r.fairness)', 'avgFairness')
            .addSelect('AVG(r.workload)', 'avgWorkload')
            .addSelect('AVG(r.engagement)', 'avgEngagement')
            .addSelect('COUNT(*)', 'reviewCount')
            .where('r.professorId = :professorId', { professorId })
            .getRawOne();
        const tagResults = await this.reviewRepo
            .createQueryBuilder('r')
            .select('r.tags')
            .where('r.professorId = :professorId', { professorId })
            .andWhere('r.tags IS NOT NULL')
            .getMany();
        const tagCounts = new Map();
        for (const r of tagResults) {
            if (r.tags) {
                for (const tag of r.tags) {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                }
            }
        }
        const topTags = [...tagCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag);
        await this.profRepo.update(professorId, {
            avgOverall: parseFloat(result.avgOverall) || 0,
            avgClarity: parseFloat(result.avgClarity) || 0,
            avgFairness: parseFloat(result.avgFairness) || 0,
            avgWorkload: parseFloat(result.avgWorkload) || 0,
            avgEngagement: parseFloat(result.avgEngagement) || 0,
            reviewCount: parseInt(result.reviewCount) || 0,
            tags: topTags,
        });
    }
};
exports.ProfessorsService = ProfessorsService;
exports.ProfessorsService = ProfessorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(professor_entity_1.Professor)),
    __param(1, (0, typeorm_1.InjectRepository)(professor_review_entity_1.ProfessorReview)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProfessorsService);
//# sourceMappingURL=professors.service.js.map