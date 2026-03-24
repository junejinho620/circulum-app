import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Community } from './community.entity';
import { PollOption } from './poll-option.entity';
import { PollVote } from './poll-vote.entity';

export enum PollType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export enum PollStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  REMOVED = 'removed',
}

@Entity('polls')
@Index(['universityId', 'createdAt'])
@Index(['communityId', 'createdAt'])
export class Poll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 300 })
  question: string;

  @Column({ type: 'enum', enum: PollType, default: PollType.SINGLE })
  type: PollType;

  @Column({ type: 'enum', enum: PollStatus, default: PollStatus.ACTIVE })
  status: PollStatus;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ default: 0 })
  totalVotes: number;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date;

  // ─── Relationships ────────────────────────────────────────
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Community, { nullable: true })
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @Column({ nullable: true })
  communityId: string;

  @Column()
  universityId: string;

  @OneToMany(() => PollOption, (o) => o.poll, { cascade: true })
  options: PollOption[];

  @OneToMany(() => PollVote, (v) => v.poll)
  votes: PollVote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
