import { UniversitiesService } from './universities.service';
import { User } from '../../database/entities/user.entity';
declare class EnrollCourseDto {
    courseId: string;
}
declare class UpdateMajorDto {
    majorId: string;
}
export declare class UniversitiesController {
    private readonly service;
    constructor(service: UniversitiesService);
    findAll(): Promise<import("../../database/entities/university.entity").University[]>;
    findOne(id: string): Promise<import("../../database/entities/university.entity").University>;
    getMajors(id: string): Promise<import("../../database/entities/major.entity").Major[]>;
    getCourses(id: string, search: string): Promise<import("../../database/entities/course.entity").Course[]>;
    getMyCourses(user: User): Promise<import("../../database/entities/user-course.entity").UserCourse[]>;
    enrollCourse(user: User, dto: EnrollCourseDto): Promise<{
        message: string;
    }>;
    unenrollCourse(user: User, courseId: string): Promise<{
        message: string;
    }>;
    updateMajor(user: User, dto: UpdateMajorDto): Promise<{
        message: string;
    }>;
}
export {};
