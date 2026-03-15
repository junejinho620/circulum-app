import { University } from './university.entity';
import { UserCourse } from './user-course.entity';
export declare class Course {
    id: string;
    code: string;
    name: string;
    department: string;
    university: University;
    universityId: string;
    userCourses: UserCourse[];
    isActive: boolean;
    createdAt: Date;
}
