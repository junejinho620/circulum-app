import { User } from './user.entity';
import { Course } from './course.entity';
export declare class CourseReview {
    id: string;
    user: User;
    userId: string;
    course: Course;
    courseId: string;
    professorName: string;
    term: string;
    difficulty: number;
    workload: number;
    rating: number;
    body: string;
    tips: string;
    pitfalls: string;
    grade: string;
    createdAt: Date;
}
