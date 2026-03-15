import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { University } from './university.entity';
import { User } from './user.entity';

@Entity('majors')
export class Major {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 20, nullable: true })
  code: string; // e.g. "CS", "EE"

  @ManyToOne(() => University, (u) => u.majors)
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: string;

  @OneToMany(() => User, (u) => u.major)
  users: User[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
