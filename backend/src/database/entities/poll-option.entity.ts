import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, JoinColumn,
} from 'typeorm';
import { Poll } from './poll.entity';
import { PollVote } from './poll-vote.entity';

@Entity('poll_options')
export class PollOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  text: string;

  @Column({ default: 0 })
  voteCount: number;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Poll, (p) => p.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pollId' })
  poll: Poll;

  @Column()
  pollId: string;

  @OneToMany(() => PollVote, (v) => v.option)
  votes: PollVote[];
}
