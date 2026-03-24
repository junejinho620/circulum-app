import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import {
  appConfig, dbConfig, redisConfig, jwtConfig, emailConfig, throttleConfig,
} from './config/app.config';

// Entities
import { University } from './database/entities/university.entity';
import { User } from './database/entities/user.entity';
import { Major } from './database/entities/major.entity';
import { Course } from './database/entities/course.entity';
import { UserCourse } from './database/entities/user-course.entity';
import { Community } from './database/entities/community.entity';
import { CommunityMember } from './database/entities/community-member.entity';
import { Post } from './database/entities/post.entity';
import { Comment } from './database/entities/comment.entity';
import { Vote } from './database/entities/vote.entity';
import { Conversation } from './database/entities/conversation.entity';
import { ConversationParticipant } from './database/entities/conversation-participant.entity';
import { Message } from './database/entities/message.entity';
import { Notification } from './database/entities/notification.entity';
import { Report } from './database/entities/report.entity';
import { ModerationAction } from './database/entities/moderation-action.entity';
import { Poll } from './database/entities/poll.entity';
import { PollOption } from './database/entities/poll-option.entity';
import { PollVote } from './database/entities/poll-vote.entity';
import { Bookmark } from './database/entities/bookmark.entity';
import { UserBlock } from './database/entities/user-block.entity';
import { Hashtag } from './database/entities/hashtag.entity';
import { PostHashtag } from './database/entities/post-hashtag.entity';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { UniversitiesModule } from './modules/universities/universities.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { VotesModule } from './modules/votes/votes.module';
import { FeedModule } from './modules/feed/feed.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { PollsModule } from './modules/polls/polls.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { HashtagsModule } from './modules/hashtags/hashtags.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, redisConfig, jwtConfig, emailConfig, throttleConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('db.host'),
        port: config.get('db.port'),
        username: config.get('db.username'),
        password: config.get('db.password'),
        database: config.get('db.database'),
        entities: [
          University, User, Major, Course, UserCourse,
          Community, CommunityMember, Post, Comment, Vote,
          Conversation, ConversationParticipant, Message,
          Notification, Report, ModerationAction,
          Poll, PollOption, PollVote,
          Bookmark, UserBlock, Hashtag, PostHashtag,
        ],
        synchronize: config.get('app.nodeEnv') === 'development',
        logging: config.get('app.nodeEnv') === 'development',
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: config.get('throttle.ttl') * 1000,
        limit: config.get('throttle.limit'),
      }]),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    UniversitiesModule,
    CommunitiesModule,
    PostsModule,
    CommentsModule,
    VotesModule,
    FeedModule,
    MessagesModule,
    NotificationsModule,
    ModerationModule,
    PollsModule,
    BookmarksModule,
    BlocksModule,
    HashtagsModule,
  ],
})
export class AppModule {}
