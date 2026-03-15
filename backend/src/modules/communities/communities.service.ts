import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Community, CommunityType } from '../../database/entities/community.entity';
import { CommunityMember } from '../../database/entities/community-member.entity';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community) private communityRepo: Repository<Community>,
    @InjectRepository(CommunityMember) private memberRepo: Repository<CommunityMember>,
    private dataSource: DataSource,
  ) {}

  async findAll(universityId: string, type?: CommunityType) {
    const qb = this.communityRepo.createQueryBuilder('c')
      .where('c.universityId = :universityId', { universityId })
      .andWhere('c.isActive = true');

    if (type) {
      qb.andWhere('c.type = :type', { type });
    }

    return qb
      .select(['c.id', 'c.name', 'c.slug', 'c.description', 'c.type', 'c.iconUrl', 'c.memberCount', 'c.postCount'])
      .orderBy('c.memberCount', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    const community = await this.communityRepo.findOne({
      where: { id, isActive: true },
    });
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async findBySlug(slug: string, universityId: string) {
    const community = await this.communityRepo.findOne({
      where: { slug, universityId, isActive: true },
    });
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async getMyMemberships(userId: string, universityId: string) {
    return this.memberRepo
      .createQueryBuilder('cm')
      .innerJoinAndSelect('cm.community', 'c')
      .where('cm.userId = :userId', { userId })
      .andWhere('c.universityId = :universityId', { universityId })
      .andWhere('c.isActive = true')
      .select(['cm.id', 'cm.joinedAt', 'c.id', 'c.name', 'c.slug', 'c.type', 'c.iconUrl', 'c.memberCount'])
      .orderBy('c.type', 'ASC')
      .getMany();
  }

  async join(userId: string, communityId: string) {
    const community = await this.communityRepo.findOne({
      where: { id: communityId, isActive: true },
    });
    if (!community) throw new NotFoundException('Community not found');

    const existing = await this.memberRepo.findOne({ where: { userId, communityId } });
    if (existing) return { message: 'Already a member' };

    await this.dataSource.transaction(async (manager) => {
      await manager.save(CommunityMember, { userId, communityId });
      await manager.increment(Community, { id: communityId }, 'memberCount', 1);
    });

    return { message: 'Joined community', memberCount: community.memberCount + 1 };
  }

  async leave(userId: string, communityId: string) {
    const community = await this.communityRepo.findOne({
      where: { id: communityId, isActive: true },
    });
    if (!community) throw new NotFoundException('Community not found');

    // Can't leave the campus community
    if (community.type === CommunityType.CAMPUS) {
      throw new ForbiddenException('Cannot leave your campus community');
    }

    const member = await this.memberRepo.findOne({ where: { userId, communityId } });
    if (!member) return { message: 'Not a member' };

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(CommunityMember, { userId, communityId });
      await manager.decrement(Community, { id: communityId }, 'memberCount', 1);
    });

    return { message: 'Left community' };
  }

  async isMember(userId: string, communityId: string): Promise<boolean> {
    const member = await this.memberRepo.findOne({ where: { userId, communityId } });
    return !!member;
  }

  // Auto-create campus community for a new university (called during seeding)
  async createCampusCommunity(universityId: string, universityName: string) {
    const slug = `campus-${universityId.slice(0, 8)}`;
    const existing = await this.communityRepo.findOne({ where: { slug, universityId } });
    if (existing) return existing;

    return this.communityRepo.save({
      name: `${universityName} Campus`,
      slug,
      description: `The official campus community for ${universityName} students`,
      type: CommunityType.CAMPUS,
      universityId,
    });
  }

  // Create course community (called when a course is created)
  async createCourseCommunity(
    universityId: string,
    courseId: string,
    courseCode: string,
    courseName: string,
  ) {
    const slug = `${courseCode.toLowerCase().replace(/\s+/g, '-')}-${universityId.slice(0, 8)}`;
    const existing = await this.communityRepo.findOne({ where: { slug, universityId } });
    if (existing) return existing;

    return this.communityRepo.save({
      name: `${courseCode}: ${courseName}`,
      slug,
      description: `Community for ${courseCode} - ${courseName} students`,
      type: CommunityType.COURSE,
      referenceId: courseId,
      universityId,
    });
  }

  async createMajorCommunity(
    universityId: string,
    majorId: string,
    majorName: string,
  ) {
    const slug = `major-${majorName.toLowerCase().replace(/\s+/g, '-')}-${universityId.slice(0, 8)}`;
    const existing = await this.communityRepo.findOne({ where: { slug, universityId } });
    if (existing) return existing;

    return this.communityRepo.save({
      name: `${majorName}`,
      slug,
      description: `Community for ${majorName} students`,
      type: CommunityType.MAJOR,
      referenceId: majorId,
      universityId,
    });
  }
}
