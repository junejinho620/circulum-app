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
  code: string; // e.g. "CS101"

  @Column({ length: 300 })
  name: string; // e.g. "Introduction to Computer Science"

  @Column({ length: 100, nullable: true })
  department: string;

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
