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
  // 6. COMMUNITIES (curated social communities — NOT auto-generated from majors/courses)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('6. Seeding communities...');

  // First: clean up any auto-generated major/course communities from previous seeds
  const autoGenerated = await communityRepo.find({
    where: [
      { type: CommunityType.MAJOR, universityId: uniId },
      { type: CommunityType.COURSE, universityId: uniId },
    ],
  });
  if (autoGenerated.length > 0) {
    await communityRepo.remove(autoGenerated);
    console.log(`   Removed ${autoGenerated.length} auto-generated major/course communities`);
  }

  let commCreated = 0;

  const communities = [
    // Campus (1)
    { name: 'UofT Campus', slug: 'uoft-campus', description: 'The official anonymous community for all University of Toronto students', type: CommunityType.CAMPUS },

    // Core social communities — matching the original app design
    { name: 'Classes', slug: 'uoft-classes', description: 'Course discussions, notes, exam help, and study tips', type: CommunityType.CUSTOM },
    { name: 'Confessions', slug: 'uoft-confessions', description: 'Anonymous campus confessions — say what you really think', type: CommunityType.CUSTOM },
    { name: 'Housing', slug: 'uoft-housing', description: 'Roommates, sublets, dorm life, and housing advice', type: CommunityType.CUSTOM },
    { name: 'Events', slug: 'uoft-events', description: 'Campus events, meetups, parties, and social gatherings', type: CommunityType.CUSTOM },
    { name: 'Marketplace', slug: 'uoft-marketplace', description: 'Buy, sell, and trade on campus', type: CommunityType.CUSTOM },
    { name: 'Social', slug: 'uoft-social', description: 'Meet people, hangouts, clubs, and campus life', type: CommunityType.CUSTOM },
    { name: 'Mental Health', slug: 'uoft-mental-health', description: 'Support, resources, well-being, and self-care', type: CommunityType.CUSTOM },
    { name: 'Career & Co-op', slug: 'uoft-career', description: 'Internships, co-op, job hunting, and career advice', type: CommunityType.CUSTOM },
    { name: 'Memes', slug: 'uoft-memes', description: 'Campus memes, humor, and relatable UofT moments', type: CommunityType.CUSTOM },

    // Interest & lifestyle communities
    { name: 'Photography Club', slug: 'uoft-photography', description: 'Campus through the lens — share your shots', type: CommunityType.CUSTOM },
    { name: 'Board Games', slug: 'uoft-boardgames', description: 'Weekly game nights, meetups, and strategy talk', type: CommunityType.CUSTOM },
    { name: 'St. George Local', slug: 'uoft-stgeorge', description: 'Spots, deals, and hidden gems near campus', type: CommunityType.CUSTOM },
    { name: 'Kensington Market', slug: 'uoft-kensington', description: 'Food, thrift, and community vibes', type: CommunityType.CUSTOM },
    { name: 'Fitness & Gym', slug: 'uoft-fitness', description: 'Workouts, gym buddies, sports, and health tips', type: CommunityType.CUSTOM },
    { name: 'Food & Cooking', slug: 'uoft-food', description: 'Best eats, recipes, and dining on a student budget', type: CommunityType.CUSTOM },
    { name: 'Music', slug: 'uoft-music', description: 'Playlists, concerts, jam sessions, and music discovery', type: CommunityType.CUSTOM },
    { name: 'Gaming', slug: 'uoft-gaming', description: 'PC, console, mobile gaming — find your squad', type: CommunityType.CUSTOM },
    { name: 'International Students', slug: 'uoft-international', description: 'Resources, experiences, and community for international students', type: CommunityType.CUSTOM },
    { name: 'Commuters', slug: 'uoft-commuters', description: 'TTC tips, commute rants, and carpool connections', type: CommunityType.CUSTOM },
    { name: 'Lost & Found', slug: 'uoft-lostandfound', description: 'Lost something on campus? Found something? Post here', type: CommunityType.CUSTOM },
    { name: 'Relationships', slug: 'uoft-relationships', description: 'Dating, friendships, and relationship advice', type: CommunityType.CUSTOM },
    { name: 'Startups & Side Projects', slug: 'uoft-startups', description: 'Founders, builders, and side project hustlers', type: CommunityType.CUSTOM },
    { name: 'Grad School', slug: 'uoft-gradschool', description: 'Applications, research life, and grad student community', type: CommunityType.CUSTOM },
  ];

  for (const comm of communities) {
    const existing = await communityRepo.findOne({ where: { slug: comm.slug, universityId: uniId } });
    if (!existing) {
      await communityRepo.save({ ...comm, universityId: uniId });
      commCreated++;
    }
  }
  console.log(`   Created ${commCreated} new communities (${communities.length} total curated)`);

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
  // 8. SEED USERS (anonymous student accounts for realistic content)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('8. Seeding demo users...');
  const postRepo = AppDataSource.getRepository('Post');
  const commentRepo = AppDataSource.getRepository('Comment');
  const pollRepo = AppDataSource.getRepository('Poll');
  const pollOptionRepo = AppDataSource.getRepository('PollOption');
  const studyProfileRepo = AppDataSource.getRepository('StudyBuddyProfile');
  const studySessionRepo = AppDataSource.getRepository('StudySessionParticipant');
  const sessionRepo = AppDataSource.getRepository('StudySession');

  const demoHandles = [
    'QuantumFox', 'NightOwl42', 'CaffeineCoder', 'SleepyPanda', 'MathGremlin',
    'LibraryGhost', 'RobartsRat', 'MidnightRamen', 'ProofByPanic', 'BahenBandit',
    'EconEnjoyer', 'PhiloSophmore', 'LabRatVibes', 'WiFiWarrior', 'GradCafe',
  ];

  const demoUsers: any[] = [];
  const demoPassword = await bcrypt.hash('Demo@user123', 12);

  for (let i = 0; i < demoHandles.length; i++) {
    const handle = demoHandles[i];
    let user = await userRepo.findOne({ where: { handle } });
    if (!user) {
      user = await userRepo.save({
        email: `demo${i + 1}@mail.utoronto.ca`,
        passwordHash: demoPassword,
        handle,
        universityId: uniId,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        bio: ['CS nerd', '2nd year econ', 'math is life', 'just vibing', 'sleep-deprived eng student', 'coffee > sleep', 'library dweller', 'procrastinator supreme'][i % 8],
        year: ['1st', '2nd', '3rd', '4th', '2nd', '3rd', 'Grad', '1st'][i % 8],
      });
    }
    demoUsers.push(user);
  }
  console.log(`   ${demoUsers.length} demo users ready`);

  // Helper: get community by slug
  const getComm = async (slug: string) => communityRepo.findOne({ where: { slug, universityId: uniId } });

  // Seed community memberships — each demo user joins 4-8 random communities
  const memberRepo2 = AppDataSource.getRepository('CommunityMember');
  const allComms = await communityRepo.find({ where: { universityId: uniId } });
  const existingMembers = await memberRepo2.count();
  if (existingMembers === 0) {
    for (const user of demoUsers) {
      const shuffled = [...allComms].sort(() => Math.random() - 0.5);
      const toJoin = shuffled.slice(0, Math.floor(Math.random() * 5) + 4);
      for (const comm of toJoin) {
        const exists = await memberRepo2.findOne({ where: { userId: user.id, communityId: comm.id } });
        if (!exists) {
          await memberRepo2.save({ userId: user.id, communityId: comm.id });
          await communityRepo.increment({ id: comm.id }, 'memberCount', 1);
        }
      }
    }
    console.log('   Seeded community memberships');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. SEED POSTS & COMMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('9. Seeding posts & comments...');
  const existingPosts = await postRepo.count({ where: { universityId: uniId } });
  if (existingPosts === 0) {
    const postSeedData = [
      { comm: 'uoft-confessions', title: 'I pretend to study at Robarts but I just people-watch for 3 hours', body: 'Floor 9, corner seat. Best show on campus. The couple that argues at the same table every Tuesday is my favorite storyline.', cat: 'general', author: 0 },
      { comm: 'uoft-confessions', title: 'I have a crush on someone in my MAT237 tutorial but they only talk about epsilon-delta proofs', body: 'How do I compete with the limit definition of continuity?', cat: 'general', author: 1 },
      { comm: 'uoft-classes', title: 'CSC263 midterm was absolutely brutal', body: 'That AVL tree question had no mercy. Who else barely finished? How are we feeling about the curve?', cat: 'study', author: 2 },
      { comm: 'uoft-classes', title: 'Best bird courses for breadth requirement?', body: 'Need a Group 3 breadth for next semester. Something with no final exam if possible. AST101? MUS111? Drop your recs.', cat: 'study', author: 3 },
      { comm: 'uoft-classes', title: 'STA257 - is Brenner or Cheung better?', body: 'Picking my section for winter. I need someone who actually explains things. Reviews on RateMyProf are mixed.', cat: 'study', author: 4 },
      { comm: 'uoft-housing', title: 'Looking for 1 roommate near Spadina - $850/mo', body: '2BR apartment, 5 min walk to Bahen. Lease starts May. I\'m a quiet CS student. DM if interested.', cat: 'buy_sell', author: 5 },
      { comm: 'uoft-housing', title: 'Chestnut Residence honest review', body: 'Lived there first year. Pros: meal plan is decent, close to everything. Cons: tiny rooms, walls are paper thin, fire alarms at 3am. Overall 6/10.', cat: 'general', author: 6 },
      { comm: 'uoft-events', title: 'CS Club hackathon this Saturday - free food and prizes!', body: 'Bahen 5th floor, 10am-10pm. Teams of 4 max. Theme will be announced day-of. Prizes include AirPods and $500 AWS credits. Sign up at the door.', cat: 'event', author: 7 },
      { comm: 'uoft-events', title: 'Free concert at Hart House tonight 8pm', body: 'Jazz ensemble performing. Free entry for UofT students. Last one was amazing, highly recommend.', cat: 'event', author: 8 },
      { comm: 'uoft-marketplace', title: 'Selling TI-84 Plus CE - $60', body: 'Used for one semester. Perfect condition, comes with charging cable. Pick up near campus.', cat: 'buy_sell', author: 9 },
      { comm: 'uoft-marketplace', title: 'Free textbooks - ENG100, PSY100, ECO101', body: 'Graduating and cleaning out. First come first serve. DM me to arrange pickup at Sid Smith.', cat: 'buy_sell', author: 10 },
      { comm: 'uoft-memes', title: 'POV: You\'re "starting the assignment early" but it\'s already 11:59pm', body: 'Every single time. I am not capable of learning from my mistakes apparently.', cat: 'meme', author: 11 },
      { comm: 'uoft-memes', title: 'The Robarts Library starter pack', body: '- Arrive motivated at 9am\n- Find your "spot" taken\n- Wander for 20 minutes\n- Settle for a weird corner\n- Open laptop\n- Reddit for 2 hours\n- Leave at noon "feeling productive"', cat: 'meme', author: 12 },
      { comm: 'uoft-mental-health', title: 'Feeling overwhelmed - how do you deal with midterm season?', body: 'Three midterms in one week and I can barely breathe. Not looking for pity, just genuine coping strategies that work for you.', cat: 'general', author: 13 },
      { comm: 'uoft-mental-health', title: 'Reminder: Health & Wellness Centre has free same-day counseling', body: 'I didn\'t know this until 3rd year. Walk in to 214 College St. No referral needed. It helped me a lot and I wish someone told me sooner.', cat: 'general', author: 14 },
      { comm: 'uoft-career', title: 'Got my first internship offer! Here\'s what worked', body: 'Applied to 87 places, got 5 interviews, 1 offer. Key things: tailored resume for each role, practiced system design on Leetcode, and followed up after career fair conversations. Don\'t give up.', cat: 'general', author: 0 },
      { comm: 'uoft-career', title: 'Is PEY still worth it in 2026?', body: 'Hearing mixed things. Some say the 12-16 month commitment hurts more than it helps. Others say the experience is irreplaceable. What\'s the consensus?', cat: 'general', author: 1 },
      { comm: 'uoft-social', title: 'New to UofT and don\'t know anyone - how do I make friends?', body: 'Transfer student from out of province. Everyone already has their groups. Where do I even start?', cat: 'general', author: 2 },
      { comm: 'uoft-fitness', title: 'AC gym at 7am is elite', body: 'Barely anyone there, all the squat racks free, peaceful energy. The 5pm crowd is a different beast entirely.', cat: 'general', author: 3 },
      { comm: 'uoft-food', title: 'Top 5 cheap eats near campus (under $10)', body: '1. Mystic Muffin (College St) - massive portions\n2. Pho Hung (Spadina) - large pho $9\n3. Roti from any place on Bloor\n4. Pi Co pizza slice + drink combo\n5. Banh Mi Boys', cat: 'general', author: 4 },
      { comm: 'uoft-stgeorge', title: 'The alley behind Baldwin St has the best tacos in Toronto', body: 'Trust me on this one. No sign, just follow the smell. Cash only. Thank me later.', cat: 'general', author: 5 },
      { comm: 'uoft-commuters', title: 'Line 1 broke down AGAIN', body: 'Third time this month. I\'m going to be late for my 9am lecture. Does the TTC actively hate students?', cat: 'general', author: 6 },
      { comm: 'uoft-gaming', title: 'Anyone down for Valorant tonight?', body: 'Need 2 more for a 5-stack. We\'re Gold/Plat range. Chill vibes, no rage. Drop your Riot ID.', cat: 'general', author: 7 },
      { comm: 'uoft-startups', title: 'Looking for a co-founder - AI study assistant app', body: 'Building an app that generates practice questions from lecture slides. I handle the ML side, need someone for iOS/React Native frontend. Serious inquiries only.', cat: 'general', author: 8 },
      { comm: 'uoft-campus', title: 'King\'s College Circle in the fall is peak UofT', body: 'Literally looks like a movie set. The leaves, the architecture, the vibes. If you haven\'t walked through it at golden hour you\'re missing out.', cat: 'general', author: 9 },
    ];

    let postsCreated = 0;
    for (const p of postSeedData) {
      const comm = await getComm(p.comm);
      if (!comm) continue;
      await postRepo.save({
        title: p.title,
        body: p.body,
        category: p.cat,
        authorId: demoUsers[p.author].id,
        communityId: comm.id,
        universityId: uniId,
        upvotes: Math.floor(Math.random() * 80) + 5,
        downvotes: Math.floor(Math.random() * 5),
        commentCount: 0,
        hotScore: Math.random() * 0.5 + 0.1,
      });
      // Increment community post count and member count
      await communityRepo.increment({ id: comm.id }, 'postCount', 1);
      postsCreated++;
    }

    // Add comments to some posts
    const allPosts = await postRepo.find({ where: { universityId: uniId }, take: 15 });
    const commentTexts = [
      'This is so relatable lmao', 'Honestly needed to hear this today',
      'Wait where exactly?? Need to check this out', 'Same experience, can confirm',
      'This should be pinned honestly', 'I feel attacked by this post',
      'Pro tip: bring snacks', 'The real LPT is always in the comments',
      'Underrated take', 'This is the way', '+1 for this recommendation',
      'Saving this for later', 'Who else is reading this instead of studying?',
      'I\'ve been saying this for years', 'As a 4th year, can confirm this gets worse',
    ];

    let commentsCreated = 0;
    for (const post of allPosts) {
      const numComments = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < numComments; i++) {
        const author = demoUsers[Math.floor(Math.random() * demoUsers.length)];
        await commentRepo.save({
          body: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          authorId: author.id,
          postId: post.id,
          upvotes: Math.floor(Math.random() * 20),
          downvotes: Math.floor(Math.random() * 3),
        });
        commentsCreated++;
      }
      await postRepo.update(post.id, { commentCount: numComments });
    }

    console.log(`   Created ${postsCreated} posts and ${commentsCreated} comments`);
  } else {
    console.log(`   Posts already exist (${existingPosts}), skipping`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. SEED POLLS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('10. Seeding polls...');
  const existingPolls = await pollRepo.count({ where: { universityId: uniId } });
  if (existingPolls === 0) {
    const pollsData = [
      {
        question: 'Best study spot on campus?',
        options: ['Robarts Library', 'Gerstein Science', 'Bahen Atrium', 'Hart House', 'E.J. Pratt Library'],
        author: 0,
      },
      {
        question: 'Should finals be open-book?',
        options: ['Yes, always', 'Depends on the course', 'No, defeats the purpose', 'Cheat sheet only'],
        author: 1,
      },
      {
        question: 'Best campus food option?',
        options: ['Sid Smith Café', 'New College Dining', 'Bahen Vending Machines', 'Bring from home', 'Skip meals (broke)'],
        author: 2,
      },
      {
        question: 'How many hours do you actually study per day?',
        options: ['0-1 hours', '2-3 hours', '4-5 hours', '6+ hours', 'What is studying?'],
        author: 3,
      },
      {
        question: 'Worst day for 9am lectures?',
        options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'All of them'],
        author: 4,
      },
      {
        question: 'What CS course should everyone take?',
        options: ['CSC108', 'CSC148', 'CSC207', 'CSC263', 'CSC369'],
        author: 5,
      },
      {
        question: 'UofT mascot should be:',
        options: ['True Blue the Varsity Bear', 'A raccoon', 'The Robarts Concrete Peacock', 'A stressed student'],
        author: 6,
      },
      {
        question: 'Most overrated campus tradition?',
        options: ['Frosh Week', 'Exam season memes', 'Sleeping in Robarts', 'Crying in Bahen'],
        author: 7,
      },
    ];

    let pollsCreated = 0;
    for (const p of pollsData) {
      const poll = await pollRepo.save({
        question: p.question,
        type: 'single',
        status: 'active',
        authorId: demoUsers[p.author].id,
        universityId: uniId,
        totalVotes: 0,
      });

      for (let i = 0; i < p.options.length; i++) {
        const fakeVotes = Math.floor(Math.random() * 40) + 3;
        await pollOptionRepo.save({
          text: p.options[i],
          pollId: poll.id,
          sortOrder: i,
          voteCount: fakeVotes,
        });
        await pollRepo.increment({ id: poll.id }, 'totalVotes', fakeVotes);
      }
      pollsCreated++;
    }
    console.log(`   Created ${pollsCreated} polls`);
  } else {
    console.log(`   Polls already exist (${existingPolls}), skipping`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. SEED STUDY BUDDY PROFILES & SESSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('11. Seeding study buddy profiles & sessions...');
  const existingProfiles = await studyProfileRepo.count({ where: { universityId: uniId } });
  if (existingProfiles === 0) {
    const buddyData = [
      { user: 0, intensity: 'intense', location: 'Robarts Library', preference: 'in_person', courses: ['CSC263', 'MAT237', 'STA257'], style: ['Problem solving', 'Whiteboard', 'Discussion'], avail: ['Mon 2-4pm', 'Wed 3-5pm', 'Fri 1-3pm'] },
      { user: 1, intensity: 'moderate', location: 'Gerstein Science', preference: 'both', courses: ['CSC148', 'MAT135', 'PHY131'], style: ['Flashcards', 'Practice problems', 'Group review'], avail: ['Tue 10am-12pm', 'Thu 2-4pm'] },
      { user: 2, intensity: 'light', location: 'Online (Zoom)', preference: 'online', courses: ['ECO101', 'STA257', 'PSY100'], style: ['Reading together', 'Discussion', 'Note sharing'], avail: ['Mon 7-9pm', 'Wed 7-9pm'] },
      { user: 3, intensity: 'intense', location: 'Bahen Centre', preference: 'in_person', courses: ['CSC263', 'CSC209', 'CSC236'], style: ['Problem solving', 'Code review', 'Pair programming'], avail: ['Mon 10am-12pm', 'Tue 2-4pm', 'Thu 10am-12pm'] },
      { user: 4, intensity: 'moderate', location: 'Hart House Library', preference: 'in_person', courses: ['MAT237', 'MAT224', 'MAT246'], style: ['Proof practice', 'Whiteboard', 'Teaching each other'], avail: ['Wed 1-3pm', 'Fri 10am-12pm'] },
      { user: 5, intensity: 'light', location: 'Victoria College', preference: 'both', courses: ['ENG100', 'HIS106', 'PHL101'], style: ['Essay review', 'Discussion', 'Reading group'], avail: ['Tue 4-6pm', 'Sat 11am-1pm'] },
      { user: 6, intensity: 'intense', location: 'Myhal Centre', preference: 'in_person', courses: ['ECE345', 'ECE331', 'MAT290'], style: ['Problem sets', 'Lab prep', 'Whiteboard'], avail: ['Mon 3-5pm', 'Wed 3-5pm', 'Fri 3-5pm'] },
      { user: 7, intensity: 'moderate', location: 'Robarts Library', preference: 'in_person', courses: ['BIO130', 'CHM135', 'PSY100'], style: ['Concept maps', 'Quiz each other', 'Study guides'], avail: ['Tue 1-3pm', 'Thu 1-3pm'] },
    ];

    for (const b of buddyData) {
      await studyProfileRepo.save({
        userId: demoUsers[b.user].id,
        universityId: uniId,
        intensity: b.intensity,
        location: b.location,
        preference: b.preference,
        courses: b.courses,
        studyStyle: b.style,
        availability: b.avail,
        bio: demoUsers[b.user].bio || '',
        isVisible: true,
        reliability: Math.floor(Math.random() * 20) + 75,
        sessionsCompleted: Math.floor(Math.random() * 20) + 3,
      });
    }

    // Create study sessions
    const now = new Date();
    const sessionData = [
      { code: 'CSC263', location: 'Robarts L3', duration: '2h', goal: 'Midterm review - AVL trees & graph algorithms', creator: 0, days: 1 },
      { code: 'MAT237', location: 'Bahen 2270', duration: '1.5h', goal: 'Problem set 6 collaboration', creator: 4, days: 2 },
      { code: 'STA257', location: 'Online (Zoom)', duration: '1h', goal: 'Practice probability proofs', creator: 1, days: 3 },
      { code: 'ECO101', location: 'Sid Smith 1085', duration: '2h', goal: 'Supply & demand chapter review', creator: 2, days: 1 },
      { code: 'CSC209', location: 'Bahen 5th Floor', duration: '2h', goal: 'Shell scripting & fork/exec practice', creator: 3, days: 4 },
    ];

    for (const s of sessionData) {
      const date = new Date(now);
      date.setDate(date.getDate() + s.days);
      date.setHours(14, 0, 0, 0);

      const session = await sessionRepo.save({
        courseCode: s.code,
        date,
        location: s.location,
        duration: s.duration,
        goal: s.goal,
        isPublic: true,
        maxParticipants: 5,
        participantCount: 1,
        creatorId: demoUsers[s.creator].id,
        universityId: uniId,
      });

      // Creator auto-joins
      await studySessionRepo.save({
        sessionId: session.id,
        userId: demoUsers[s.creator].id,
      });
    }

    console.log(`   Created ${buddyData.length} study buddy profiles and ${sessionData.length} study sessions`);
  } else {
    console.log(`   Study buddy data already exists (${existingProfiles} profiles), skipping`);
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
