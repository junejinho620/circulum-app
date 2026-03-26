import { User } from '../../database/entities/user.entity';
import { BlocksService } from './blocks.service';
export declare class BlocksController {
    private readonly blocksService;
    constructor(blocksService: BlocksService);
    getBlocked(user: User): Promise<import("../../database/entities/user-block.entity").UserBlock[]>;
    getCount(user: User): Promise<number>;
    block(user: User, targetId: string): Promise<import("../../database/entities/user-block.entity").UserBlock>;
    unblock(user: User, targetId: string): Promise<void>;
}
