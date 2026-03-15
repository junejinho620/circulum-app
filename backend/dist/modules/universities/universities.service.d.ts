import { Repository } from 'typeorm';
import { University } from '../../database/entities/university.entity';
import { Major } from '../../database/entities/major.entity';
import { Course } from '../../database/entities/course.entity';
import { UserCourse } from '../../database/entities/user-course.entity';
import { User } from '../../database/entities/user.entity';
export declare class UniversitiesService {
    private universityRepo;
    private majorRepo;
    private courseRepo;
    private userCourseRepo;
    private userRepo;
    constructor(universityRepo: Repository<University>, majorRepo: Repository<Major>, courseRepo: Repository<Course>, userCourseRepo: Repository<UserCourse>, userRepo: Repository<User>);
    findAll(): Promise<University[]>;
    findOne(id: string): Promise<University>;
    getMajors(universityId: string): Promise<Major[]>;
    getCourses(universityId: string, search?: string): Promise<Course[]>;
    enrollCourse(userId: string, courseId: string, universityId: string): Promise<{
        message: string;
    }>;
    unenrollCourse(userId: string, courseId: string): Promise<{
        message: string;
    }>;
    getUserCourses(userId: string): Promise<UserCourse[]>;
    updateMajor(userId: string, majorId: string, universityId: string): Promise<{
        message: string;
    }>;
}
