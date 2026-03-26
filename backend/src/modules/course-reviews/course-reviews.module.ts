import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../../database/entities/course.entity';
import { CourseReview } from '../../database/entities/course-review.entity';
import { CourseReviewsService } from './course-reviews.service';
import { CourseReviewsController } from './course-reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseReview])],
  controllers: [CourseReviewsController],
  providers: [CourseReviewsService],
  exports: [CourseReviewsService],
})
export class CourseReviewsModule {}
