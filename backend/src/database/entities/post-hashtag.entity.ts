import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Post } from './post.entity';
import { Hashtag } from './hashtag.entity';

@Entity('post_hashtags')
@Unique(['postId', 'hashtagId'])
export class PostHashtag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  postId: string;

  @ManyToOne(() => Hashtag, (h) => h.postHashtags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hashtagId' })
  hashtag: Hashtag;

  @Column()
  hashtagId: string;
}
