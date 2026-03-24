import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  OneToMany, Index,
} from 'typeorm';
import { PostHashtag } from './post-hashtag.entity';

@Entity('hashtags')
export class Hashtag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  @Index()
  name: string; // stored lowercase, without #

  @Column({ default: 0 })
  usageCount: number;

  @OneToMany(() => PostHashtag, (ph) => ph.hashtag)
  postHashtags: PostHashtag[];

  @CreateDateColumn()
  createdAt: Date;
}
