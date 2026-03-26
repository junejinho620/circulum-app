"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const app_config_1 = require("./config/app.config");
const university_entity_1 = require("./database/entities/university.entity");
const user_entity_1 = require("./database/entities/user.entity");
const major_entity_1 = require("./database/entities/major.entity");
const course_entity_1 = require("./database/entities/course.entity");
const user_course_entity_1 = require("./database/entities/user-course.entity");
const community_entity_1 = require("./database/entities/community.entity");
const community_member_entity_1 = require("./database/entities/community-member.entity");
const post_entity_1 = require("./database/entities/post.entity");
const comment_entity_1 = require("./database/entities/comment.entity");
const vote_entity_1 = require("./database/entities/vote.entity");
const conversation_entity_1 = require("./database/entities/conversation.entity");
const conversation_participant_entity_1 = require("./database/entities/conversation-participant.entity");
const message_entity_1 = require("./database/entities/message.entity");
const notification_entity_1 = require("./database/entities/notification.entity");
const report_entity_1 = require("./database/entities/report.entity");
const moderation_action_entity_1 = require("./database/entities/moderation-action.entity");
const poll_entity_1 = require("./database/entities/poll.entity");
const poll_option_entity_1 = require("./database/entities/poll-option.entity");
const poll_vote_entity_1 = require("./database/entities/poll-vote.entity");
const bookmark_entity_1 = require("./database/entities/bookmark.entity");
const user_block_entity_1 = require("./database/entities/user-block.entity");
const hashtag_entity_1 = require("./database/entities/hashtag.entity");
const post_hashtag_entity_1 = require("./database/entities/post-hashtag.entity");
const course_review_entity_1 = require("./database/entities/course-review.entity");
const professor_entity_1 = require("./database/entities/professor.entity");
const professor_review_entity_1 = require("./database/entities/professor-review.entity");
const study_buddy_profile_entity_1 = require("./database/entities/study-buddy-profile.entity");
const study_session_entity_1 = require("./database/entities/study-session.entity");
const study_session_participant_entity_1 = require("./database/entities/study-session-participant.entity");
const campus_location_entity_1 = require("./database/entities/campus-location.entity");
const campus_event_entity_1 = require("./database/entities/campus-event.entity");
const saved_place_entity_1 = require("./database/entities/saved-place.entity");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const universities_module_1 = require("./modules/universities/universities.module");
const communities_module_1 = require("./modules/communities/communities.module");
const posts_module_1 = require("./modules/posts/posts.module");
const comments_module_1 = require("./modules/comments/comments.module");
const votes_module_1 = require("./modules/votes/votes.module");
const feed_module_1 = require("./modules/feed/feed.module");
const messages_module_1 = require("./modules/messages/messages.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const moderation_module_1 = require("./modules/moderation/moderation.module");
const polls_module_1 = require("./modules/polls/polls.module");
const bookmarks_module_1 = require("./modules/bookmarks/bookmarks.module");
const blocks_module_1 = require("./modules/blocks/blocks.module");
const hashtags_module_1 = require("./modules/hashtags/hashtags.module");
const health_module_1 = require("./modules/health/health.module");
const course_reviews_module_1 = require("./modules/course-reviews/course-reviews.module");
const professors_module_1 = require("./modules/professors/professors.module");
const study_buddy_module_1 = require("./modules/study-buddy/study-buddy.module");
const campus_map_module_1 = require("./modules/campus-map/campus-map.module");
const timetable_module_1 = require("./modules/timetable/timetable.module");
const schedule_block_entity_1 = require("./database/entities/schedule-block.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.appConfig, app_config_1.dbConfig, app_config_1.redisConfig, app_config_1.jwtConfig, app_config_1.emailConfig, app_config_1.throttleConfig],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('db.host'),
                    port: config.get('db.port'),
                    username: config.get('db.username'),
                    password: config.get('db.password'),
                    database: config.get('db.database'),
                    entities: [
                        university_entity_1.University, user_entity_1.User, major_entity_1.Major, course_entity_1.Course, user_course_entity_1.UserCourse,
                        community_entity_1.Community, community_member_entity_1.CommunityMember, post_entity_1.Post, comment_entity_1.Comment, vote_entity_1.Vote,
                        conversation_entity_1.Conversation, conversation_participant_entity_1.ConversationParticipant, message_entity_1.Message,
                        notification_entity_1.Notification, report_entity_1.Report, moderation_action_entity_1.ModerationAction,
                        poll_entity_1.Poll, poll_option_entity_1.PollOption, poll_vote_entity_1.PollVote,
                        bookmark_entity_1.Bookmark, user_block_entity_1.UserBlock, hashtag_entity_1.Hashtag, post_hashtag_entity_1.PostHashtag,
                        course_review_entity_1.CourseReview, professor_entity_1.Professor, professor_review_entity_1.ProfessorReview,
                        study_buddy_profile_entity_1.StudyBuddyProfile, study_session_entity_1.StudySession, study_session_participant_entity_1.StudySessionParticipant,
                        campus_location_entity_1.CampusLocation, campus_event_entity_1.CampusEvent, saved_place_entity_1.SavedPlace,
                        schedule_block_entity_1.ScheduleBlock,
                    ],
                    synchronize: config.get('app.nodeEnv') === 'development',
                    logging: config.get('app.nodeEnv') === 'development',
                }),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ([{
                        ttl: config.get('throttle.ttl') * 1000,
                        limit: config.get('throttle.limit'),
                    }]),
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            universities_module_1.UniversitiesModule,
            communities_module_1.CommunitiesModule,
            posts_module_1.PostsModule,
            comments_module_1.CommentsModule,
            votes_module_1.VotesModule,
            feed_module_1.FeedModule,
            messages_module_1.MessagesModule,
            notifications_module_1.NotificationsModule,
            moderation_module_1.ModerationModule,
            polls_module_1.PollsModule,
            bookmarks_module_1.BookmarksModule,
            blocks_module_1.BlocksModule,
            hashtags_module_1.HashtagsModule,
            health_module_1.HealthModule,
            course_reviews_module_1.CourseReviewsModule,
            professors_module_1.ProfessorsModule,
            study_buddy_module_1.StudyBuddyModule,
            campus_map_module_1.CampusMapModule,
            timetable_module_1.TimetableModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map