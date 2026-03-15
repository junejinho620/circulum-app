import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../../database/entities/post.entity';
import { FeedService } from './feed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
