import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../../database/entities/post.entity';
import { Community } from '../../database/entities/community.entity';
import { CommunityMember } from '../../database/entities/community-member.entity';
import { Vote } from '../../database/entities/vote.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { FeedModule } from '../feed/feed.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Community, CommunityMember, Vote]),
    FeedModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
