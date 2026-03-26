import {
  Controller, Get, Post, Param, Query, Body, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { CourseReviewsService, CreateCourseReviewDto } from './course-reviews.service';

@UseGuards(JwtAuthGuard)
@Controller('course-reviews')
export class CourseReviewsController {
  constructor(private readonly service: CourseReviewsService) {}

  @Get('courses')
  getCourses(
    @CurrentUser() user: User,
    @Query('department') department?: string,
    @Query('sort') sort?: string,
    @Query('q') search?: string,
  ) {
    return this.service.getCourses(user.universityId, department, sort, search);
  }

  @Get('courses/:id')
  getCourseDetail(@Param('id') id: string) {
    return this.service.getCourseDetail(id);
  }

  @Get('courses/:id/reviews')
  getReviews(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.getReviews(id, page, Math.min(limit, 50));
  }

  @Post('courses/:id/reviews')
  createReview(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CreateCourseReviewDto,
  ) {
    return this.service.createReview(id, user.id, dto);
  }
}
