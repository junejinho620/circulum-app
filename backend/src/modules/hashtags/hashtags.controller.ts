import {
  Controller, Get, Query, Param, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HashtagsService } from './hashtags.service';

@UseGuards(JwtAuthGuard)
@Controller('hashtags')
export class HashtagsController {
  constructor(private readonly hashtagsService: HashtagsService) {}

  @Get('trending')
  getTrending(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.hashtagsService.getTrending(Math.min(limit, 50));
  }

  @Get('search')
  search(@Query('q') query: string) {
    if (!query || query.length < 1) return [];
    return this.hashtagsService.search(query, 10);
  }

  @Get(':name/posts')
  getPostsByHashtag(
    @Param('name') name: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.hashtagsService.getPostsByHashtag(name, page, Math.min(limit, 50));
  }
}
