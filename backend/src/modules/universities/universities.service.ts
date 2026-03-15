import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from '../../database/entities/university.entity';
import { Major } from '../../database/entities/major.entity';
import { Course } from '../../database/entities/course.entity';
import { UserCourse } from '../../database/entities/user-course.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University) private universityRepo: Repository<University>,
    @InjectRepository(Major) private majorRepo: Repository<Major>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(UserCourse) private userCourseRepo: Repository<UserCourse>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async findAll() {
    return this.universityRepo.find({
      where: { isActive: true },
      select: ['id', 'name', 'emailDomain', 'country', 'city', 'logoUrl'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const university = await this.universityRepo.findOne({ where: { id, isActive: true } });
    if (!university) throw new NotFoundException('University not found');
    return university;
  }

  async getMajors(universityId: string) {
    return this.majorRepo.find({
      where: { universityId, isActive: true },
      select: ['id', 'name', 'code'],
      order: { name: 'ASC' },
    });
  }

  async getCourses(universityId: string, search?: string) {
    const qb = this.courseRepo.createQueryBuilder('course')
      .where('course.universityId = :universityId', { universityId })
      .andWhere('course.isActive = true');

    if (search) {
      qb.andWhere('(course.code ILIKE :search OR course.name ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    return qb.select(['course.id', 'course.code', 'course.name', 'course.department'])
      .orderBy('course.code', 'ASC')
      .limit(50)
      .getMany();
  }

  async enrollCourse(userId: string, courseId: string, universityId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId, universityId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.userCourseRepo.findOne({ where: { userId, courseId } });
    if (existing) return { message: 'Already enrolled in this course' };

    await this.userCourseRepo.save({ userId, courseId });
    return { message: 'Enrolled in course' };
  }

  async unenrollCourse(userId: string, courseId: string) {
    await this.userCourseRepo.delete({ userId, courseId });
    return { message: 'Unenrolled from course' };
  }

  async getUserCourses(userId: string) {
    return this.userCourseRepo.find({
      where: { userId },
      relations: ['course'],
    });
  }

  async updateMajor(userId: string, majorId: string, universityId: string) {
    const major = await this.majorRepo.findOne({ where: { id: majorId, universityId } });
    if (!major) throw new NotFoundException('Major not found');

    await this.userRepo.update(userId, { majorId });
    return { message: 'Major updated' };
  }
}
