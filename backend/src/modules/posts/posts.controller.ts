import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { PostsService, FeedSort } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: User) {
    return this.postsService.create(dto, user);
  }

  @Get('feed')
  getCampusFeed(
    @CurrentUser() user: User,
    @Query('sort') sort: FeedSort = 'hot',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.getCampusFeed(user.universityId, sort, page, Math.min(limit, 50));
  }

  @Get('feed/personalized')
  getPersonalizedFeed(
    @CurrentUser() user: User,
    @Query('sort') sort: FeedSort = 'hot',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.getPersonalizedFeed(
      user.id, user.universityId, sort, page, Math.min(limit, 50),
    );
  }

  @Get('community/:communityId')
  getCommunityFeed(
    @Param('communityId') communityId: string,
    @CurrentUser() user: User,
    @Query('sort') sort: FeedSort = 'hot',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.getFeedForCommunity(
      communityId, sort, page, Math.min(limit, 50), user.id,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.findById(id, user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.delete(id, user.id);
  }
}
