import { User } from '../../database/entities/user.entity';
import { BookmarksService } from './bookmarks.service';
export declare class BookmarksController {
    private readonly bookmarksService;
    constructor(bookmarksService: BookmarksService);
    getBookmarks(user: User, page: number, limit: number): Promise<{
        items: import("../../database/entities/bookmark.entity").Bookmark[];
        total: number;
        page: number;
        limit: number;
    }>;
    toggle(user: User, postId: string): Promise<{
        bookmarked: boolean;
    }>;
    remove(user: User, postId: string): Promise<void>;
}
