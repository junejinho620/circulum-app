import {
  Controller, Get, Post, Param, Query, Body, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { ProfessorsService, CreateProfessorReviewDto } from './professors.service';

@UseGuards(JwtAuthGuard)
@Controller('professors')
export class ProfessorsController {
  constructor(private readonly service: ProfessorsService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('department') department?: string,
    @Query('sort') sort?: string,
    @Query('q') search?: string,
  ) {
    return this.service.findAll(user.universityId, department, sort, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get(':id/reviews')
  getReviews(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.getReviews(id, page, Math.min(limit, 50));
  }

  @Post(':id/reviews')
  createReview(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CreateProfessorReviewDto,
  ) {
    return this.service.createReview(id, user.id, dto);
  }
}
