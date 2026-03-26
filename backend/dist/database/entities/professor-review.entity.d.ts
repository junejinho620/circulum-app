import { User } from './user.entity';
import { Professor } from './professor.entity';
export declare class ProfessorReview {
    id: string;
    user: User;
    userId: string;
    professor: Professor;
    professorId: string;
    courseCode: string;
    overall: number;
    clarity: number;
    fairness: number;
    workload: number;
    engagement: number;
    body: string;
    tags: string[];
    createdAt: Date;
}
