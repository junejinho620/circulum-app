import { University } from './university.entity';
export declare class Professor {
    id: string;
    name: string;
    department: string;
    courses: string[];
    avgOverall: number;
    avgClarity: number;
    avgFairness: number;
    avgWorkload: number;
    avgEngagement: number;
    reviewCount: number;
    isTrending: boolean;
    tags: string[];
    university: University;
    universityId: string;
    createdAt: Date;
}
