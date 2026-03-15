import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

export enum ConversationStatus {
  PENDING = 'pending',   // Awaiting recipient acceptance
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.PENDING })
  status: ConversationStatus;

  // The post/comment that initiated the DM (for context display)
  @Column({ nullable: true })
  initiatedFromPostId: string;

  @Column({ nullable: true })
  initiatedFromCommentId: string;

  @OneToMany(() => ConversationParticipant, (cp) => cp.conversation)
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];

  @Column({ nullable: true, type: 'text' })
  lastMessagePreview: string;

  @Column({ nullable: true, type: 'timestamptz' })
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
