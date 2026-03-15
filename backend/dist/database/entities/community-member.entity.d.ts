import { User } from './user.entity';
import { Community } from './community.entity';
export declare class CommunityMember {
    id: string;
    user: User;
    userId: string;
    community: Community;
    communityId: string;
    joinedAt: Date;
}
