import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Community } from './community.entity';
import { Major } from './major.entity';
import { Course } from './course.entity';

@Entity('universities')
export class University {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 200, unique: true })
  @Index()
  emailDomain: string; // e.g. "mit.edu"

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.university)
  users: User[];

  @OneToMany(() => Community, (c) => c.university)
  communities: Community[];

  @OneToMany(() => Major, (m) => m.university)
  majors: Major[];

  @OneToMany(() => Course, (c) => c.university)
  courses: Course[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
