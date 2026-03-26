import { User } from './user.entity';
import { StudySession } from './study-session.entity';
export declare class StudySessionParticipant {
    id: string;
    session: StudySession;
    sessionId: string;
    user: User;
    userId: string;
    joinedAt: Date;
}
