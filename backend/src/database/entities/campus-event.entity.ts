import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { CampusLocation } from './campus-location.entity';

@Entity('campus_events')
@Index(['universityId', 'startTime'])
export class CampusEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 300 })
  title: string;

  @ManyToOne(() => CampusLocation, (l) => l.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locationId' })
  location: CampusLocation;

  @Column()
  locationId: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date;

  @Column({ length: 50 })
  category: string; // 'Career', 'Social', 'Academic', 'Food'

  @Column({ default: 0 })
  participantCount: number;

  @Column()
  universityId: string;

  @CreateDateColumn()
  createdAt: Date;
}
