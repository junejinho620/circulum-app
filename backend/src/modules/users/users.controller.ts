import {
  Controller, Get, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { UsersService, UpdateProfileDto } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  getMyProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me/profile')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('push-token')
  async updatePushToken(
    @CurrentUser() user: User,
    @Body() body: { pushToken: string | null },
  ) {
    await this.usersService.updatePushToken(user.id, body.pushToken);
    return { success: true };
  }

  @Get('search')
  search(
    @CurrentUser() user: User,
    @Query('q') query: string,
  ) {
    if (!query || query.length < 2) return [];
    return this.usersService.search(query, user.universityId);
  }

  @Get(':id/profile')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
