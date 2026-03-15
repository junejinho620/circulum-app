import { User } from '../../database/entities/user.entity';
import { ModerationService, CreateReportDto, TakeActionDto } from './moderation.service';
export declare class ModerationController {
    private readonly service;
    constructor(service: ModerationService);
    createReport(dto: CreateReportDto, user: User): Promise<{
        message: string;
    }>;
    getReports(page: number): Promise<{
        items: import("../../database/entities/report.entity").Report[];
        total: number;
        page: number;
        limit: number;
    }>;
    getReport(id: string): Promise<import("../../database/entities/report.entity").Report>;
    takeAction(dto: TakeActionDto, user: User): Promise<{
        message: string;
    }>;
    dismissReport(id: string, user: User): Promise<{
        message: string;
    }>;
    getUserHistory(userId: string): Promise<import("../../database/entities/moderation-action.entity").ModerationAction[]>;
    getStats(): Promise<{
        reports: {
            pending: number;
            resolved: number;
            dismissed: number;
        };
        users: {
            warned: number;
            suspended: number;
            banned: number;
        };
    }>;
}
