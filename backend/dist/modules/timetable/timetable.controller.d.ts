import { User } from '../../database/entities/user.entity';
import { TimetableService, CreateBlockDto, BulkImportDto } from './timetable.service';
export declare class TimetableController {
    private readonly service;
    constructor(service: TimetableService);
    getSchedule(user: User): Promise<import("../../database/entities/schedule-block.entity").ScheduleBlock[]>;
    createBlock(user: User, dto: CreateBlockDto): Promise<import("../../database/entities/schedule-block.entity").ScheduleBlock>;
    updateBlock(user: User, id: string, dto: Partial<CreateBlockDto>): Promise<import("../../database/entities/schedule-block.entity").ScheduleBlock>;
    deleteBlock(user: User, id: string): Promise<void>;
    bulkImport(user: User, dto: BulkImportDto): Promise<import("../../database/entities/schedule-block.entity").ScheduleBlock[]>;
    clearSchedule(user: User): Promise<void>;
}
