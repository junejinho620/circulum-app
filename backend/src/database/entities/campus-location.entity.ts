import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { University } from './university.entity';
import { CampusEvent } from './campus-event.entity';

export enum LocationCategory {
  LECTURES = 'lectures',
  STUDY = 'study',
  FOOD = 'food',
  EVENTS = 'events',
  QUIET = 'quiet',
  POPULAR = 'popular',
}

@Entity('campus_locations')
@Index(['universityId', 'category'])
export class CampusLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 300, nullable: true })
  subtitle: string;

  @Column({ type: 'enum', enum: LocationCategory })
  category: LocationCategory;

  @Column({ length: 50 })
  building: string;

  @Column({ length: 50, nullable: true })
  floor: string;

  @Column({ type: 'float' })
  coordX: number; // 0-1 normalized

  @Column({ type: 'float' })
  coordY: number; // 0-1 normalized

  @Column({ type: 'float', default: 0 })
  avgRating: number;

  @Column({ default: 0 })
  currentOccupancy: number;

  @Column({ length: 100, nullable: true })
  bestTime: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ManyToOne(() => University)
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: string;

  @OneToMany(() => CampusEvent, (e) => e.location)
  events: CampusEvent[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
