import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

export enum BlockType {
  CLASS = 'class',
  EVENT = 'event',
  PERSONAL = 'personal',
}

@Entity('schedule_blocks')
@Index(['userId', 'day'])
export class ScheduleBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  title: string; // 'CSC263'

  @Column({ length: 200, nullable: true })
  subtitle: string; // 'Data Structures'

  @Column({ length: 100, nullable: true })
  location: string;

  @Column({ length: 100, nullable: true })
  professor: string;

  @Column({ type: 'smallint' })
  day: number; // 0=Sun, 1=Mon, ... 6=Sat

  @Column({ type: 'float' })
  startHour: number; // 9.0, 10.5, etc.

  @Column({ type: 'float' })
  endHour: number;

  @Column({ type: 'smallint', default: 0 })
  colorIndex: number;

  @Column({ type: 'enum', enum: BlockType, default: BlockType.CLASS })
  type: BlockType;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
