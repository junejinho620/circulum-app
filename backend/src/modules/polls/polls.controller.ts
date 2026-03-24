import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { PollsService, CreatePollDto } from './polls.service';

@UseGuards(JwtAuthGuard)
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreatePollDto) {
    return this.pollsService.create(user.id, user.universityId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('communityId') communityId?: string,
  ) {
    if (communityId) {
      return this.pollsService.findForCommunity(communityId, page, Math.min(limit, 50));
    }
    return this.pollsService.findForUniversity(user.universityId, page, Math.min(limit, 50));
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.pollsService.findById(id, user.id);
  }

  @Post(':id/vote')
  vote(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { optionIds: string[] },
  ) {
    return this.pollsService.vote(id, user.id, body.optionIds);
  }

  @Patch(':id/close')
  close(@CurrentUser() user: User, @Param('id') id: string) {
    return this.pollsService.close(id, user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.pollsService.delete(id, user.id);
  }
}
