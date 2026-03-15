import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

export enum ParticipantRole {
  INITIATOR = 'initiator',
  RECIPIENT = 'recipient',
}

@Entity('conversation_participants')
@Index(['userId', 'conversationId'], { unique: true })
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.conversationParticipants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Conversation, (c) => c.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  conversationId: string;

  @Column({ type: 'enum', enum: ParticipantRole })
  role: ParticipantRole;

  @Column({ default: false })
  hasBlocked: boolean;

  @Column({ default: 0 })
  unreadCount: number;

  @Column({ nullable: true, type: 'timestamptz' })
  lastReadAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  deletedAt: Date; // Soft delete for participant's view

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
