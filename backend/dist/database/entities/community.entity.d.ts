import { University } from './university.entity';
import { Post } from './post.entity';
import { CommunityMember } from './community-member.entity';
export declare enum CommunityType {
    CAMPUS = "campus",
    MAJOR = "major",
    COURSE = "course",
    CUSTOM = "custom"
}
export declare class Community {
    id: string;
    name: string;
    slug: string;
    description: string;
    type: CommunityType;
    iconUrl: string;
    bannerUrl: string;
    referenceId: string;
    university: University;
    universityId: string;
    posts: Post[];
    members: CommunityMember[];
    memberCount: number;
    postCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
