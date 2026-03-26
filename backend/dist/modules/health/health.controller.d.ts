import { DataSource } from 'typeorm';
export declare class HealthController {
    private dataSource;
    constructor(dataSource: DataSource);
    check(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        services: {
            database: string;
        };
    }>;
    ping(): {
        pong: boolean;
        timestamp: number;
    };
}
