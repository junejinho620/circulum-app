import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';
import { ModerationService, CreateReportDto, TakeActionDto } from './moderation.service';

@UseGuards(JwtAuthGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  // Any user can report
  @Post('reports')
  createReport(@Body() dto: CreateReportDto, @CurrentUser() user: User) {
    return this.service.createReport(dto, user.id);
  }

  // Moderators and admins only below
  @Get('reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.service.getPendingReports(page);
  }

  @Get('reports/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getReport(@Param('id') id: string) {
    return this.service.getReport(id);
  }

  @Post('actions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  takeAction(@Body() dto: TakeActionDto, @CurrentUser() user: User) {
    return this.service.takeAction(dto, user.id);
  }

  @Patch('reports/:id/dismiss')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  dismissReport(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.dismissReport(id, user.id);
  }

  @Get('users/:userId/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getUserHistory(@Param('userId') userId: string) {
    return this.service.getModerationHistory(userId);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.service.getStats();
  }
}
