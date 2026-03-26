import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { StudySessionParticipant } from './study-session-participant.entity';

@Entity('study_sessions')
@Index(['universityId', 'date'])
export class StudySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  courseCode: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ length: 200 })
  location: string;

  @Column({ length: 20 })
  duration: string; // '2h', '1.5h'

  @Column({ type: 'text', nullable: true })
  goal: string;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: 5 })
  maxParticipants: number;

  @Column({ default: 0 })
  participantCount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: string;

  @Column()
  universityId: string;

  @OneToMany(() => StudySessionParticipant, (p) => p.session, { cascade: true })
  participants: StudySessionParticipant[];

  @CreateDateColumn()
  createdAt: Date;
}
