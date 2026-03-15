import { User } from './user.entity';
import { Community } from './community.entity';
import { Major } from './major.entity';
import { Course } from './course.entity';
export declare class University {
    id: string;
    name: string;
    emailDomain: string;
    country: string;
    city: string;
    logoUrl: string;
    isActive: boolean;
    users: User[];
    communities: Community[];
    majors: Major[];
    courses: Course[];
    createdAt: Date;
    updatedAt: Date;
}
