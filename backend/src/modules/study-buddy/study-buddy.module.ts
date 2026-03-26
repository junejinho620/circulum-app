import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyBuddyProfile } from '../../database/entities/study-buddy-profile.entity';
import { StudySession } from '../../database/entities/study-session.entity';
import { StudySessionParticipant } from '../../database/entities/study-session-participant.entity';
import { UserCourse } from '../../database/entities/user-course.entity';
import { Course } from '../../database/entities/course.entity';
import { StudyBuddyService } from './study-buddy.service';
import { StudyBuddyController } from './study-buddy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    StudyBuddyProfile, StudySession, StudySessionParticipant,
    UserCourse, Course,
  ])],
  controllers: [StudyBuddyController],
  providers: [StudyBuddyService],
  exports: [StudyBuddyService],
})
export class StudyBuddyModule {}
