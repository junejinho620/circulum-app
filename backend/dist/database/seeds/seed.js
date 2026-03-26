"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../data-source");
const university_entity_1 = require("../entities/university.entity");
const major_entity_1 = require("../entities/major.entity");
const course_entity_1 = require("../entities/course.entity");
const community_entity_1 = require("../entities/community.entity");
const professor_entity_1 = require("../entities/professor.entity");
const campus_location_entity_1 = require("../entities/campus-location.entity");
const user_entity_1 = require("../entities/user.entity");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, 'uoft-data.json');
const uoftData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
function generateCode(name) {
    const words = name.replace(/[&,()]/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length === 1)
        return words[0].slice(0, 4).toUpperCase();
    return words.map((w) => w[0]).join('').slice(0, 5).toUpperCase();
}
function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}
function deptFromCode(code) {
    const match = code.match(/^[A-Z]+/);
    return match ? match[0] : '';
}
async function seed() {
    await data_source_1.AppDataSource.initialize();
    console.log('Connected to database\n');
    const universityRepo = data_source_1.AppDataSource.getRepository(university_entity_1.University);
    const majorRepo = data_source_1.AppDataSource.getRepository(major_entity_1.Major);
    const courseRepo = data_source_1.AppDataSource.getRepository(course_entity_1.Course);
    const communityRepo = data_source_1.AppDataSource.getRepository(community_entity_1.Community);
    const professorRepo = data_source_1.AppDataSource.getRepository(professor_entity_1.Professor);
    const locationRepo = data_source_1.AppDataSource.getRepository(campus_location_entity_1.CampusLocation);
    const userRepo = data_source_1.AppDataSource.getRepository(user_entity_1.User);
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
    }
    else {
        console.log('   Already exists: University of Toronto');
    }
    const uniId = university.id;
    console.log(`2. Seeding ${uoftData.majors.length} majors...`);
    let majorsCreated = 0;
    const majorEntities = [];
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
    console.log(`3. Seeding ${uoftData.courses.length} courses...`);
    let coursesCreated = 0;
    const courseEntities = [];
    for (const c of uoftData.courses) {
        let course = await courseRepo.findOne({ where: { code: c.code, universityId: uniId } });
        if (!course) {
            course = await courseRepo.save({
                code: c.code,
                name: c.name,
                department: c.department || null,
                description: c.description || null,
                terms: c.terms ? c.terms.split(',').map((t) => t.trim()) : null,
                universityId: uniId,
            });
            coursesCreated++;
        }
        courseEntities.push(course);
    }
    console.log(`   Created ${coursesCreated} new courses (${courseEntities.length} total)`);
    console.log(`4. Seeding ${uoftData.professors.length} professors...`);
    let profsCreated = 0;
    for (const p of uoftData.professors) {
        const existing = await professorRepo.findOne({
            where: { name: p.name, universityId: uniId },
        });
        if (!existing) {
            const courseCodes = p.courses
                ? p.courses.split(',').map((c) => c.trim()).filter(Boolean)
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
    console.log(`5. Seeding ${uoftData.locations.length} campus locations...`);
    let locsCreated = 0;
    const validCategories = Object.values(campus_location_entity_1.LocationCategory);
    for (const loc of uoftData.locations) {
        const existing = await locationRepo.findOne({
            where: { name: loc.name, universityId: uniId },
        });
        if (!existing) {
            const category = validCategories.includes(loc.category)
                ? loc.category
                : campus_location_entity_1.LocationCategory.LECTURES;
            await locationRepo.save({
                name: loc.name,
                subtitle: loc.subtitle || null,
                category,
                building: loc.building || '',
                floor: loc.floor || null,
                coordX: loc.coordX ?? 0.5,
                coordY: loc.coordY ?? 0.5,
                bestTime: loc.bestTime || null,
                tags: loc.tags ? loc.tags.split(',').map((t) => t.trim()) : null,
                universityId: uniId,
            });
            locsCreated++;
        }
    }
    console.log(`   Created ${locsCreated} new campus locations`);
    console.log('6. Seeding communities...');
    let commCreated = 0;
    let campusCommunity = await communityRepo.findOne({
        where: { type: community_entity_1.CommunityType.CAMPUS, universityId: uniId },
    });
    if (!campusCommunity) {
        campusCommunity = await communityRepo.save({
            name: 'UofT Campus',
            slug: 'uoft-campus',
            description: 'The official anonymous community for all University of Toronto students',
            type: community_entity_1.CommunityType.CAMPUS,
            universityId: uniId,
        });
        commCreated++;
    }
    const topMajors = majorEntities.slice(0, 30);
    for (const major of topMajors) {
        const slug = `major-${slugify(major.name)}-${uniId.slice(0, 8)}`;
        const existing = await communityRepo.findOne({ where: { slug, universityId: uniId } });
        if (!existing) {
            await communityRepo.save({
                name: major.name,
                slug,
                description: `Community for ${major.name} students at UofT`,
                type: community_entity_1.CommunityType.MAJOR,
                referenceId: major.id,
                universityId: uniId,
            });
            commCreated++;
        }
    }
    const topCourses = courseEntities.slice(0, 100);
    for (const course of topCourses) {
        const slug = `course-${slugify(course.code)}-${uniId.slice(0, 8)}`;
        const existing = await communityRepo.findOne({ where: { slug, universityId: uniId } });
        if (!existing) {
            await communityRepo.save({
                name: `${course.code}: ${course.name}`,
                slug,
                description: `Discussion for ${course.code} at UofT`,
                type: community_entity_1.CommunityType.COURSE,
                referenceId: course.id,
                universityId: uniId,
            });
            commCreated++;
        }
    }
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
                type: community_entity_1.CommunityType.CUSTOM,
                universityId: uniId,
            });
            commCreated++;
        }
    }
    console.log(`   Created ${commCreated} new communities`);
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
            role: user_entity_1.UserRole.ADMIN,
            status: user_entity_1.UserStatus.ACTIVE,
            isEmailVerified: true,
        });
        console.log('   Created admin: admin@mail.utoronto.ca');
    }
    else {
        console.log('   Admin already exists');
    }
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
    await data_source_1.AppDataSource.destroy();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map