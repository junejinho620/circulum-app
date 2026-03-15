import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { University } from '../../database/entities/university.entity';
import { Major } from '../../database/entities/major.entity';
import { Course } from '../../database/entities/course.entity';
import { UserCourse } from '../../database/entities/user-course.entity';
import { User } from '../../database/entities/user.entity';
import { UniversitiesService } from './universities.service';
import { UniversitiesController } from './universities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([University, Major, Course, UserCourse, User])],
  controllers: [UniversitiesController],
  providers: [UniversitiesService],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}
