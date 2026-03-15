import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Vote } from './vote.entity';
import { Report } from './report.entity';

export enum CommentStatus {
  ACTIVE = 'active',
  REMOVED = 'removed',
}

@Entity('comments')
@Index(['postId', 'createdAt'])
@Index(['parentId', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: CommentStatus, default: CommentStatus.ACTIVE })
  status: CommentStatus;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

  @Column({ default: 0 })
  replyCount: number;

  @ManyToOne(() => User, (u) => u.comments, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Post, (p) => p.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  postId: string;

  // Threaded comments: single level deep for MVP
  @ManyToOne(() => Comment, (c) => c.replies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @Column({ nullable: true })
  parentId: string;

  @OneToMany(() => Comment, (c) => c.parent)
  replies: Comment[];

  @OneToMany(() => Vote, (v) => v.comment)
  votes: Vote[];

  @OneToMany(() => Report, (r) => r.comment)
  reports: Report[];

  @Column({ nullable: true })
  removedReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
