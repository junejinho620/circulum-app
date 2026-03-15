import { User } from './user.entity';
import { Course } from './course.entity';
export declare class UserCourse {
    id: string;
    user: User;
    userId: string;
    course: Course;
    courseId: string;
    createdAt: Date;
}
