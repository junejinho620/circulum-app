/**
 * Circulum Database Seed
 * Run with: npx ts-node src/database/seeds/seed.ts
 *
 * Seeds:
 * - University of Toronto (UofT)
 * - 174 Majors
 * - 789 Courses (with descriptions, terms)
 * - 1,178 Professors
 * - 96 Campus Locations
 * - Campus + Major + Course communities
 * - Admin user
 */

import { AppDataSource } from '../data-source';
import { University } from '../entities/university.entity';
import { Major } from '../entities/major.entity';
import { Course } from '../entities/course.entity';
import { Community, CommunityType } from '../entities/community.entity';
import { Professor } from '../entities/professor.entity';
import { CampusLocation, LocationCategory } from '../entities/campus-location.entity';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// ─── Load UofT data from JSON ──────────────────────────────────────────────
const dataPath = path.join(__dirname, 'uoft-data.json');
const uoftData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// ─── Helper: generate short code from program name ─────────────────────────
function generateCode(name: string): string {
  const words = name.replace(/[&,()]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 5).toUpperCase();
}

// ─── Helper: slugify ────────────────────────────────────────────────────────
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// ─── Helper: extract department from course code ────────────────────────────
function deptFromCode(code: string): string {
  const match = code.match(/^[A-Z]+/);
  return match ? match[0] : '';
}

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database\n');

  const universityRepo = AppDataSource.getRepository(University);
  const majorRepo = AppDataSource.getRepository(Major);
  const courseRepo = AppDataSource.getRepository(Course);
  const communityRepo = AppDataSource.getRepository(Community);
  const professorRepo = AppDataSource.getRepository(Professor);
  const locationRepo = AppDataSource.getRepository(CampusLocation);
  const userRepo = AppDataSource.getRepository(User);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. UNIVERSITY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('1. Seeding university...');
  let university = await universityRepo.findOne({ where: { emailDomain: 'mail.utoronto.ca' } });
  if (!university) {
    university = await universityRepo.save({
      name: 'University of Toronto',
      emailDomain: 'mail.utoronto.ca',
      country: 'Canada',
      city: 'Toronto',
    });
    console.log('   Created: University of Toronto');
  } else {
    console.log('   Already exists: University of Toronto');
  }

  const uniId = university.id;

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. MAJORS (174)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`2. Seeding ${uoftData.majors.length} majors...`);
  let majorsCreated = 0;
  const majorEntities: Major[] = [];

  for (const m of uoftData.majors) {
    const code = generateCode(m.name);
    let major = await majorRepo.findOne({ where: { name: m.name, universityId: uniId } });
    if (!major) {
      major = await majorRepo.save({
        name: m.name,
        code,
        universityId: uniId,
      });
      majorsCreated++;
    }
    majorEntities.push(major);
  }
  console.log(`   Created ${majorsCreated} new majors (${majorEntities.length} total)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. COURSES (789)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`3. Seeding ${uoftData.courses.length} courses...`);
  let coursesCreated = 0;
  const courseEntities: Course[] = [];

  for (const c of uoftData.courses) {
    let course = await courseRepo.findOne({ where: { code: c.code, universityId: uniId } });
    if (!course) {
      course = await courseRepo.save({
        code: c.code,
        name: c.name,
        department: c.department || null,
        description: c.description || null,
        terms: c.terms ? c.terms.split(',').map((t: string) => t.trim()) : null,
        universityId: uniId,
      });
      coursesCreated++;
    }
    courseEntities.push(course);
  }
  console.log(`   Created ${coursesCreated} new courses (${courseEntities.length} total)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PROFESSORS (1,178)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`4. Seeding ${uoftData.professors.length} professors...`);
  let profsCreated = 0;

  for (const p of uoftData.professors) {
    const existing = await professorRepo.findOne({
      where: { name: p.name, universityId: uniId },
    });
    if (!existing) {
      const courseCodes = p.courses
        ? p.courses.split(',').map((c: string) => c.trim()).filter(Boolean)
        : [];
      await professorRepo.save({
        name: p.name,
        department: p.department || 'Unknown',
        courses: courseCodes.length > 0 ? courseCodes : null,
        universityId: uniId,
      });
      profsCreated++;
    }
  }
  console.log(`   Created ${profsCreated} new professors`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. CAMPUS LOCATIONS (96)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`5. Seeding ${uoftData.locations.length} campus locations...`);
  let locsCreated = 0;

  const validCategories = Object.values(LocationCategory);
  for (const loc of uoftData.locations) {
    const existing = await locationRepo.findOne({
      where: { name: loc.name, universityId: uniId },
    });
    if (!existing) {
      const category = validCategories.includes(loc.category)
        ? loc.category
        : LocationCategory.LECTURES;

      await locationRepo.save({
        name: loc.name,
        subtitle: loc.subtitle || null,
        category,
        building: loc.building || '',
        floor: loc.floor || null,
        coordX: loc.coordX ?? 0.5,
        coordY: loc.coordY ?? 0.5,
        bestTime: loc.bestTime || null,
        tags: loc.tags ? loc.tags.split(',').map((t: string) => t.trim()) : null,
        universityId: uniId,
      });
      locsCreated++;
    }
  }
  console.log(`   Created ${locsCreated} new campus locations`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. COMMUNITIES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('6. Seeding communities...');
  let commCreated = 0;

  // Campus community
  let campusCommunity = await communityRepo.findOne({
    where: { type: CommunityType.CAMPUS, universityId: uniId },
  });
  if (!campusCommunity) {
    campusCommunity = await communityRepo.save({
      name: 'UofT Campus',
      slug: 'uoft-campus',
      description: 'The official anonymous community for all University of Toronto students',
      type: CommunityType.CAMPUS,
      universityId: uniId,
    });
    commCreated++;
  }

  // Major communities (top 30 by importance)
  const topMajors = majorEntities.slice(0, 30);
  for (const major of topMajors) {
    const slug = `major-${slugify(major.name)}-${uniId.slice(0, 8)}`;
    const existing = await communityRepo.findOne({ where: { slug, universityId: uniId } });
    if (!existing) {
      await communityRepo.save({
        name: major.name,
        slug,
        description: `Community for ${major.name} students at UofT`,
        type: CommunityType.MAJOR,
        referenceId: major.id,
        universityId: uniId,
      });
      commCreated++;
    }
  }

  // Course communities (top 100 courses)
  const topCourses = courseEntities.slice(0, 100);
  for (const course of topCourses) {
    const slug = `course-${slugify(course.code)}-${uniId.slice(0, 8)}`;
    const existing = await communityRepo.findOne({ where: { slug, universityId: uniId } });
    if (!existing) {
      await communityRepo.save({
        name: `${course.code}: ${course.name}`,
        slug,
        description: `Discussion for ${course.code} at UofT`,
        type: CommunityType.COURSE,
        referenceId: course.id,
        universityId: uniId,
      });
      commCreated++;
    }
  }

  // Custom communities (general interest)
  const customCommunities = [
    { name: 'Confessions', slug: 'uoft-confessions', description: 'Anonymous campus confessions' },
    { name: 'Housing', slug: 'uoft-housing', description: 'Roommates, sublets, dorm life' },
    { name: 'Events', slug: 'uoft-events', description: 'Campus events, meetups, parties' },
    { name: 'Marketplace', slug: 'uoft-marketplace', description: 'Buy, sell, trade on campus' },
    { name: 'Mental Health', slug: 'uoft-mental-health', description: 'Support, resources, well-being' },
    { name: 'Career & Co-op', slug: 'uoft-career', description: 'Internships, co-op, job hunting' },
    { name: 'Social', slug: 'uoft-social', description: 'Meet people, hangouts, clubs' },
    { name: 'Memes', slug: 'uoft-memes', description: 'Campus memes and humor' },
  ];

  for (const cc of customCommunities) {
    const existing = await communityRepo.findOne({ where: { slug: cc.slug, universityId: uniId } });
    if (!existing) {
      await communityRepo.save({
        ...cc,
        type: CommunityType.CUSTOM,
        universityId: uniId,
      });
      commCreated++;
    }
  }
  console.log(`   Created ${commCreated} new communities`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. ADMIN USER
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('7. Seeding admin user...');
  let admin = await userRepo.findOne({
    where: [
      { email: 'admin@mail.utoronto.ca' },
      { handle: 'CirculumAdmin' },
    ],
  });
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin@circulum1', 12);
    admin = await userRepo.save({
      email: 'admin@mail.utoronto.ca',
      passwordHash,
      handle: 'CirculumAdmin',
      universityId: uniId,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    });
    console.log('   Created admin: admin@mail.utoronto.ca');
  } else {
    console.log('   Admin already exists');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SEED COMPLETE');
  console.log('══════════════════════════════════════');
  console.log(`University:       ${university.name} (${university.emailDomain})`);
  console.log(`Majors:           ${majorEntities.length}`);
  console.log(`Courses:          ${courseEntities.length}`);
  console.log(`Professors:       ${uoftData.professors.length}`);
  console.log(`Campus Locations:  ${uoftData.locations.length}`);
  console.log(`Admin:            admin@mail.utoronto.ca`);
  console.log('══════════════════════════════════════\n');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
