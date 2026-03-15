import { University } from './university.entity';
import { User } from './user.entity';
export declare class Major {
    id: string;
    name: string;
    code: string;
    university: University;
    universityId: string;
    users: User[];
    isActive: boolean;
    createdAt: Date;
}
