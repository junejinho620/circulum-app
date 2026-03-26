import { Repository } from 'typeorm';
import { CampusLocation } from '../../database/entities/campus-location.entity';
import { CampusEvent } from '../../database/entities/campus-event.entity';
import { SavedPlace } from '../../database/entities/saved-place.entity';
export declare class CampusMapService {
    private locationRepo;
    private eventRepo;
    private savedRepo;
    constructor(locationRepo: Repository<CampusLocation>, eventRepo: Repository<CampusEvent>, savedRepo: Repository<SavedPlace>);
    getLocations(universityId: string, category?: string): Promise<CampusLocation[]>;
    getLocationDetail(locationId: string): Promise<CampusLocation>;
    getUpcomingEvents(universityId: string): Promise<CampusEvent[]>;
    getEventsAtLocation(locationId: string): Promise<CampusEvent[]>;
    getSavedPlaces(userId: string): Promise<SavedPlace[]>;
    toggleSaved(userId: string, locationId: string, type?: string): Promise<{
        saved: boolean;
    }>;
    removeSaved(userId: string, locationId: string): Promise<{
        success: boolean;
    }>;
}
