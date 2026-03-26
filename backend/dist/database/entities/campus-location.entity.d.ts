import { University } from './university.entity';
import { CampusEvent } from './campus-event.entity';
export declare enum LocationCategory {
    LECTURES = "lectures",
    STUDY = "study",
    FOOD = "food",
    EVENTS = "events",
    QUIET = "quiet",
    POPULAR = "popular"
}
export declare class CampusLocation {
    id: string;
    name: string;
    subtitle: string;
    category: LocationCategory;
    building: string;
    floor: string;
    coordX: number;
    coordY: number;
    avgRating: number;
    currentOccupancy: number;
    bestTime: string;
    tags: string[];
    university: University;
    universityId: string;
    events: CampusEvent[];
    isActive: boolean;
    createdAt: Date;
}
