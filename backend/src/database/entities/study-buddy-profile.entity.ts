import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

export enum StudyIntensity {
  LIGHT = 'light',
  MODERATE = 'moderate',
  INTENSE = 'intense',
}

export enum StudyPreference {
  IN_PERSON = 'in_person',
  ONLINE = 'online',
  BOTH = 'both',
}

@Entity('study_buddy_profiles')
@Index(['universityId', 'isVisible'])
export class StudyBuddyProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  userId: string;

  @Column()
  universityId: string;

  @Column({ type: 'enum', enum: StudyIntensity, default: StudyIntensity.MODERATE })
  intensity: StudyIntensity;

  @Column({ length: 200, nullable: true })
  location: string;

  @Column({ type: 'enum', enum: StudyPreference, default: StudyPreference.BOTH })
  preference: StudyPreference;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'simple-array', nullable: true })
  studyStyle: string[];

  @Column({ type: 'simple-array', nullable: true })
  availability: string[]; // ['Mon 2-4pm', 'Wed 3-5pm']

  @Column({ type: 'simple-array', nullable: true })
  courses: string[]; // course codes

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: 0 })
  sessionsCompleted: number;

  @Column({ type: 'float', default: 80 })
  reliability: number; // 0-100

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
