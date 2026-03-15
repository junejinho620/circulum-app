"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../data-source");
const university_entity_1 = require("../entities/university.entity");
const major_entity_1 = require("../entities/major.entity");
const course_entity_1 = require("../entities/course.entity");
const community_entity_1 = require("../entities/community.entity");
const user_entity_1 = require("../entities/user.entity");
const bcrypt = require("bcryptjs");
async function seed() {
    await data_source_1.AppDataSource.initialize();
    console.log('Connected to database');
    const universityRepo = data_source_1.AppDataSource.getRepository(university_entity_1.University);
    const majorRepo = data_source_1.AppDataSource.getRepository(major_entity_1.Major);
    const courseRepo = data_source_1.AppDataSource.getRepository(course_entity_1.Course);
    const communityRepo = data_source_1.AppDataSource.getRepository(community_entity_1.Community);
    const userRepo = data_source_1.AppDataSource.getRepository(user_entity_1.User);
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
    const majors = [];
    for (const m of majorData) {
        let major = await majorRepo.findOne({ where: { code: m.code, universityId: university.id } });
        if (!major) {
            major = await majorRepo.save({ ...m, universityId: university.id });
        }
        majors.push(major);
    }
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
    const courses = [];
    for (const c of courseData) {
        let course = await courseRepo.findOne({ where: { code: c.code, universityId: university.id } });
        if (!course) {
            course = await courseRepo.save({ ...c, universityId: university.id });
        }
        courses.push(course);
    }
    console.log('Seeding communities...');
    let campusCommunity = await communityRepo.findOne({
        where: { type: community_entity_1.CommunityType.CAMPUS, universityId: university.id },
    });
    if (!campusCommunity) {
        campusCommunity = await communityRepo.save({
            name: 'UCT Campus',
            slug: 'uct-campus',
            description: 'The official anonymous community for all UCT students',
            type: community_entity_1.CommunityType.CAMPUS,
            universityId: university.id,
        });
        console.log('Created campus community');
    }
    for (const major of majors) {
        const slug = `major-${major.code.toLowerCase()}-${university.id.slice(0, 8)}`;
        const existing = await communityRepo.findOne({ where: { slug, universityId: university.id } });
        if (!existing) {
            await communityRepo.save({
                name: major.name,
                slug,
                description: `Community for ${major.name} students at UCT`,
                type: community_entity_1.CommunityType.MAJOR,
                referenceId: major.id,
                universityId: university.id,
            });
        }
    }
    for (const course of courses) {
        const slug = `course-${course.code.toLowerCase()}-${university.id.slice(0, 8)}`;
        const existing = await communityRepo.findOne({ where: { slug, universityId: university.id } });
        if (!existing) {
            await communityRepo.save({
                name: `${course.code}: ${course.name}`,
                slug,
                description: `Anonymous community for ${course.code} students`,
                type: community_entity_1.CommunityType.COURSE,
                referenceId: course.id,
                universityId: university.id,
            });
        }
    }
    console.log('Seeding admin user...');
    let admin = await userRepo.findOne({ where: { email: 'admin@uct.ac.za' } });
    if (!admin) {
        const passwordHash = await bcrypt.hash('Admin@circulum1', 12);
        admin = await userRepo.save({
            email: 'admin@uct.ac.za',
            passwordHash,
            handle: 'CirculumAdmin',
            universityId: university.id,
            role: user_entity_1.UserRole.ADMIN,
            status: user_entity_1.UserStatus.ACTIVE,
            isEmailVerified: true,
        });
        console.log('Created admin user: admin@uct.ac.za');
    }
    console.log('Seed complete!');
    console.log(`University: ${university.name} (${university.emailDomain})`);
    console.log(`Majors: ${majors.length}`);
    console.log(`Courses: ${courses.length}`);
    await data_source_1.AppDataSource.destroy();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map