import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { University } from './university.entity';

@Entity('professors')
@Index(['universityId', 'department'])
export class Professor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100 })
  department: string;

  @Column({ type: 'simple-array', nullable: true })
  courses: string[]; // course codes

  @Column({ type: 'float', default: 0 })
  avgOverall: number;

  @Column({ type: 'float', default: 0 })
  avgClarity: number;

  @Column({ type: 'float', default: 0 })
  avgFairness: number;

  @Column({ type: 'float', default: 0 })
  avgWorkload: number;

  @Column({ type: 'float', default: 0 })
  avgEngagement: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: false })
  isTrending: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ManyToOne(() => University)
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: string;

  @CreateDateColumn()
  createdAt: Date;
}
