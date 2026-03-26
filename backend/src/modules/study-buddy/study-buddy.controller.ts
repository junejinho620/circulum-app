import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { StudyBuddyService, UpsertProfileDto, CreateSessionDto } from './study-buddy.service';

@UseGuards(JwtAuthGuard)
@Controller('study-buddy')
export class StudyBuddyController {
  constructor(private readonly service: StudyBuddyService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.service.getOrCreateProfile(user.id, user.universityId);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpsertProfileDto) {
    return this.service.updateProfile(user.id, user.universityId, dto);
  }

  @Get('matches')
  findMatches(@CurrentUser() user: User) {
    return this.service.findMatches(user.id, user.universityId);
  }

  @Get('sessions')
  getSessions(@CurrentUser() user: User) {
    return this.service.getSessions(user.universityId);
  }

  @Post('sessions')
  createSession(@CurrentUser() user: User, @Body() dto: CreateSessionDto) {
    return this.service.createSession(user.id, user.universityId, dto);
  }

  @Post('sessions/:id/join')
  joinSession(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.joinSession(id, user.id);
  }

  @Delete('sessions/:id/leave')
  leaveSession(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.leaveSession(id, user.id);
  }
}
