import { University } from './university.entity';
import { Major } from './major.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { Vote } from './vote.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { Notification } from './notification.entity';
import { Report } from './report.entity';
import { ModerationAction } from './moderation-action.entity';
import { UserCourse } from './user-course.entity';
export declare enum UserRole {
    STUDENT = "student",
    MODERATOR = "moderator",
    ADMIN = "admin"
}
export declare enum UserStatus {
    PENDING_VERIFICATION = "pending_verification",
    ACTIVE = "active",
    WARNED = "warned",
    SUSPENDED = "suspended",
    BANNED = "banned"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    handle: string;
    isEmailVerified: boolean;
    emailVerificationToken: string;
    emailVerificationExpiry: Date;
    refreshTokenHash: string;
    passwordResetToken: string;
    passwordResetExpiry: Date;
    role: UserRole;
    status: UserStatus;
    suspendedUntil: Date;
    postCount: number;
    commentCount: number;
    totalKarma: number;
    university: University;
    universityId: string;
    major: Major;
    majorId: string;
    userCourses: UserCourse[];
    posts: Post[];
    comments: Comment[];
    votes: Vote[];
    conversationParticipants: ConversationParticipant[];
    notifications: Notification[];
    reports: Report[];
    moderationActions: ModerationAction[];
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
