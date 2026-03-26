import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyBuddyProfile } from '../../database/entities/study-buddy-profile.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { StudySessionParticipant } from '../../database/entities/study-session-participant.entity';
import { UserCourse } from '../../database/entities/user-course.entity';

export interface UpsertProfileDto {
  intensity?: string;
  location?: string;
  preference?: string;
  bio?: string;
  studyStyle?: string[];
  availability?: string[];
  courses?: string[];
  isVisible?: boolean;
}

export interface CreateSessionDto {
  courseCode: string;
  date: string;
  location: string;
  duration: string;
  goal?: string;
  isPublic?: boolean;
  maxParticipants?: number;
}

@Injectable()
export class StudyBuddyService {
  constructor(
    @InjectRepository(StudyBuddyProfile) private profileRepo: Repository<StudyBuddyProfile>,
    @InjectRepository(StudySession) private sessionRepo: Repository<StudySession>,
    @InjectRepository(StudySessionParticipant) private participantRepo: Repository<StudySessionParticipant>,
    @InjectRepository(UserCourse) private userCourseRepo: Repository<UserCourse>,
  ) {}

  // ─── Profiles & Matching ──────────────────────────────────

  async getOrCreateProfile(userId: string, universityId: string): Promise<StudyBuddyProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId }, relations: ['user'] });
    if (!profile) {
      profile = await this.profileRepo.save(
        this.profileRepo.create({ userId, universityId }),
      );
    }
    return profile;
  }

  async updateProfile(userId: string, universityId: string, dto: UpsertProfileDto) {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId, universityId });
    }
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }

  async findMatches(userId: string, universityId: string) {
    const myProfile = await this.profileRepo.findOne({ where: { userId } });
    const myCourses = myProfile?.courses ?? [];

    // Get user's enrolled courses as fallback
    if (myCourses.length === 0) {
      const enrollments = await this.userCourseRepo.find({
        where: { userId },
        relations: ['course'],
      });
      myCourses.push(...enrollments.map((e) => e.course?.code).filter(Boolean));
    }

    // Find visible profiles at same university (excluding self)
    const candidates = await this.profileRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .where('p.universityId = :universityId', { universityId })
      .andWhere('p.userId != :userId', { userId })
      .andWhere('p.isVisible = true')
      .getMany();

    // Compute compatibility scores
    return candidates.map((c) => {
      const theirCourses = c.courses ?? [];
      const sharedCourses = myCourses.filter((mc) => theirCourses.includes(mc));
      const courseOverlap = myCourses.length > 0 ? sharedCourses.length / myCourses.length : 0;

      const intensityMatch = myProfile?.intensity === c.intensity ? 1 : 0.5;
      const prefMatch = myProfile?.preference === c.preference || c.preference === 'both' ? 1 : 0.5;

      const compatibility = Math.round(
        (courseOverlap * 50 + intensityMatch * 25 + prefMatch * 25),
      );

      return {
        id: c.id,
        userId: c.userId,
        name: c.user?.handle ?? 'Anonymous',
        initial: (c.user?.handle ?? 'A').charAt(0).toUpperCase(),
        courses: theirCourses,
        sharedCourses,
        freeSlots: c.availability ?? [],
        intensity: c.intensity,
        location: c.location ?? 'Not set',
        preference: c.preference,
        bio: c.bio ?? '',
        studyStyle: c.studyStyle ?? [],
        reliability: c.reliability,
        sessionsCompleted: c.sessionsCompleted,
        compatibility,
        active: true,
      };
    }).sort((a, b) => b.compatibility - a.compatibility);
  }

  // ─── Sessions ─────────────────────────────────────────────

  async getSessions(universityId: string) {
    return this.sessionRepo.find({
      where: { universityId, isPublic: true },
      relations: ['creator', 'participants', 'participants.user'],
      order: { date: 'ASC' },
    });
  }

  async createSession(userId: string, universityId: string, dto: CreateSessionDto) {
    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        ...dto,
        date: new Date(dto.date),
        creatorId: userId,
        universityId,
        participantCount: 1,
      }),
    );

    // Auto-join creator
    await this.participantRepo.save(
      this.participantRepo.create({ sessionId: session.id, userId }),
    );

    return session;
  }

  async joinSession(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.participantCount >= session.maxParticipants) {
      throw new BadRequestException('Session is full');
    }

    const existing = await this.participantRepo.findOne({ where: { sessionId, userId } });
    if (existing) throw new ConflictException('Already joined');

    await this.participantRepo.save(
      this.participantRepo.create({ sessionId, userId }),
    );
    await this.sessionRepo.increment({ id: sessionId }, 'participantCount', 1);
    return { success: true };
  }

  async leaveSession(sessionId: string, userId: string) {
    const result = await this.participantRepo.delete({ sessionId, userId });
    if (result.affected) {
      await this.sessionRepo.decrement({ id: sessionId }, 'participantCount', 1);
    }
    return { success: true };
  }
}
