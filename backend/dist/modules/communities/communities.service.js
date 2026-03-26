"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const community_entity_1 = require("../../database/entities/community.entity");
const community_member_entity_1 = require("../../database/entities/community-member.entity");
let CommunitiesService = class CommunitiesService {
    constructor(communityRepo, memberRepo, dataSource) {
        this.communityRepo = communityRepo;
        this.memberRepo = memberRepo;
        this.dataSource = dataSource;
    }
    async findAll(universityId, type, limit = 30) {
        const qb = this.communityRepo.createQueryBuilder('c')
            .where('c.universityId = :universityId', { universityId })
            .andWhere('c.isActive = true');
        if (type) {
            qb.andWhere('c.type = :type', { type });
        }
        if (!type) {
            qb.andWhere('c.type != :courseType', { courseType: community_entity_1.CommunityType.COURSE });
        }
        return qb
            .select(['c.id', 'c.name', 'c.slug', 'c.description', 'c.type', 'c.iconUrl', 'c.memberCount', 'c.postCount'])
            .orderBy('c.memberCount', 'DESC')
            .take(limit)
            .getMany();
    }
    async findOne(id) {
        const community = await this.communityRepo.findOne({
            where: { id, isActive: true },
        });
        if (!community)
            throw new common_1.NotFoundException('Community not found');
        return community;
    }
    async findBySlug(slug, universityId) {
        const community = await this.communityRepo.findOne({
            where: { slug, universityId, isActive: true },
        });
        if (!community)
            throw new common_1.NotFoundException('Community not found');
        return community;
    }
    async getMyMemberships(userId, universityId) {
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
    async join(userId, communityId) {
        const community = await this.communityRepo.findOne({
            where: { id: communityId, isActive: true },
        });
        if (!community)
            throw new common_1.NotFoundException('Community not found');
        const existing = await this.memberRepo.findOne({ where: { userId, communityId } });
        if (existing)
            return { message: 'Already a member' };
        await this.dataSource.transaction(async (manager) => {
            await manager.save(community_member_entity_1.CommunityMember, { userId, communityId });
            await manager.increment(community_entity_1.Community, { id: communityId }, 'memberCount', 1);
        });
        return { message: 'Joined community', memberCount: community.memberCount + 1 };
    }
    async leave(userId, communityId) {
        const community = await this.communityRepo.findOne({
            where: { id: communityId, isActive: true },
        });
        if (!community)
            throw new common_1.NotFoundException('Community not found');
        if (community.type === community_entity_1.CommunityType.CAMPUS) {
            throw new common_1.ForbiddenException('Cannot leave your campus community');
        }
        const member = await this.memberRepo.findOne({ where: { userId, communityId } });
        if (!member)
            return { message: 'Not a member' };
        await this.dataSource.transaction(async (manager) => {
            await manager.delete(community_member_entity_1.CommunityMember, { userId, communityId });
            await manager.decrement(community_entity_1.Community, { id: communityId }, 'memberCount', 1);
        });
        return { message: 'Left community' };
    }
    async isMember(userId, communityId) {
        const member = await this.memberRepo.findOne({ where: { userId, communityId } });
        return !!member;
    }
    async createCampusCommunity(universityId, universityName) {
        const slug = `campus-${universityId.slice(0, 8)}`;
        const existing = await this.communityRepo.findOne({ where: { slug, universityId } });
        if (existing)
            return existing;
        return this.communityRepo.save({
            name: `${universityName} Campus`,
            slug,
            description: `The official campus community for ${universityName} students`,
            type: community_entity_1.CommunityType.CAMPUS,
            universityId,
        });
    }
    async createCourseCommunity(universityId, courseId, courseCode, courseName) {
        const slug = `${courseCode.toLowerCase().replace(/\s+/g, '-')}-${universityId.slice(0, 8)}`;
        const existing = await this.communityRepo.findOne({ where: { slug, universityId } });
        if (existing)
            return existing;
        return this.communityRepo.save({
            name: `${courseCode}: ${courseName}`,
            slug,
            description: `Community for ${courseCode} - ${courseName} students`,
            type: community_entity_1.CommunityType.COURSE,
            referenceId: courseId,
            universityId,
        });
    }
    async createMajorCommunity(universityId, majorId, majorName) {
        const slug = `major-${majorName.toLowerCase().replace(/\s+/g, '-')}-${universityId.slice(0, 8)}`;
        const existing = await this.communityRepo.findOne({ where: { slug, universityId } });
        if (existing)
            return existing;
        return this.communityRepo.save({
            name: `${majorName}`,
            slug,
            description: `Community for ${majorName} students`,
            type: community_entity_1.CommunityType.MAJOR,
            referenceId: majorId,
            universityId,
        });
    }
};
exports.CommunitiesService = CommunitiesService;
exports.CommunitiesService = CommunitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(community_entity_1.Community)),
    __param(1, (0, typeorm_1.InjectRepository)(community_member_entity_1.CommunityMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], CommunitiesService);
//# sourceMappingURL=communities.service.js.map