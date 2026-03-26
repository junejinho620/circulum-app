import { User } from '../../database/entities/user.entity';
import { CourseReviewsService, CreateCourseReviewDto } from './course-reviews.service';
export declare class CourseReviewsController {
    private readonly service;
    constructor(service: CourseReviewsService);
    getCourses(user: User, department?: string, sort?: string, search?: string): Promise<import("../../database/entities/course.entity").Course[]>;
    getCourseDetail(id: string): Promise<{
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
    getReviews(id: string, page: number, limit: number): Promise<{
        items: import("../../database/entities/course-review.entity").CourseReview[];
        total: number;
        page: number;
        limit: number;
    }>;
    createReview(user: User, id: string, dto: CreateCourseReviewDto): Promise<import("../../database/entities/course-review.entity").CourseReview>;
}
