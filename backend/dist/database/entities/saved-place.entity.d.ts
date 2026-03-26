import { User } from './user.entity';
import { CampusLocation } from './campus-location.entity';
export declare enum SavedPlaceType {
    FAVORITE = "favorite",
    FREQUENT = "frequent",
    RECENT = "recent"
}
export declare class SavedPlace {
    id: string;
    user: User;
    userId: string;
    location: CampusLocation;
    locationId: string;
    type: SavedPlaceType;
    createdAt: Date;
}
