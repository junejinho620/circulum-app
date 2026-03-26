import {
  Controller, Get, Post, Delete, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { CommunitiesService } from './communities.service';
import { CommunityType } from '../../database/entities/community.entity';

@UseGuards(JwtAuthGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly service: CommunitiesService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('type') type?: CommunityType,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit?: number,
  ) {
    return this.service.findAll(user.universityId, type, Math.min(limit, 100));
  }

  @Get('my')
  getMyMemberships(@CurrentUser() user: User) {
    return this.service.getMyMemberships(user.id, user.universityId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/join')
  join(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.join(user.id, id);
  }

  @Delete(':id/leave')
  leave(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.leave(user.id, id);
  }
}
