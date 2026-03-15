import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, Index, JoinColumn,
} from 'typeorm';
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

export enum UserRole {
  STUDENT = 'student',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  WARNED = 'warned',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Real identity - NEVER exposed publicly
  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ select: false })
  passwordHash: string;

  // Anonymous public identity
  @Column({ unique: true, length: 30 })
  @Index()
  handle: string; // e.g. "QuantumFox#4821"

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true, select: false })
  emailVerificationToken: string;

  @Column({ nullable: true, type: 'timestamptz', select: false })
  emailVerificationExpiry: Date;

  @Column({ nullable: true, select: false })
  refreshTokenHash: string;

  @Column({ nullable: true, select: false })
  passwordResetToken: string;

  @Column({ nullable: true, type: 'timestamptz', select: false })
  passwordResetExpiry: Date;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Column({ nullable: true, type: 'timestamptz' })
  suspendedUntil: Date;

  @Column({ default: 0 })
  postCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: 0 })
  totalKarma: number;

  @ManyToOne(() => University, (u) => u.users, { eager: true })
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: string;

  @ManyToOne(() => Major, (m) => m.users, { nullable: true })
  @JoinColumn({ name: 'majorId' })
  major: Major;

  @Column({ nullable: true })
  majorId: string;

  @OneToMany(() => UserCourse, (uc) => uc.user)
  userCourses: UserCourse[];

  @OneToMany(() => Post, (p) => p.author)
  posts: Post[];

  @OneToMany(() => Comment, (c) => c.author)
  comments: Comment[];

  @OneToMany(() => Vote, (v) => v.user)
  votes: Vote[];

  @OneToMany(() => ConversationParticipant, (cp) => cp.user)
  conversationParticipants: ConversationParticipant[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];

  @OneToMany(() => Report, (r) => r.reporter)
  reports: Report[];

  @OneToMany(() => ModerationAction, (ma) => ma.targetUser)
  moderationActions: ModerationAction[];

  @Column({ nullable: true, type: 'timestamptz' })
  lastSeenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
