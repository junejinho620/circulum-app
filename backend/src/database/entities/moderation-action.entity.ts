import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

export enum ModerationActionType {
  WARN = 'warn',
  REMOVE_CONTENT = 'remove_content',
  SUSPEND = 'suspend',
  BAN = 'ban',
  UNBAN = 'unban',
}

@Entity('moderation_actions')
@Index(['targetUserId', 'createdAt'])
export class ModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ModerationActionType })
  type: ModerationActionType;

  @Column({ type: 'text' })
  reason: string;

  // Who was actioned against
  @ManyToOne(() => User, (u) => u.moderationActions, { nullable: false })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  @Column()
  targetUserId: string;

  // Who took the action
  @Column()
  moderatorId: string;

  // What content was actioned (if applicable)
  @Column({ nullable: true })
  contentId: string;

  @Column({ nullable: true })
  contentType: string; // 'post' | 'comment' | 'message'

  @Column({ nullable: true })
  reportId: string; // Link back to the triggering report

  // For suspensions
  @Column({ nullable: true, type: 'timestamptz' })
  expiresAt: Date;

  @Column({ nullable: true, type: 'jsonb' })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
