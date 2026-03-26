import { User } from './user.entity';
export declare class UserBlock {
    id: string;
    blocker: User;
    blockerId: string;
    blocked: User;
    blockedId: string;
    createdAt: Date;
}
