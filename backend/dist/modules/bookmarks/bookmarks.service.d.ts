import { Repository } from 'typeorm';
import { Bookmark } from '../../database/entities/bookmark.entity';
export declare class BookmarksService {
    private bookmarkRepo;
    constructor(bookmarkRepo: Repository<Bookmark>);
    add(userId: string, postId: string): Promise<Bookmark>;
    remove(userId: string, postId: string): Promise<void>;
    toggle(userId: string, postId: string): Promise<{
        bookmarked: boolean;
    }>;
    getForUser(userId: string, page?: number, limit?: number): Promise<{
        items: Bookmark[];
        total: number;
        page: number;
        limit: number;
    }>;
    isBookmarked(userId: string, postId: string): Promise<boolean>;
    getBookmarkedPostIds(userId: string, postIds: string[]): Promise<Set<string>>;
}
