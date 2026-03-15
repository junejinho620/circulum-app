import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

export enum ReportType {
  POST = 'post',
  COMMENT = 'comment',
  MESSAGE = 'message',
  USER = 'user',
}

export enum ReportReason {
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  HATE_SPEECH = 'hate_speech',
  MISINFORMATION = 'misinformation',
  ILLEGAL_CONTENT = 'illegal_content',
  DOXXING = 'doxxing',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('reports')
@Index(['status', 'createdAt'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @ManyToOne(() => User, (u) => u.reports, { nullable: false })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column()
  reporterId: string;

  // Target: one of these will be populated
  @ManyToOne(() => Post, (p) => p.reports, { nullable: true })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ nullable: true })
  postId: string;

  @ManyToOne(() => Comment, (c) => c.reports, { nullable: true })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column({ nullable: true })
  commentId: string;

  @Column({ nullable: true })
  messageId: string; // Reference to message (no FK for privacy)

  @Column({ nullable: true })
  targetUserId: string; // For user reports

  @Column({ nullable: true })
  resolvedBy: string; // Moderator userId

  @Column({ nullable: true, type: 'text' })
  resolution: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
