import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleBlock } from '../../database/entities/schedule-block.entity';

export interface CreateBlockDto {
  title: string;
  subtitle?: string;
  location?: string;
  professor?: string;
  day: number;
  startHour: number;
  endHour: number;
  colorIndex?: number;
  type?: string;
}

export interface BulkImportDto {
  blocks: CreateBlockDto[];
}

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(ScheduleBlock)
    private blockRepo: Repository<ScheduleBlock>,
  ) {}

  async getSchedule(userId: string): Promise<ScheduleBlock[]> {
    return this.blockRepo.find({
      where: { userId },
      order: { day: 'ASC', startHour: 'ASC' },
    });
  }

  async createBlock(userId: string, dto: CreateBlockDto): Promise<ScheduleBlock> {
    const block = this.blockRepo.create({
      ...dto,
      userId,
      type: (dto.type as any) ?? 'class',
    });
    return this.blockRepo.save(block);
  }

  async updateBlock(blockId: string, userId: string, dto: Partial<CreateBlockDto>) {
    const block = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!block) throw new NotFoundException('Block not found');
    if (block.userId !== userId) throw new ForbiddenException('Not your block');

    Object.assign(block, dto);
    return this.blockRepo.save(block);
  }

  async deleteBlock(blockId: string, userId: string): Promise<void> {
    const block = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!block) throw new NotFoundException('Block not found');
    if (block.userId !== userId) throw new ForbiddenException('Not your block');

    await this.blockRepo.remove(block);
  }

  async bulkImport(userId: string, dto: BulkImportDto): Promise<ScheduleBlock[]> {
    // Clear existing schedule
    await this.blockRepo.delete({ userId });

    // Insert all new blocks
    const blocks = dto.blocks.map((b) =>
      this.blockRepo.create({
        ...b,
        userId,
        type: (b.type as any) ?? 'class',
      }),
    );

    return this.blockRepo.save(blocks);
  }

  async clearSchedule(userId: string): Promise<void> {
    await this.blockRepo.delete({ userId });
  }
}
