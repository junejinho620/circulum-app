import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from '../../database/entities/post.entity';

/**
 * FeedService handles background hot score recalculation.
 * Runs every 5 minutes to decay scores of aging posts.
 */
@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async recalculateHotScores() {
    this.logger.debug('Recalculating hot scores...');

    // Only recalculate posts from last 48 hours (older posts are already decayed)
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const posts = await this.postRepo
      .createQueryBuilder('p')
      .select(['p.id', 'p.upvotes', 'p.downvotes', 'p.createdAt'])
      .where('p.status = :status', { status: PostStatus.ACTIVE })
      .andWhere('p.createdAt > :cutoff', { cutoff })
      .getMany();

    if (posts.length === 0) return;

    // Batch update using raw SQL for performance
    const values = posts
      .map((p) => `('${p.id}', ${this.computeHotScore(p.upvotes, p.downvotes, p.createdAt)})`)
      .join(', ');

    await this.postRepo.query(`
      UPDATE posts AS p SET "hotScore" = v."hotScore"
      FROM (VALUES ${values}) AS v(id, "hotScore")
      WHERE p.id = v.id::uuid
    `);

    this.logger.debug(`Updated hot scores for ${posts.length} posts`);
  }

  private computeHotScore(upvotes: number, downvotes: number, createdAt: Date): number {
    const n = upvotes + downvotes;
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    if (n === 0) {
      return Math.max(0, 1 - ageHours * 0.05);
    }

    const z = 1.96;
    const p = upvotes / n;
    const wilson = (
      p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)
    ) / (1 + (z * z) / n);

    const gravity = 1.8;
    const timeFactor = Math.pow(ageHours + 2, gravity);

    return wilson / timeFactor;
  }
}
