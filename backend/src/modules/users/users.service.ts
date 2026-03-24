import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

export interface UpdateProfileDto {
  handle?: string;
  bio?: string;
  avatarUrl?: string;
  year?: string;
  interests?: string[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['university', 'major'],
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      handle: user.handle,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      year: user.year,
      interests: user.interests,
      university: { id: user.university.id, name: user.university.name },
      major: user.major ? { id: user.major.id, name: user.major.name } : null,
      postCount: user.postCount,
      commentCount: user.commentCount,
      totalKarma: user.totalKarma,
      createdAt: user.createdAt,
    };
  }

  async getPublicProfile(targetUserId: string) {
    const user = await this.userRepo.findOne({
      where: { id: targetUserId },
      relations: ['university'],
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      handle: user.handle,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      year: user.year,
      interests: user.interests,
      university: { id: user.university.id, name: user.university.name },
      postCount: user.postCount,
      commentCount: user.commentCount,
      totalKarma: user.totalKarma,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Check handle uniqueness if changing
    if (dto.handle) {
      const existing = await this.userRepo.findOne({
        where: { handle: dto.handle },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Handle already taken');
      }
    }

    // Validate interests limit
    if (dto.interests && dto.interests.length > 8) {
      dto.interests = dto.interests.slice(0, 8);
    }

    await this.userRepo.update(userId, {
      ...(dto.handle !== undefined && { handle: dto.handle }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.year !== undefined && { year: dto.year }),
      ...(dto.interests !== undefined && { interests: dto.interests }),
    });

    return this.getProfile(userId);
  }

  async updatePushToken(userId: string, pushToken: string | null): Promise<void> {
    await this.userRepo.update(userId, { pushToken });
  }

  async getPushToken(userId: string): Promise<string | null> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'pushToken'],
    });
    return user?.pushToken ?? null;
  }

  async search(query: string, universityId: string, limit = 20) {
    return this.userRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.handle', 'u.avatarUrl', 'u.bio', 'u.totalKarma'])
      .where('u.universityId = :universityId', { universityId })
      .andWhere('u.handle ILIKE :q', { q: `%${query}%` })
      .andWhere('u.status = :status', { status: 'active' })
      .orderBy('u.totalKarma', 'DESC')
      .limit(Math.min(limit, 50))
      .getMany();
  }

  async updateLastSeen(userId: string): Promise<void> {
    await this.userRepo.update(userId, { lastSeenAt: new Date() });
  }
}
