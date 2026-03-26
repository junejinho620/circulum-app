import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professor } from '../../database/entities/professor.entity';
import { ProfessorReview } from '../../database/entities/professor-review.entity';

export interface CreateProfessorReviewDto {
  overall: number;
  clarity: number;
  fairness: number;
  workload: number;
  engagement: number;
  body?: string;
  courseCode?: string;
  tags?: string[];
}

@Injectable()
export class ProfessorsService {
  constructor(
    @InjectRepository(Professor) private profRepo: Repository<Professor>,
    @InjectRepository(ProfessorReview) private reviewRepo: Repository<ProfessorReview>,
  ) {}

  async findAll(universityId: string, department?: string, sort = 'rating', search?: string) {
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
      case 'rating': qb.orderBy('p.avgOverall', 'DESC').addOrderBy('p.name', 'ASC'); break;
      case 'reviews': qb.orderBy('p.reviewCount', 'DESC').addOrderBy('p.name', 'ASC'); break;
      case 'trending': qb.orderBy('p.isTrending', 'DESC').addOrderBy('p.avgOverall', 'DESC'); break;
      default: qb.orderBy('p.name', 'ASC');
    }

    if (!department && !search) {
      qb.take(100);
    }

    return qb.getMany();
  }

  async findById(professorId: string) {
    const prof = await this.profRepo.findOne({ where: { id: professorId } });
    if (!prof) throw new NotFoundException('Professor not found');
    return prof;
  }

  async getReviews(professorId: string, page = 1, limit = 20) {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { professorId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async createReview(professorId: string, userId: string, dto: CreateProfessorReviewDto) {
    const prof = await this.profRepo.findOne({ where: { id: professorId } });
    if (!prof) throw new NotFoundException('Professor not found');

    const existing = await this.reviewRepo.findOne({ where: { professorId, userId } });
    if (existing) throw new ConflictException('You already reviewed this professor');

    const review = await this.reviewRepo.save(
      this.reviewRepo.create({ ...dto, professorId, userId }),
    );

    await this.recomputeAverages(professorId);
    return review;
  }

  private async recomputeAverages(professorId: string) {
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

    // Aggregate top tags
    const tagResults = await this.reviewRepo
      .createQueryBuilder('r')
      .select('r.tags')
      .where('r.professorId = :professorId', { professorId })
      .andWhere('r.tags IS NOT NULL')
      .getMany();

    const tagCounts = new Map<string, number>();
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
}
