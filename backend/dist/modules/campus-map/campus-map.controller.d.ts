import { User } from '../../database/entities/user.entity';
import { CampusMapService } from './campus-map.service';
export declare class CampusMapController {
    private readonly service;
    constructor(service: CampusMapService);
    getLocations(user: User, category?: string): Promise<import("../../database/entities/campus-location.entity").CampusLocation[]>;
    getLocationDetail(id: string): Promise<import("../../database/entities/campus-location.entity").CampusLocation>;
    getEvents(user: User): Promise<import("../../database/entities/campus-event.entity").CampusEvent[]>;
    getEventsAtLocation(id: string): Promise<import("../../database/entities/campus-event.entity").CampusEvent[]>;
    getSaved(user: User): Promise<import("../../database/entities/saved-place.entity").SavedPlace[]>;
    toggleSaved(user: User, locationId: string, body: {
        type?: string;
    }): Promise<{
        saved: boolean;
    }>;
    removeSaved(user: User, locationId: string): Promise<{
        success: boolean;
    }>;
}
