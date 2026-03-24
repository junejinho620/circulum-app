import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Poll, PollStatus, PollType } from '../../database/entities/poll.entity';
import { PollOption } from '../../database/entities/poll-option.entity';
import { PollVote } from '../../database/entities/poll-vote.entity';

export interface CreatePollDto {
  question: string;
  options: string[];
  type?: PollType;
  communityId?: string;
  isAnonymous?: boolean;
  endsAt?: string;
}

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll) private pollRepo: Repository<Poll>,
    @InjectRepository(PollOption) private optionRepo: Repository<PollOption>,
    @InjectRepository(PollVote) private voteRepo: Repository<PollVote>,
    private dataSource: DataSource,
  ) {}

  async create(userId: string, universityId: string, dto: CreatePollDto): Promise<Poll> {
    if (!dto.options || dto.options.length < 2) {
      throw new BadRequestException('Poll must have at least 2 options');
    }
    if (dto.options.length > 10) {
      throw new BadRequestException('Poll can have at most 10 options');
    }

    const poll = this.pollRepo.create({
      question: dto.question,
      type: dto.type ?? PollType.SINGLE,
      communityId: dto.communityId ?? null,
      universityId,
      authorId: userId,
      isAnonymous: dto.isAnonymous ?? false,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      options: dto.options.map((text, i) =>
        this.optionRepo.create({ text, sortOrder: i }),
      ),
    });

    return this.pollRepo.save(poll);
  }

  async findForUniversity(universityId: string, page = 1, limit = 20) {
    const [items, total] = await this.pollRepo.findAndCount({
      where: { universityId, status: PollStatus.ACTIVE },
      relations: ['options', 'author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findForCommunity(communityId: string, page = 1, limit = 20) {
    const [items, total] = await this.pollRepo.findAndCount({
      where: { communityId, status: PollStatus.ACTIVE },
      relations: ['options', 'author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findById(pollId: string, userId?: string) {
    const poll = await this.pollRepo.findOne({
      where: { id: pollId },
      relations: ['options', 'author'],
    });
    if (!poll) throw new NotFoundException('Poll not found');

    // Check if user has voted
    let userVotes: string[] = [];
    if (userId) {
      const votes = await this.voteRepo.find({
        where: { pollId, userId },
        select: ['optionId'],
      });
      userVotes = votes.map((v) => v.optionId);
    }

    return { ...poll, userVotes };
  }

  async vote(pollId: string, userId: string, optionIds: string[]): Promise<void> {
    const poll = await this.pollRepo.findOne({
      where: { id: pollId },
      relations: ['options'],
    });
    if (!poll) throw new NotFoundException('Poll not found');
    if (poll.status !== PollStatus.ACTIVE) throw new BadRequestException('Poll is closed');
    if (poll.endsAt && new Date() > poll.endsAt) throw new BadRequestException('Poll has ended');

    // Validate option IDs belong to this poll
    const validOptionIds = new Set(poll.options.map((o) => o.id));
    for (const id of optionIds) {
      if (!validOptionIds.has(id)) throw new BadRequestException('Invalid option');
    }

    if (poll.type === PollType.SINGLE && optionIds.length > 1) {
      throw new BadRequestException('Single-choice poll: select one option');
    }

    await this.dataSource.transaction(async (manager) => {
      // Remove existing votes
      const existing = await manager.find(PollVote, { where: { pollId, userId } });
      if (existing.length > 0) {
        // Decrement old option counts
        for (const v of existing) {
          await manager.decrement(PollOption, { id: v.optionId }, 'voteCount', 1);
        }
        await manager.remove(existing);
        await manager.decrement(Poll, { id: pollId }, 'totalVotes', existing.length);
      }

      // Insert new votes
      const newVotes = optionIds.map((optionId) =>
        manager.create(PollVote, { pollId, userId, optionId }),
      );
      await manager.save(newVotes);

      // Increment new option counts
      for (const id of optionIds) {
        await manager.increment(PollOption, { id }, 'voteCount', 1);
      }
      await manager.increment(Poll, { id: pollId }, 'totalVotes', optionIds.length);
    });
  }

  async close(pollId: string, userId: string): Promise<void> {
    const poll = await this.pollRepo.findOne({ where: { id: pollId } });
    if (!poll) throw new NotFoundException('Poll not found');
    if (poll.authorId !== userId) throw new ForbiddenException('Not your poll');

    await this.pollRepo.update(pollId, { status: PollStatus.CLOSED });
  }

  async delete(pollId: string, userId: string): Promise<void> {
    const poll = await this.pollRepo.findOne({ where: { id: pollId } });
    if (!poll) throw new NotFoundException('Poll not found');
    if (poll.authorId !== userId) throw new ForbiddenException('Not your poll');

    await this.pollRepo.update(pollId, { status: PollStatus.REMOVED });
  }
}
