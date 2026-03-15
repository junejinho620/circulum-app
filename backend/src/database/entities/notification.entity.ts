import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  COMMENT_REPLY = 'comment_reply',
  POST_COMMENT = 'post_comment',
  NEW_MESSAGE = 'new_message',
  MESSAGE_REQUEST = 'message_request',
  VOTE_MILESTONE = 'vote_milestone',
  MODERATION_WARNING = 'moderation_warning',
  MODERATION_SUSPENSION = 'moderation_suspension',
  MODERATION_BAN = 'moderation_ban',
}

@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>; // Flexible payload: postId, commentId, handle, etc.

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => User, (u) => u.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
