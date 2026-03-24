import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hashtag } from '../../database/entities/hashtag.entity';
import { PostHashtag } from '../../database/entities/post-hashtag.entity';

@Injectable()
export class HashtagsService {
  constructor(
    @InjectRepository(Hashtag) private hashtagRepo: Repository<Hashtag>,
    @InjectRepository(PostHashtag) private postHashtagRepo: Repository<PostHashtag>,
  ) {}

  /**
   * Extract #hashtags from text, create if new, and link to post.
   * Called by PostsService after creating a post.
   */
  async processPostHashtags(postId: string, text: string): Promise<void> {
    const tags = this.extractHashtags(text);
    if (tags.length === 0) return;

    for (const name of tags) {
      // Upsert hashtag
      let hashtag = await this.hashtagRepo.findOne({ where: { name } });
      if (!hashtag) {
        hashtag = await this.hashtagRepo.save(this.hashtagRepo.create({ name }));
      }

      // Link to post (ignore duplicate)
      const exists = await this.postHashtagRepo.findOne({
        where: { postId, hashtagId: hashtag.id },
      });
      if (!exists) {
        await this.postHashtagRepo.save(
          this.postHashtagRepo.create({ postId, hashtagId: hashtag.id }),
        );
        await this.hashtagRepo.increment({ id: hashtag.id }, 'usageCount', 1);
      }
    }
  }

  /**
   * Remove hashtag links when a post is deleted.
   */
  async removePostHashtags(postId: string): Promise<void> {
    const links = await this.postHashtagRepo.find({ where: { postId } });
    for (const link of links) {
      await this.hashtagRepo.decrement({ id: link.hashtagId }, 'usageCount', 1);
    }
    await this.postHashtagRepo.delete({ postId });
  }

  /**
   * Get trending hashtags (most used, last 7 days).
   */
  async getTrending(limit = 20): Promise<Hashtag[]> {
    return this.hashtagRepo
      .createQueryBuilder('h')
      .where('h.usageCount > 0')
      .orderBy('h.usageCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Search hashtags by prefix.
   */
  async search(query: string, limit = 10): Promise<Hashtag[]> {
    return this.hashtagRepo
      .createQueryBuilder('h')
      .where('h.name ILIKE :q', { q: `${query.toLowerCase()}%` })
      .orderBy('h.usageCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get posts for a specific hashtag.
   */
  async getPostsByHashtag(hashtagName: string, page = 1, limit = 20) {
    const hashtag = await this.hashtagRepo.findOne({
      where: { name: hashtagName.toLowerCase() },
    });
    if (!hashtag) return { items: [], total: 0, page, limit };

    const [items, total] = await this.postHashtagRepo.findAndCount({
      where: { hashtagId: hashtag.id },
      relations: ['post', 'post.author', 'post.community'],
      order: { post: { createdAt: 'DESC' } },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      hashtag,
      items: items.map((ph) => ph.post),
      total,
      page,
      limit,
    };
  }

  /**
   * Extract unique hashtags from text. Returns lowercase names without #.
   */
  private extractHashtags(text: string): string[] {
    const matches = text.match(/#([a-zA-Z0-9_]+)/g);
    if (!matches) return [];

    const unique = new Set(
      matches
        .map((m) => m.slice(1).toLowerCase())
        .filter((t) => t.length >= 2 && t.length <= 100),
    );

    return Array.from(unique).slice(0, 20); // Max 20 per post
  }
}
