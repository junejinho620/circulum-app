import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
export interface UpdateProfileDto {
    handle?: string;
    bio?: string;
    avatarUrl?: string;
    year?: string;
    interests?: string[];
}
export declare class UsersService {
    private userRepo;
    constructor(userRepo: Repository<User>);
    findById(id: string): Promise<User | null>;
    getProfile(userId: string): Promise<{
        id: string;
        handle: string;
        bio: string;
        avatarUrl: string;
        year: string;
        interests: string[];
        university: {
            id: string;
            name: string;
        };
        major: {
            id: string;
            name: string;
        };
        postCount: number;
        commentCount: number;
        totalKarma: number;
        createdAt: Date;
    }>;
    getPublicProfile(targetUserId: string): Promise<{
        id: string;
        handle: string;
        bio: string;
        avatarUrl: string;
        year: string;
        interests: string[];
        university: {
            id: string;
            name: string;
        };
        postCount: number;
        commentCount: number;
        totalKarma: number;
        createdAt: Date;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        handle: string;
        bio: string;
        avatarUrl: string;
        year: string;
        interests: string[];
        university: {
            id: string;
            name: string;
        };
        major: {
            id: string;
            name: string;
        };
        postCount: number;
        commentCount: number;
        totalKarma: number;
        createdAt: Date;
    }>;
    updatePushToken(userId: string, pushToken: string | null): Promise<void>;
    getPushToken(userId: string): Promise<string | null>;
    search(query: string, universityId: string, limit?: number): Promise<User[]>;
    updateLastSeen(userId: string): Promise<void>;
}
