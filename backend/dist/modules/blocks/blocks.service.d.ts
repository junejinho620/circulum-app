import { Repository } from 'typeorm';
import { UserBlock } from '../../database/entities/user-block.entity';
export declare class BlocksService {
    private blockRepo;
    constructor(blockRepo: Repository<UserBlock>);
    block(blockerId: string, blockedId: string): Promise<UserBlock>;
    unblock(blockerId: string, blockedId: string): Promise<void>;
    getBlockedUsers(blockerId: string): Promise<UserBlock[]>;
    getBlockedUserIds(blockerId: string): Promise<Set<string>>;
    isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
    isBlockedEitherWay(userA: string, userB: string): Promise<boolean>;
    getBlockCount(blockerId: string): Promise<number>;
}
