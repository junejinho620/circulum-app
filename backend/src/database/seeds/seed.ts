/**
 * Circulum Database Seed
 * Run with: npm run seed
 *
 * Seeds:
 * - 1 University (University of Cape Town - UCT)
 * - Majors
 * - Courses
 * - Campus community
 * - Course communities
 * - Admin user
 */

import { AppDataSource } from '../data-source';
import { University } from '../entities/university.entity';
import { Major } from '../entities/major.entity';
import { Course } from '../entities/course.entity';
import { Community, CommunityType } from '../entities/community.entity';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database');

  const universityRepo = AppDataSource.getRepository(University);
  const majorRepo = AppDataSource.getRepository(Major);
  const courseRepo = AppDataSource.getRepository(Course);
  const communityRepo = AppDataSource.getRepository(Community);
  const userRepo = AppDataSource.getRepository(User);

  // 1. Create University
  console.log('Seeding university...');
  let university = await universityRepo.findOne({ where: { emailDomain: 'uct.ac.za' } });
  if (!university) {
    university = await universityRepo.save({
      name: 'University of Cape Town',
      emailDomain: 'uct.ac.za',
      country: 'South Africa',
      city: 'Cape Town',
    });
    console.log('Created UCT');
  }

  // 2. Create Majors
  console.log('Seeding majors...');
  const majorData = [
    { name: 'Computer Science', code: 'CS' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Physics', code: 'PHYS' },
    { name: 'Economics', code: 'ECO' },
    { name: 'Law', code: 'LAW' },
    { name: 'Medicine', code: 'MED' },
    { name: 'Engineering', code: 'ENG' },
    { name: 'Commerce', code: 'COM' },
    { name: 'Humanities', code: 'HUM' },
    { name: 'Science', code: 'SCI' },
  ];

  const majors: Major[] = [];
  for (const m of majorData) {
    let major = await majorRepo.findOne({ where: { code: m.code, universityId: university.id } });
    if (!major) {
      major = await majorRepo.save({ ...m, universityId: university.id });
    }
    majors.push(major);
  }

  // 3. Create Courses
  console.log('Seeding courses...');
  const courseData = [
    { code: 'CSC1015F', name: 'Introduction to Computer Science I', department: 'Computer Science' },
    { code: 'CSC1016S', name: 'Introduction to Computer Science II', department: 'Computer Science' },
    { code: 'CSC2001F', name: 'Data Structures', department: 'Computer Science' },
    { code: 'CSC2002S', name: 'Algorithms', department: 'Computer Science' },
    { code: 'CSC3002F', name: 'Software Development', department: 'Computer Science' },
    { code: 'MAM1000W', name: 'Mathematics 1000', department: 'Mathematics' },
    { code: 'MAM2000W', name: 'Mathematics 2000', department: 'Mathematics' },
    { code: 'PHY1004W', name: 'Physics 1004', department: 'Physics' },
    { code: 'ECO1010F', name: 'Microeconomics', department: 'Economics' },
    { code: 'ECO1011S', name: 'Macroeconomics', department: 'Economics' },
    { code: 'EGS2001F', name: 'Engineering Drawing', department: 'Engineering' },
    { code: 'MEC3020F', name: 'Thermodynamics', department: 'Engineering' },
    { code: 'STA2004F', name: 'Statistical Theory', department: 'Statistics' },
    { code: 'INF3014F', name: 'Database Systems', department: 'Information Systems' },
  ];

  const courses: Course[] = [];
  for (const c of courseData) {
    let course = await courseRepo.findOne({ where: { code: c.code, universityId: university.id } });
    if (!course) {
      course = await courseRepo.save({ ...c, universityId: university.id });
    }
    courses.push(course);
  }

  // 4. Create Campus Community
  console.log('Seeding communities...');
  let campusCommunity = await communityRepo.findOne({
    where: { type: CommunityType.CAMPUS, universityId: university.id },
  });
  if (!campusCommunity) {
    campusCommunity = await communityRepo.save({
      name: 'UCT Campus',
      slug: 'uct-campus',
      description: 'The official anonymous community for all UCT students',
      type: CommunityType.CAMPUS,
      universityId: university.id,
    });
    console.log('Created campus community');
  }

  // 5. Create Major Communities
  for (const major of majors) {
    const slug = `major-${major.code.toLowerCase()}-${university.id.slice(0, 8)}`;
    const existing = await communityRepo.findOne({ where: { slug, universityId: university.id } });
    if (!existing) {
      await communityRepo.save({
        name: major.name,
        slug,
        description: `Community for ${major.name} students at UCT`,
        type: CommunityType.MAJOR,
        referenceId: major.id,
        universityId: university.id,
      });
    }
  }

  // 6. Create Course Communities
  for (const course of courses) {
    const slug = `course-${course.code.toLowerCase()}-${university.id.slice(0, 8)}`;
    const existing = await communityRepo.findOne({ where: { slug, universityId: university.id } });
    if (!existing) {
      await communityRepo.save({
        name: `${course.code}: ${course.name}`,
        slug,
        description: `Anonymous community for ${course.code} students`,
        type: CommunityType.COURSE,
        referenceId: course.id,
        universityId: university.id,
      });
    }
  }

  // 7. Create Admin User
  console.log('Seeding admin user...');
  let admin = await userRepo.findOne({ where: { email: 'admin@uct.ac.za' } });
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin@circulum1', 12);
    admin = await userRepo.save({
      email: 'admin@uct.ac.za',
      passwordHash,
      handle: 'CirculumAdmin',
      universityId: university.id,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    });
    console.log('Created admin user: admin@uct.ac.za');
  }

  console.log('Seed complete!');
  console.log(`University: ${university.name} (${university.emailDomain})`);
  console.log(`Majors: ${majors.length}`);
  console.log(`Courses: ${courses.length}`);

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
