import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../database/entities/course.entity';
import { CourseReview } from '../../database/entities/course-review.entity';

export interface CreateCourseReviewDto {
  difficulty: number;
  workload: number;
  rating: number;
  body?: string;
  tips?: string;
  pitfalls?: string;
  professorName?: string;
  term?: string;
  grade?: string;
}

@Injectable()
export class CourseReviewsService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(CourseReview) private reviewRepo: Repository<CourseReview>,
  ) {}

  async getCourses(universityId: string, department?: string, sort = 'rating', search?: string) {
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
      case 'rating': qb.orderBy('c.avgRating', 'DESC').addOrderBy('c.name', 'ASC'); break;
      case 'difficulty': qb.orderBy('c.avgDifficulty', 'ASC').addOrderBy('c.name', 'ASC'); break;
      case 'reviews': qb.orderBy('c.reviewCount', 'DESC').addOrderBy('c.name', 'ASC'); break;
      default: qb.orderBy('c.name', 'ASC');
    }

    // When filtering by department or search, return all matches; otherwise cap at 100
    if (!department && !search) {
      qb.take(100);
    }

    return qb.getMany();
  }

  async getCourseDetail(courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    // Compute grade distribution from reviews
    const reviews = await this.reviewRepo.find({ where: { courseId } });
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const r of reviews) {
      if (r.grade) {
        const letter = r.grade.charAt(0).toUpperCase();
        if (gradeDistribution[letter] !== undefined) gradeDistribution[letter]++;
      }
    }

    // Collect tips and pitfalls
    const tips = reviews.filter((r) => r.tips).map((r) => r.tips!);
    const pitfalls = reviews.filter((r) => r.pitfalls).map((r) => r.pitfalls!);
    const topProfessors = [...new Set(reviews.filter((r) => r.professorName).map((r) => r.professorName!))].slice(0, 5);

    return { ...course, gradeDistribution, tips, pitfalls, topProfessors };
  }

  async getReviews(courseId: string, page = 1, limit = 20) {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { courseId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async createReview(courseId: string, userId: string, dto: CreateCourseReviewDto) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.reviewRepo.findOne({ where: { courseId, userId } });
    if (existing) throw new ConflictException('You already reviewed this course');

    const review = await this.reviewRepo.save(
      this.reviewRepo.create({ ...dto, courseId, userId }),
    );

    // Recompute averages
    await this.recomputeAverages(courseId);

    return review;
  }

  private async recomputeAverages(courseId: string) {
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
}
