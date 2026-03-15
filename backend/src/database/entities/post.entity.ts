import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Community } from './community.entity';
import { Comment } from './comment.entity';
import { Vote } from './vote.entity';
import { Report } from './report.entity';

export enum PostCategory {
  GENERAL = 'general',
  STUDY = 'study',
  MEME = 'meme',
  EVENT = 'event',
  BUY_SELL = 'buy_sell',
  LOST_FOUND = 'lost_found',
}

export enum PostStatus {
  ACTIVE = 'active',
  REMOVED = 'removed',
  FLAGGED = 'flagged',
}

@Entity('posts')
@Index(['communityId', 'createdAt'])
@Index(['communityId', 'hotScore'])
@Index(['universityId', 'createdAt'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'simple-array', nullable: true })
  imageUrls: string[];

  @Column({ type: 'enum', enum: PostCategory, default: PostCategory.GENERAL })
  category: PostCategory;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.ACTIVE })
  status: PostStatus;

  // Feed ranking scores
  @Column({ type: 'float', default: 0 })
  @Index()
  hotScore: number; // Time-decayed Wilson score

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

  @Column({ default: 0 })
  commentCount: number;

  // Anonymous author - never expose user.email
  @ManyToOne(() => User, (u) => u.posts, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Community, (c) => c.posts, { nullable: false })
  @JoinColumn({ name: 'communityId' })
  community: Community;

  @Column()
  communityId: string;

  @Column()
  universityId: string; // Denormalized for fast campus-wide feeds

  @OneToMany(() => Comment, (c) => c.post)
  comments: Comment[];

  @OneToMany(() => Vote, (v) => v.post)
  votes: Vote[];

  @OneToMany(() => Report, (r) => r.post)
  reports: Report[];

  @Column({ default: false })
  isLocked: boolean; // No new comments

  @Column({ nullable: true })
  removedReason: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
