import { User } from './user.entity';
export declare enum BlockType {
    CLASS = "class",
    EVENT = "event",
    PERSONAL = "personal"
}
export declare class ScheduleBlock {
    id: string;
    title: string;
    subtitle: string;
    location: string;
    professor: string;
    day: number;
    startHour: number;
    endHour: number;
    colorIndex: number;
    type: BlockType;
    user: User;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
