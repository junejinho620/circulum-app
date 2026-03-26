import { Repository } from 'typeorm';
import { ScheduleBlock } from '../../database/entities/schedule-block.entity';
export interface CreateBlockDto {
    title: string;
    subtitle?: string;
    location?: string;
    professor?: string;
    day: number;
    startHour: number;
    endHour: number;
    colorIndex?: number;
    type?: string;
}
export interface BulkImportDto {
    blocks: CreateBlockDto[];
}
export declare class TimetableService {
    private blockRepo;
    constructor(blockRepo: Repository<ScheduleBlock>);
    getSchedule(userId: string): Promise<ScheduleBlock[]>;
    createBlock(userId: string, dto: CreateBlockDto): Promise<ScheduleBlock>;
    updateBlock(blockId: string, userId: string, dto: Partial<CreateBlockDto>): Promise<ScheduleBlock>;
    deleteBlock(blockId: string, userId: string): Promise<void>;
    bulkImport(userId: string, dto: BulkImportDto): Promise<ScheduleBlock[]>;
    clearSchedule(userId: string): Promise<void>;
}
