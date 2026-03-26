import { User } from './user.entity';
import { StudySessionParticipant } from './study-session-participant.entity';
export declare class StudySession {
    id: string;
    courseCode: string;
    date: Date;
    location: string;
    duration: string;
    goal: string;
    isPublic: boolean;
    maxParticipants: number;
    participantCount: number;
    creator: User;
    creatorId: string;
    universityId: string;
    participants: StudySessionParticipant[];
    createdAt: Date;
}
