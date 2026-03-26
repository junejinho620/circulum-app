import { Repository } from 'typeorm';
import { StudyBuddyProfile } from '../../database/entities/study-buddy-profile.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { StudySessionParticipant } from '../../database/entities/study-session-participant.entity';
import { UserCourse } from '../../database/entities/user-course.entity';
export interface UpsertProfileDto {
    intensity?: string;
    location?: string;
    preference?: string;
    bio?: string;
    studyStyle?: string[];
    availability?: string[];
    courses?: string[];
    isVisible?: boolean;
}
export interface CreateSessionDto {
    courseCode: string;
    date: string;
    location: string;
    duration: string;
    goal?: string;
    isPublic?: boolean;
    maxParticipants?: number;
}
export declare class StudyBuddyService {
    private profileRepo;
    private sessionRepo;
    private participantRepo;
    private userCourseRepo;
    constructor(profileRepo: Repository<StudyBuddyProfile>, sessionRepo: Repository<StudySession>, participantRepo: Repository<StudySessionParticipant>, userCourseRepo: Repository<UserCourse>);
    getOrCreateProfile(userId: string, universityId: string): Promise<StudyBuddyProfile>;
    updateProfile(userId: string, universityId: string, dto: UpsertProfileDto): Promise<StudyBuddyProfile>;
    findMatches(userId: string, universityId: string): Promise<{
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
    getSessions(universityId: string): Promise<StudySession[]>;
    createSession(userId: string, universityId: string, dto: CreateSessionDto): Promise<StudySession>;
    joinSession(sessionId: string, userId: string): Promise<{
        success: boolean;
    }>;
    leaveSession(sessionId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
