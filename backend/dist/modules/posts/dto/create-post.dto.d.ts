import { PostCategory } from '../../../database/entities/post.entity';
export declare class CreatePostDto {
    title: string;
    body?: string;
    category: PostCategory;
    communityId: string;
    imageUrls?: string[];
}
