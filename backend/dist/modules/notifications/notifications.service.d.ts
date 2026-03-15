import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities/notification.entity';
export declare class NotificationsService {
    private notificationRepo;
    constructor(notificationRepo: Repository<Notification>);
    create(userId: string, type: NotificationType, payload: Record<string, any>): Promise<Notification>;
    getForUser(userId: string, page?: number, limit?: number): Promise<{
        items: Notification[];
        total: number;
        page: number;
        limit: number;
    }>;
    markRead(userId: string, notificationId: string): Promise<{
        success: boolean;
    }>;
    markAllRead(userId: string): Promise<{
        success: boolean;
    }>;
    getUnreadCount(userId: string): Promise<number>;
}
