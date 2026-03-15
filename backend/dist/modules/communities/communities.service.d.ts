import { Repository, DataSource } from 'typeorm';
import { Community, CommunityType } from '../../database/entities/community.entity';
import { CommunityMember } from '../../database/entities/community-member.entity';
export declare class CommunitiesService {
    private communityRepo;
    private memberRepo;
    private dataSource;
    constructor(communityRepo: Repository<Community>, memberRepo: Repository<CommunityMember>, dataSource: DataSource);
    findAll(universityId: string, type?: CommunityType): Promise<Community[]>;
    findOne(id: string): Promise<Community>;
    findBySlug(slug: string, universityId: string): Promise<Community>;
    getMyMemberships(userId: string, universityId: string): Promise<CommunityMember[]>;
    join(userId: string, communityId: string): Promise<{
        message: string;
        memberCount?: undefined;
    } | {
        message: string;
        memberCount: number;
    }>;
    leave(userId: string, communityId: string): Promise<{
        message: string;
    }>;
    isMember(userId: string, communityId: string): Promise<boolean>;
    createCampusCommunity(universityId: string, universityName: string): Promise<Community>;
    createCourseCommunity(universityId: string, courseId: string, courseCode: string, courseName: string): Promise<Community>;
    createMajorCommunity(universityId: string, majorId: string, majorName: string): Promise<Community>;
}
