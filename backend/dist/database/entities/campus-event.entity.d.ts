import { CampusLocation } from './campus-location.entity';
export declare class CampusEvent {
    id: string;
    title: string;
    location: CampusLocation;
    locationId: string;
    startTime: Date;
    endTime: Date;
    category: string;
    participantCount: number;
    universityId: string;
    createdAt: Date;
}
