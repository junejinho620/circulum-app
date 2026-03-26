import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';

@Entity('course_reviews')
@Unique(['userId', 'courseId'])
@Index(['courseId', 'createdAt'])
export class CourseReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: string;

  @Column({ length: 100, nullable: true })
  professorName: string;

  @Column({ length: 20, nullable: true })
  term: string; // 'Fall 2024'

  @Column({ type: 'smallint' })
  difficulty: number; // 0-3

  @Column({ type: 'smallint' })
  workload: number; // 1-5

  @Column({ type: 'smallint' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'text', nullable: true })
  tips: string;

  @Column({ type: 'text', nullable: true })
  pitfalls: string;

  @Column({ length: 5, nullable: true })
  grade: string; // A+, A, B+, etc.

  @CreateDateColumn()
  createdAt: Date;
}
