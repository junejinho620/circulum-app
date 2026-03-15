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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const crypto_1 = require("crypto");
const user_entity_1 = require("../../database/entities/user.entity");
const university_entity_1 = require("../../database/entities/university.entity");
const email_service_1 = require("../notifications/email.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(userRepo, universityRepo, jwtService, config, emailService) {
        this.userRepo = userRepo;
        this.universityRepo = universityRepo;
        this.jwtService = jwtService;
        this.config = config;
        this.emailService = emailService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto) {
        const university = await this.universityRepo.findOne({
            where: { id: dto.universityId, isActive: true },
        });
        if (!university)
            throw new common_1.NotFoundException('University not found');
        const emailDomain = dto.email.split('@')[1].toLowerCase();
        if (emailDomain !== university.emailDomain.toLowerCase()) {
            throw new common_1.BadRequestException(`Please use your ${university.emailDomain} university email`);
        }
        const existingEmail = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
        if (existingEmail)
            throw new common_1.ConflictException('Email already registered');
        const existingHandle = await this.userRepo.findOne({ where: { handle: dto.handle } });
        if (existingHandle)
            throw new common_1.ConflictException('Handle already taken');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const verificationToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const user = this.userRepo.create({
            email: dto.email.toLowerCase(),
            passwordHash,
            handle: dto.handle,
            universityId: dto.universityId,
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: verificationExpiry,
            status: user_entity_1.UserStatus.PENDING_VERIFICATION,
        });
        await this.userRepo.save(user);
        this.emailService.sendVerificationEmail(user.email, user.handle, verificationToken)
            .catch((err) => this.logger.error('Failed to send verification email', err));
        return { message: 'Registration successful. Check your university email to verify your account.' };
    }
    async verifyEmail(dto) {
        const user = await this.userRepo.findOne({
            where: { emailVerificationToken: dto.token },
            select: ['id', 'emailVerificationToken', 'emailVerificationExpiry', 'status'],
        });
        if (!user)
            throw new common_1.BadRequestException('Invalid verification token');
        if (user.emailVerificationExpiry < new Date()) {
            throw new common_1.BadRequestException('Verification token expired. Please request a new one.');
        }
        await this.userRepo.update(user.id, {
            isEmailVerified: true,
            status: user_entity_1.UserStatus.ACTIVE,
            emailVerificationToken: null,
            emailVerificationExpiry: null,
        });
        return { message: 'Email verified successfully. Welcome to Circulum!' };
    }
    async login(dto) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email.toLowerCase() },
            select: ['id', 'email', 'passwordHash', 'handle', 'role', 'status', 'universityId', 'isEmailVerified', 'suspendedUntil'],
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatch)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.isEmailVerified) {
            throw new common_1.UnauthorizedException('Please verify your email before logging in');
        }
        if (user.status === user_entity_1.UserStatus.BANNED) {
            throw new common_1.UnauthorizedException('Your account has been permanently banned');
        }
        if (user.status === user_entity_1.UserStatus.SUSPENDED && user.suspendedUntil > new Date()) {
            throw new common_1.UnauthorizedException(`Your account is suspended until ${user.suspendedUntil.toISOString()}`);
        }
        const tokens = await this.generateTokens(user);
        await this.userRepo.update(user.id, { lastSeenAt: new Date() });
        return tokens;
    }
    async refresh(dto) {
        try {
            const payload = this.jwtService.verify(dto.refreshToken, {
                secret: this.config.get('jwt.refreshSecret'),
            });
            const user = await this.userRepo.findOne({
                where: { id: payload.sub },
                select: ['id', 'handle', 'role', 'universityId', 'refreshTokenHash', 'status'],
            });
            if (!user || !user.refreshTokenHash)
                throw new Error('Invalid token');
            const tokenMatch = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
            if (!tokenMatch)
                throw new Error('Token mismatch');
            return this.generateTokens(user);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async logout(userId) {
        await this.userRepo.update(userId, { refreshTokenHash: null });
        return { message: 'Logged out successfully' };
    }
    async forgotPassword(dto) {
        const user = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
        if (!user)
            return { message: 'If that email exists, a reset link has been sent.' };
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);
        await this.userRepo.update(user.id, {
            passwordResetToken: resetToken,
            passwordResetExpiry: resetExpiry,
        });
        this.emailService.sendPasswordResetEmail(user.email, resetToken)
            .catch((err) => this.logger.error('Failed to send password reset email', err));
        return { message: 'If that email exists, a reset link has been sent.' };
    }
    async resetPassword(dto) {
        const user = await this.userRepo.findOne({
            where: { passwordResetToken: dto.token },
            select: ['id', 'passwordResetToken', 'passwordResetExpiry'],
        });
        if (!user)
            throw new common_1.BadRequestException('Invalid reset token');
        if (user.passwordResetExpiry < new Date()) {
            throw new common_1.BadRequestException('Reset token expired. Please request a new one.');
        }
        const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.userRepo.update(user.id, {
            passwordHash: newPasswordHash,
            passwordResetToken: null,
            passwordResetExpiry: null,
            refreshTokenHash: null,
        });
        return { message: 'Password reset successfully. Please log in.' };
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            handle: user.handle,
            role: user.role,
            universityId: user.universityId,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.config.get('jwt.accessSecret'),
                expiresIn: this.config.get('jwt.accessExpiresIn'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.config.get('jwt.refreshSecret'),
                expiresIn: this.config.get('jwt.refreshExpiresIn'),
            }),
        ]);
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await this.userRepo.update(user.id, { refreshTokenHash });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(university_entity_1.University)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map