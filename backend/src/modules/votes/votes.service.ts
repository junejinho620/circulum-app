import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vote, VoteValue } from '../../database/entities/vote.entity';
import { Post, PostStatus } from '../../database/entities/post.entity';
import { Comment, CommentStatus } from '../../database/entities/comment.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class VoteDto {
  @IsEnum(VoteValue) value: number; // 1 or -1
  @IsOptional() @IsUUID() postId?: string;
  @IsOptional() @IsUUID() commentId?: string;
}

const VOTE_MILESTONES = [10, 50, 100, 500, 1000];

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote) private voteRepo: Repository<Vote>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async vote(dto: VoteDto, user: User) {
    if (!dto.postId && !dto.commentId) {
      throw new BadRequestException('Must specify postId or commentId');
    }
    if (dto.postId && dto.commentId) {
      throw new BadRequestException('Cannot vote on both post and comment simultaneously');
    }

    if (dto.postId) {
      return this.voteOnPost(dto.postId, dto.value, user);
    }
    return this.voteOnComment(dto.commentId, dto.value, user);
  }

  private async voteOnPost(postId: string, value: number, user: User) {
    const post = await this.postRepo.findOne({
      where: { id: postId, status: PostStatus.ACTIVE },
      select: ['id', 'authorId', 'upvotes', 'downvotes'],
    });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.voteRepo.findOne({ where: { postId, userId: user.id } });

    await this.dataSource.transaction(async (manager) => {
      if (existing) {
        if (existing.value === value) {
          // Remove vote (toggle off)
          await manager.delete(Vote, { id: existing.id });
          if (value === 1) {
            await manager.decrement(Post, { id: postId }, 'upvotes', 1);
          } else {
            await manager.decrement(Post, { id: postId }, 'downvotes', 1);
          }
        } else {
          // Change vote
          await manager.update(Vote, { id: existing.id }, { value });
          if (value === 1) {
            await manager.increment(Post, { id: postId }, 'upvotes', 1);
            await manager.decrement(Post, { id: postId }, 'downvotes', 1);
          } else {
            await manager.decrement(Post, { id: postId }, 'upvotes', 1);
            await manager.increment(Post, { id: postId }, 'downvotes', 1);
          }
        }
      } else {
        // New vote
        await manager.save(Vote, { postId, userId: user.id, value });
        if (value === 1) {
          await manager.increment(Post, { id: postId }, 'upvotes', 1);
        } else {
          await manager.increment(Post, { id: postId }, 'downvotes', 1);
        }
      }
    });

    // Check karma milestone after upvote
    if (value === 1 && !existing) {
      const updated = await this.postRepo.findOne({ where: { id: postId }, select: ['upvotes', 'authorId'] });
      if (updated && VOTE_MILESTONES.includes(updated.upvotes)) {
        await this.notificationsService.create(
          updated.authorId,
          NotificationType.VOTE_MILESTONE,
          { postId, upvotes: updated.upvotes },
        );
      }
      // Update karma
      await this.postRepo
        .createQueryBuilder()
        .update(User)
        .set({ totalKarma: () => '"totalKarma" + 1' })
        .where('id = :id', { id: post.authorId })
        .execute();
    }

    return { success: true };
  }

  private async voteOnComment(commentId: string, value: number, user: User) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, status: CommentStatus.ACTIVE },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.voteRepo.findOne({ where: { commentId, userId: user.id } });

    await this.dataSource.transaction(async (manager) => {
      if (existing) {
        if (existing.value === value) {
          await manager.delete(Vote, { id: existing.id });
          if (value === 1) {
            await manager.decrement(Comment, { id: commentId }, 'upvotes', 1);
          } else {
            await manager.decrement(Comment, { id: commentId }, 'downvotes', 1);
          }
        } else {
          await manager.update(Vote, { id: existing.id }, { value });
          if (value === 1) {
            await manager.increment(Comment, { id: commentId }, 'upvotes', 1);
            await manager.decrement(Comment, { id: commentId }, 'downvotes', 1);
          } else {
            await manager.decrement(Comment, { id: commentId }, 'upvotes', 1);
            await manager.increment(Comment, { id: commentId }, 'downvotes', 1);
          }
        }
      } else {
        await manager.save(Vote, { commentId, userId: user.id, value });
        if (value === 1) {
          await manager.increment(Comment, { id: commentId }, 'upvotes', 1);
        } else {
          await manager.increment(Comment, { id: commentId }, 'downvotes', 1);
        }
      }
    });

    return { success: true };
  }
}
