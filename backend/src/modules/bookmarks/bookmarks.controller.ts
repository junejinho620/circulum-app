import {
  Controller, Get, Post, Delete, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { BookmarksService } from './bookmarks.service';

@UseGuards(JwtAuthGuard)
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  getBookmarks(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bookmarksService.getForUser(user.id, page, Math.min(limit, 50));
  }

  @Post(':postId')
  toggle(@CurrentUser() user: User, @Param('postId') postId: string) {
    return this.bookmarksService.toggle(user.id, postId);
  }

  @Delete(':postId')
  remove(@CurrentUser() user: User, @Param('postId') postId: string) {
    return this.bookmarksService.remove(user.id, postId);
  }
}
