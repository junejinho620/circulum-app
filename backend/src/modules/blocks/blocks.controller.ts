import {
  Controller, Get, Post, Delete, Param, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { BlocksService } from './blocks.service';

@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  getBlocked(@CurrentUser() user: User) {
    return this.blocksService.getBlockedUsers(user.id);
  }

  @Get('count')
  getCount(@CurrentUser() user: User) {
    return this.blocksService.getBlockCount(user.id);
  }

  @Post(':userId')
  block(@CurrentUser() user: User, @Param('userId') targetId: string) {
    return this.blocksService.block(user.id, targetId);
  }

  @Delete(':userId')
  unblock(@CurrentUser() user: User, @Param('userId') targetId: string) {
    return this.blocksService.unblock(user.id, targetId);
  }
}
