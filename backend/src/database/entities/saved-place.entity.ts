import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique, Index,
} from 'typeorm';
import { User } from './user.entity';
import { CampusLocation } from './campus-location.entity';

export enum SavedPlaceType {
  FAVORITE = 'favorite',
  FREQUENT = 'frequent',
  RECENT = 'recent',
}

@Entity('saved_places')
@Unique(['userId', 'locationId'])
@Index(['userId'])
export class SavedPlace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => CampusLocation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locationId' })
  location: CampusLocation;

  @Column()
  locationId: string;

  @Column({ type: 'enum', enum: SavedPlaceType, default: SavedPlaceType.FAVORITE })
  type: SavedPlaceType;

  @CreateDateColumn()
  createdAt: Date;
}
