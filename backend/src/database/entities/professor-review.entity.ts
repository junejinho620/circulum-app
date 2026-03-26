import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Professor } from './professor.entity';

@Entity('professor_reviews')
@Unique(['userId', 'professorId'])
@Index(['professorId', 'createdAt'])
export class ProfessorReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Professor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professorId' })
  professor: Professor;

  @Column()
  professorId: string;

  @Column({ length: 20, nullable: true })
  courseCode: string;

  @Column({ type: 'smallint' })
  overall: number; // 1-5

  @Column({ type: 'smallint' })
  clarity: number; // 1-5

  @Column({ type: 'smallint' })
  fairness: number; // 1-5

  @Column({ type: 'smallint' })
  workload: number; // 1-5

  @Column({ type: 'smallint' })
  engagement: number; // 1-5

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;
}
