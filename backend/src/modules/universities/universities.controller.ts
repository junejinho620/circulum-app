import {
  Controller, Get, Post, Delete, Param, Query, UseGuards, Body,
} from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { IsUUID } from 'class-validator';

class EnrollCourseDto {
  @IsUUID() courseId: string;
}

class UpdateMajorDto {
  @IsUUID() majorId: string;
}

@Controller('universities')
export class UniversitiesController {
  constructor(private readonly service: UniversitiesService) {}

  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Public()
  @Get(':id/majors')
  getMajors(@Param('id') id: string) {
    return this.service.getMajors(id);
  }

  @Public()
  @Get(':id/courses')
  getCourses(@Param('id') id: string, @Query('q') search: string) {
    return this.service.getCourses(id, search);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/courses')
  getMyCourses(@CurrentUser() user: User) {
    return this.service.getUserCourses(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/courses')
  enrollCourse(@CurrentUser() user: User, @Body() dto: EnrollCourseDto) {
    return this.service.enrollCourse(user.id, dto.courseId, user.universityId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/courses/:courseId')
  unenrollCourse(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.service.unenrollCourse(user.id, courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/major')
  updateMajor(@CurrentUser() user: User, @Body() dto: UpdateMajorDto) {
    return this.service.updateMajor(user.id, dto.majorId, user.universityId);
  }
}
