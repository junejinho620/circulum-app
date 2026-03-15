import { User } from '../../database/entities/user.entity';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: User, page: number, limit: number): Promise<{
        items: import("../../database/entities/notification.entity").Notification[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUnreadCount(user: User): Promise<number>;
    markRead(user: User, id: string): Promise<{
        success: boolean;
    }>;
    markAllRead(user: User): Promise<{
        success: boolean;
    }>;
}
