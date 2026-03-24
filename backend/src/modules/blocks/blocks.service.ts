import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBlock } from '../../database/entities/user-block.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(UserBlock)
    private blockRepo: Repository<UserBlock>,
  ) {}

  async block(blockerId: string, blockedId: string): Promise<UserBlock> {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const existing = await this.blockRepo.findOne({
      where: { blockerId, blockedId },
    });
    if (existing) return existing;

    const block = this.blockRepo.create({ blockerId, blockedId });
    return this.blockRepo.save(block);
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    await this.blockRepo.delete({ blockerId, blockedId });
  }

  async getBlockedUsers(blockerId: string) {
    return this.blockRepo.find({
      where: { blockerId },
      relations: ['blocked'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBlockedUserIds(blockerId: string): Promise<Set<string>> {
    const blocks = await this.blockRepo.find({
      where: { blockerId },
      select: ['blockedId'],
    });
    return new Set(blocks.map((b) => b.blockedId));
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    return !!(await this.blockRepo.findOne({ where: { blockerId, blockedId } }));
  }

  async isBlockedEitherWay(userA: string, userB: string): Promise<boolean> {
    const count = await this.blockRepo
      .createQueryBuilder('b')
      .where('(b.blockerId = :a AND b.blockedId = :b)', { a: userA, b: userB })
      .orWhere('(b.blockerId = :b AND b.blockedId = :a)', { a: userA, b: userB })
      .getCount();
    return count > 0;
  }

  async getBlockCount(blockerId: string): Promise<number> {
    return this.blockRepo.count({ where: { blockerId } });
  }
}
