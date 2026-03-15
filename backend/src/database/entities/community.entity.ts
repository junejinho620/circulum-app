import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { University } from './university.entity';
import { Post } from './post.entity';
import { CommunityMember } from './community-member.entity';

export enum CommunityType {
  CAMPUS = 'campus',      // The entire university community
  MAJOR = 'major',        // e.g. "Computer Science"
  COURSE = 'course',      // e.g. "CS101"
  CUSTOM = 'custom',      // Future: user-created communities
}

@Entity('communities')
@Index(['slug', 'universityId'], { unique: true })
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 200 })
  @Index()
  slug: string; // URL-friendly name e.g. "cs101-fall-2024"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CommunityType })
  type: CommunityType;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  // Optional: link to the course or major this community belongs to
  @Column({ nullable: true })
  referenceId: string; // courseId or majorId

  @ManyToOne(() => University, (u) => u.communities)
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: string;

  @OneToMany(() => Post, (p) => p.community)
  posts: Post[];

  @OneToMany(() => CommunityMember, (cm) => cm.community)
  members: CommunityMember[];

  @Column({ default: 0 })
  memberCount: number;

  @Column({ default: 0 })
  postCount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
