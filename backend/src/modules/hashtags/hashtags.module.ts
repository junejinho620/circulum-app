import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hashtag } from '../../database/entities/hashtag.entity';
import { PostHashtag } from '../../database/entities/post-hashtag.entity';
import { HashtagsService } from './hashtags.service';
import { HashtagsController } from './hashtags.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hashtag, PostHashtag])],
  controllers: [HashtagsController],
  providers: [HashtagsService],
  exports: [HashtagsService],
})
export class HashtagsModule {}
