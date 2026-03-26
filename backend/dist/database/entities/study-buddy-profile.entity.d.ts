import { User } from './user.entity';
export declare enum StudyIntensity {
    LIGHT = "light",
    MODERATE = "moderate",
    INTENSE = "intense"
}
export declare enum StudyPreference {
    IN_PERSON = "in_person",
    ONLINE = "online",
    BOTH = "both"
}
export declare class StudyBuddyProfile {
    id: string;
    user: User;
    userId: string;
    universityId: string;
    intensity: StudyIntensity;
    location: string;
    preference: StudyPreference;
    bio: string;
    studyStyle: string[];
    availability: string[];
    courses: string[];
    isVisible: boolean;
    sessionsCompleted: number;
    reliability: number;
    createdAt: Date;
    updatedAt: Date;
}
