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
export declare class CourseReviewsService {
    private courseRepo;
    private reviewRepo;
    constructor(courseRepo: Repository<Course>, reviewRepo: Repository<CourseReview>);
    getCourses(universityId: string, department?: string, sort?: string, search?: string): Promise<Course[]>;
    getCourseDetail(courseId: string): Promise<{
        gradeDistribution: Record<string, number>;
        tips: string[];
        pitfalls: string[];
        topProfessors: string[];
        id: string;
        code: string;
        name: string;
        department: string;
        description: string;
        terms: string[];
        avgRating: number;
        avgDifficulty: number;
        avgWorkload: number;
        reviewCount: number;
        university: import("../../database/entities/university.entity").University;
        universityId: string;
        userCourses: import("../../database/entities/user-course.entity").UserCourse[];
        isActive: boolean;
        createdAt: Date;
    }>;
    getReviews(courseId: string, page?: number, limit?: number): Promise<{
        items: CourseReview[];
        total: number;
        page: number;
        limit: number;
    }>;
    createReview(courseId: string, userId: string, dto: CreateCourseReviewDto): Promise<CourseReview>;
    private recomputeAverages;
}
