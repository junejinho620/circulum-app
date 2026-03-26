import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from './user.entity';
import { StudySession } from './study-session.entity';

@Entity('study_session_participants')
@Unique(['sessionId', 'userId'])
export class StudySessionParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudySession, (s) => s.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: StudySession;

  @Column()
  sessionId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  joinedAt: Date;
}
