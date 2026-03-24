import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Poll } from './poll.entity';
import { PollOption } from './poll-option.entity';

@Entity('poll_votes')
@Unique(['userId', 'pollId', 'optionId'])
export class PollVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Poll, (p) => p.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pollId' })
  poll: Poll;

  @Column()
  pollId: string;

  @ManyToOne(() => PollOption, (o) => o.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionId' })
  option: PollOption;

  @Column()
  optionId: string;

  @CreateDateColumn()
  createdAt: Date;
}
