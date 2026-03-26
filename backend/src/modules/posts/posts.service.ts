import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post, PostStatus } from '../../database/entities/post.entity';
import { Community } from '../../database/entities/community.entity';
import { User } from '../../database/entities/user.entity';
import { CommunityMember } from '../../database/entities/community-member.entity';
import { Vote } from '../../database/entities/vote.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { HashtagsService } from '../hashtags/hashtags.service';

export type FeedSort = 'hot' | 'new' | 'top';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Community) private communityRepo: Repository<Community>,
    @InjectRepository(CommunityMember) private memberRepo: Repository<CommunityMember>,
    @InjectRepository(Vote) private voteRepo: Repository<Vote>,
    private dataSource: DataSource,
    private hashtagsService: HashtagsService,
  ) {}

  async create(dto: CreatePostDto, author: User): Promise<Post> {
    const community = await this.communityRepo.findOne({
      where: { id: dto.communityId, universityId: author.universityId, isActive: true },
    });
    if (!community) throw new NotFoundException('Community not found');

    const post = this.postRepo.create({
      ...dto,
      authorId: author.id,
      universityId: author.universityId,
      hotScore: this.computeHotScore(0, 0, new Date()),
    });

    const saved = await this.postRepo.save(post);
    await this.communityRepo.increment({ id: dto.communityId }, 'postCount', 1);
    await this.postRepo
      .createQueryBuilder()
      .update(User)
      .set({ postCount: () => '"postCount" + 1' })
      .where('id = :id', { id: author.id })
      .execute();

    // Extract and index hashtags from title + body (non-blocking)
    const text = `${dto.title} ${dto.body || ''}`;
    this.hashtagsService.processPostHashtags(saved.id, text).catch(() => {});

    return saved;
  }

  async findById(id: string, requestingUserId?: string): Promise<Post & { userVote?: number }> {
    const post = await this.postRepo
      .createQueryBuilder('p')
      .leftJoin('p.author', 'author')
      .leftJoin('p.community', 'community')
      .select([
        'p.id', 'p.title', 'p.body', 'p.imageUrls', 'p.category', 'p.status',
        'p.upvotes', 'p.downvotes', 'p.commentCount', 'p.createdAt',
        'author.id', 'author.handle',
        'community.id', 'community.name', 'community.slug',
      ])
      .where('p.id = :id', { id })
      .andWhere('p.status = :status', { status: PostStatus.ACTIVE })
      .getOne();

    if (!post) throw new NotFoundException('Post not found');

    let userVote: number | undefined;
    if (requestingUserId) {
      const vote = await this.voteRepo.findOne({
        where: { postId: id, userId: requestingUserId },
      });
      userVote = vote?.value;
    }

    return { ...post, userVote };
  }

  async getFeedForCommunity(
    communityId: string,
    sort: FeedSort = 'hot',
    page = 1,
    limit = 20,
    requestingUserId?: string,
  ) {
    const qb = this.postRepo
      .createQueryBuilder('p')
      .leftJoin('p.author', 'author')
      .select([
        'p.id', 'p.title', 'p.category', 'p.upvotes', 'p.downvotes',
        'p.commentCount', 'p.createdAt', 'p.imageUrls', 'p.hotScore',
        'author.id', 'author.handle',
      ])
      .where('p.communityId = :communityId', { communityId })
      .andWhere('p.status = :status', { status: PostStatus.ACTIVE })
      .skip((page - 1) * limit)
      .take(limit);

    this.applySorting(qb, sort);

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, limit };
  }

  async getCampusFeed(
    universityId: string,
    sort: FeedSort = 'hot',
    page = 1,
    limit = 20,
  ) {
    const qb = this.postRepo
      .createQueryBuilder('p')
      .leftJoin('p.author', 'author')
      .leftJoin('p.community', 'community')
      .select([
        'p.id', 'p.title', 'p.category', 'p.upvotes', 'p.downvotes',
        'p.commentCount', 'p.createdAt', 'p.imageUrls', 'p.hotScore',
        'author.id', 'author.handle',
        'community.id', 'community.name', 'community.slug',
      ])
      .where('p.universityId = :universityId', { universityId })
      .andWhere('p.status = :status', { status: PostStatus.ACTIVE })
      .skip((page - 1) * limit)
      .take(limit);

    this.applySorting(qb, sort);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getPersonalizedFeed(
    userId: string,
    universityId: string,
    sort: FeedSort = 'hot',
    page = 1,
    limit = 20,
  ) {
    // Get communities user has joined
    const memberships = await this.memberRepo.find({ where: { userId } });
    const communityIds = memberships.map((m) => m.communityId);

    if (communityIds.length === 0) {
      return this.getCampusFeed(universityId, sort, page, limit);
    }

    const qb = this.postRepo
      .createQueryBuilder('p')
      .leftJoin('p.author', 'author')
      .leftJoin('p.community', 'community')
      .select([
        'p.id', 'p.title', 'p.category', 'p.upvotes', 'p.downvotes',
        'p.commentCount', 'p.createdAt', 'p.imageUrls', 'p.hotScore',
        'author.id', 'author.handle',
        'community.id', 'community.name', 'community.slug',
      ])
      .where('p.communityId IN (:...communityIds)', { communityIds })
      .andWhere('p.status = :status', { status: PostStatus.ACTIVE })
      .skip((page - 1) * limit)
      .take(limit);

    this.applySorting(qb, sort);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not authorized');

    await this.postRepo.update(id, { status: PostStatus.REMOVED });
    this.hashtagsService.removePostHashtags(id).catch(() => {});
  }

  // Recalculate hot scores (called by background job)
  async recalculateHotScores(): Promise<void> {
    const posts = await this.postRepo.find({
      where: { status: PostStatus.ACTIVE },
      select: ['id', 'upvotes', 'downvotes', 'createdAt'],
    });

    const updates = posts.map((p) => ({
      id: p.id,
      hotScore: this.computeHotScore(p.upvotes, p.downvotes, p.createdAt),
    }));

    // Batch update
    await Promise.all(
      updates.map((u) => this.postRepo.update(u.id, { hotScore: u.hotScore })),
    );
  }

  private applySorting(qb: any, sort: FeedSort) {
    switch (sort) {
      case 'hot':
        qb.orderBy('p.hotScore', 'DESC');
        break;
      case 'new':
        qb.orderBy('p.createdAt', 'DESC');
        break;
      case 'top':
        qb.orderBy('p.upvotes - p.downvotes', 'DESC');
        break;
    }
  }

  /**
   * Reddit-style Wilson score lower bound with time decay.
   * hotScore = wilsonLowerBound(upvotes, total) - timePenalty
   *
   * Time decay: score degrades as post ages (gravity factor)
   */
  private computeHotScore(upvotes: number, downvotes: number, createdAt: Date): number {
    const n = upvotes + downvotes;
    if (n === 0) {
      // Base score on recency only
      const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      return Math.max(0, 1 - ageHours * 0.05);
    }

    // Wilson score lower bound (95% confidence)
    const z = 1.96;
    const p = upvotes / n;
    const wilson = (
      p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)
    ) / (1 + (z * z) / n);

    // Time decay: halve score every 12 hours
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const gravity = 1.8;
    const timeFactor = Math.pow(ageHours + 2, gravity);

    return wilson / timeFactor;
  }
}
