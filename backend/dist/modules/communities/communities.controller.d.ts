import { User } from '../../database/entities/user.entity';
import { CommunitiesService } from './communities.service';
import { CommunityType } from '../../database/entities/community.entity';
export declare class CommunitiesController {
    private readonly service;
    constructor(service: CommunitiesService);
    findAll(user: User, type?: CommunityType, limit?: number): Promise<import("../../database/entities/community.entity").Community[]>;
    getMyMemberships(user: User): Promise<import("../../database/entities/community-member.entity").CommunityMember[]>;
    findOne(id: string): Promise<import("../../database/entities/community.entity").Community>;
    join(user: User, id: string): Promise<{
        message: string;
        memberCount?: undefined;
    } | {
        message: string;
        memberCount: number;
    }>;
    leave(user: User, id: string): Promise<{
        message: string;
    }>;
}
