import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Comment, CommentStatus } from '../../database/entities/comment.entity';
import { Post, PostStatus } from '../../database/entities/post.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';
import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString() @MinLength(1) @MaxLength(5000) body: string;
  @IsOptional() @IsUUID() parentId?: string;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async create(postId: string, dto: CreateCommentDto, author: User): Promise<Comment> {
    const post = await this.postRepo.findOne({
      where: { id: postId, status: PostStatus.ACTIVE },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.isLocked) throw new ForbiddenException('Post is locked');

    // Validate parent comment if replying
    if (dto.parentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: dto.parentId, postId, status: CommentStatus.ACTIVE },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');
    }

    const comment = await this.dataSource.transaction(async (manager) => {
      const c = manager.create(Comment, {
        body: dto.body,
        postId,
        authorId: author.id,
        parentId: dto.parentId || null,
      });
      const saved = await manager.save(Comment, c);

      // Increment post comment count
      await manager.increment(Post, { id: postId }, 'commentCount', 1);

      // Increment parent reply count
      if (dto.parentId) {
        await manager.increment(Comment, { id: dto.parentId }, 'replyCount', 1);
      }

      // Increment user comment count
      await manager
        .createQueryBuilder()
        .update(User)
        .set({ commentCount: () => '"commentCount" + 1' })
        .where('id = :id', { id: author.id })
        .execute();

      return saved;
    });

    // Notify post author (async)
    this.sendCommentNotifications(comment, post, author).catch(() => {});

    return comment;
  }

  async getForPost(postId: string, page = 1, limit = 50) {
    // Return top-level comments with replies nested
    const topLevel = await this.commentRepo
      .createQueryBuilder('c')
      .leftJoin('c.author', 'author')
      .select([
        'c.id', 'c.body', 'c.upvotes', 'c.downvotes', 'c.replyCount',
        'c.createdAt', 'c.status', 'c.parentId',
        'author.id', 'author.handle',
      ])
      .where('c.postId = :postId', { postId })
      .andWhere('c.parentId IS NULL')
      .andWhere('c.status = :status', { status: CommentStatus.ACTIVE })
      .orderBy('c.upvotes - c.downvotes', 'DESC')
      .addOrderBy('c.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Fetch replies for each top-level comment
    if (topLevel.length > 0) {
      const topIds = topLevel.map((c) => c.id);
      const replies = await this.commentRepo
        .createQueryBuilder('c')
        .leftJoin('c.author', 'author')
        .select([
          'c.id', 'c.body', 'c.upvotes', 'c.downvotes',
          'c.createdAt', 'c.status', 'c.parentId',
          'author.id', 'author.handle',
        ])
        .where('c.parentId IN (:...topIds)', { topIds })
        .andWhere('c.status = :status', { status: CommentStatus.ACTIVE })
        .orderBy('c.createdAt', 'ASC')
        .getMany();

      // Attach replies to parents
      const repliesByParent = replies.reduce((acc, r) => {
        if (!acc[r.parentId]) acc[r.parentId] = [];
        acc[r.parentId].push(r);
        return acc;
      }, {} as Record<string, Comment[]>);

      return topLevel.map((c) => ({
        ...c,
        replies: repliesByParent[c.id] || [],
      }));
    }

    return topLevel;
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not authorized');

    await this.commentRepo.update(id, { status: CommentStatus.REMOVED, body: '[deleted]' });
  }

  private async sendCommentNotifications(
    comment: Comment, post: Post, author: User,
  ) {
    // Notify post author if someone else commented
    if (post.authorId !== author.id) {
      await this.notificationsService.create(
        post.authorId,
        NotificationType.POST_COMMENT,
        {
          postId: post.id,
          postTitle: post.title,
          commentId: comment.id,
          commenterHandle: author.handle,
        },
      );
    }

    // Notify parent comment author if this is a reply
    if (comment.parentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: comment.parentId },
        select: ['authorId'],
      });
      if (parent && parent.authorId !== author.id) {
        await this.notificationsService.create(
          parent.authorId,
          NotificationType.COMMENT_REPLY,
          {
            postId: post.id,
            commentId: comment.id,
            replierHandle: author.handle,
          },
        );
      }
    }
  }
}
