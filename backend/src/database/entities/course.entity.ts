import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { University } from './university.entity';
import { UserCourse } from './user-course.entity';

@Entity('courses')
@Index(['code', 'universityId'], { unique: true })
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  code: string;

  @Column({ length: 300 })
  name: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  terms: string[]; // ['Fall', 'Winter', 'Summer']

  @Column({ type: 'float', default: 0 })
  avgRating: number;

  @Column({ type: 'float', default: 0 })
  avgDifficulty: number;

  @Column({ type: 'float', default: 0 })
  avgWorkload: number;

  @Column({ default: 0 })
  reviewCount: number;

  @ManyToOne(() => University, (u) => u.courses)
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: string;

  @OneToMany(() => UserCourse, (uc) => uc.course)
  userCourses: UserCourse[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
