import { User } from '../../database/entities/user.entity';
import { ProfessorsService, CreateProfessorReviewDto } from './professors.service';
export declare class ProfessorsController {
    private readonly service;
    constructor(service: ProfessorsService);
    findAll(user: User, department?: string, sort?: string, search?: string): Promise<import("../../database/entities/professor.entity").Professor[]>;
    findOne(id: string): Promise<import("../../database/entities/professor.entity").Professor>;
    getReviews(id: string, page: number, limit: number): Promise<{
        items: import("../../database/entities/professor-review.entity").ProfessorReview[];
        total: number;
        page: number;
        limit: number;
    }>;
    createReview(user: User, id: string, dto: CreateProfessorReviewDto): Promise<import("../../database/entities/professor-review.entity").ProfessorReview>;
}
