import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
export declare class PushService {
    private userRepo;
    private readonly expo;
    private readonly logger;
    constructor(userRepo: Repository<User>);
    sendToUser(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void>;
    sendToUsers(userIds: string[], title: string, body: string, data?: Record<string, any>): Promise<void>;
    private sendMessages;
}
