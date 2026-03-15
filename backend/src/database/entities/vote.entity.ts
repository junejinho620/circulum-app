import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

export enum VoteValue {
  UP = 1,
  DOWN = -1,
}

@Entity('votes')
@Index(['userId', 'postId'], { unique: true, where: '"postId" IS NOT NULL AND "commentId" IS NULL' })
@Index(['userId', 'commentId'], { unique: true, where: '"commentId" IS NOT NULL' })
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'smallint' }) // 1 or -1
  value: number;

  @ManyToOne(() => User, (u) => u.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Post, (p) => p.votes, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ nullable: true })
  postId: string;

  @ManyToOne(() => Comment, (c) => c.votes, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column({ nullable: true })
  commentId: string;

  @CreateDateColumn()
  createdAt: Date;
}
