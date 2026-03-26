import { User } from '../../database/entities/user.entity';
import { UsersService, UpdateProfileDto } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMyProfile(user: User): Promise<{
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
    updateProfile(user: User, dto: UpdateProfileDto): Promise<{
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
    updatePushToken(user: User, body: {
        pushToken: string | null;
    }): Promise<{
        success: boolean;
    }>;
    search(user: User, query: string): any[] | Promise<User[]>;
    getPublicProfile(id: string): Promise<{
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
}
