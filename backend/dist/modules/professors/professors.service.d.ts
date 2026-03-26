import { Repository } from 'typeorm';
import { Professor } from '../../database/entities/professor.entity';
import { ProfessorReview } from '../../database/entities/professor-review.entity';
export interface CreateProfessorReviewDto {
    overall: number;
    clarity: number;
    fairness: number;
    workload: number;
    engagement: number;
    body?: string;
    courseCode?: string;
    tags?: string[];
}
export declare class ProfessorsService {
    private profRepo;
    private reviewRepo;
    constructor(profRepo: Repository<Professor>, reviewRepo: Repository<ProfessorReview>);
    findAll(universityId: string, department?: string, sort?: string, search?: string): Promise<Professor[]>;
    findById(professorId: string): Promise<Professor>;
    getReviews(professorId: string, page?: number, limit?: number): Promise<{
        items: ProfessorReview[];
        total: number;
        page: number;
        limit: number;
    }>;
    createReview(professorId: string, userId: string, dto: CreateProfessorReviewDto): Promise<ProfessorReview>;
    private recomputeAverages;
}
