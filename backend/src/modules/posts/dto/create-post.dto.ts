import {
  IsString, IsEnum, IsUUID, IsOptional, MinLength, MaxLength,
  IsArray, IsUrl,
} from 'class-validator';
import { PostCategory } from '../../../database/entities/post.entity';

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;

  @IsEnum(PostCategory)
  category: PostCategory;

  @IsUUID()
  communityId: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];
}
