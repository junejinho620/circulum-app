import { User } from '../../database/entities/user.entity';
import { StudyBuddyService, UpsertProfileDto, CreateSessionDto } from './study-buddy.service';
export declare class StudyBuddyController {
    private readonly service;
    constructor(service: StudyBuddyService);
    getProfile(user: User): Promise<import("../../database/entities/study-buddy-profile.entity").StudyBuddyProfile>;
    updateProfile(user: User, dto: UpsertProfileDto): Promise<import("../../database/entities/study-buddy-profile.entity").StudyBuddyProfile>;
    findMatches(user: User): Promise<{
        id: string;
        userId: string;
        name: string;
        initial: string;
        courses: string[];
        sharedCourses: string[];
        freeSlots: string[];
        intensity: import("../../database/entities/study-buddy-profile.entity").StudyIntensity;
        location: string;
        preference: import("../../database/entities/study-buddy-profile.entity").StudyPreference;
        bio: string;
        studyStyle: string[];
        reliability: number;
        sessionsCompleted: number;
        compatibility: number;
        active: boolean;
    }[]>;
    getSessions(user: User): Promise<import("../../database/entities/study-session.entity").StudySession[]>;
    createSession(user: User, dto: CreateSessionDto): Promise<import("../../database/entities/study-session.entity").StudySession>;
    joinSession(user: User, id: string): Promise<{
        success: boolean;
    }>;
    leaveSession(user: User, id: string): Promise<{
        success: boolean;
    }>;
}
