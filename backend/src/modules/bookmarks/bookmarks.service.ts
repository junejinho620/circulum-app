import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from '../../database/entities/bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private bookmarkRepo: Repository<Bookmark>,
  ) {}

  async add(userId: string, postId: string): Promise<Bookmark> {
    const existing = await this.bookmarkRepo.findOne({ where: { userId, postId } });
    if (existing) throw new ConflictException('Already bookmarked');

    const bookmark = this.bookmarkRepo.create({ userId, postId });
    return this.bookmarkRepo.save(bookmark);
  }

  async remove(userId: string, postId: string): Promise<void> {
    await this.bookmarkRepo.delete({ userId, postId });
  }

  async toggle(userId: string, postId: string): Promise<{ bookmarked: boolean }> {
    const existing = await this.bookmarkRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.bookmarkRepo.remove(existing);
      return { bookmarked: false };
    }
    await this.bookmarkRepo.save(this.bookmarkRepo.create({ userId, postId }));
    return { bookmarked: true };
  }

  async getForUser(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.bookmarkRepo.findAndCount({
      where: { userId },
      relations: ['post', 'post.author', 'post.community'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async isBookmarked(userId: string, postId: string): Promise<boolean> {
    return !!(await this.bookmarkRepo.findOne({ where: { userId, postId } }));
  }

  async getBookmarkedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
    if (postIds.length === 0) return new Set();
    const bookmarks = await this.bookmarkRepo
      .createQueryBuilder('b')
      .select('b.postId')
      .where('b.userId = :userId', { userId })
      .andWhere('b.postId IN (:...postIds)', { postIds })
      .getMany();
    return new Set(bookmarks.map((b) => b.postId));
  }
}
