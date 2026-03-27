import {
  Injectable, BadRequestException, UnauthorizedException,
  ConflictException, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { User, UserStatus } from '../../database/entities/user.entity';
import { University } from '../../database/entities/university.entity';
import {
  RegisterDto, LoginDto, RefreshTokenDto,
  VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto,
  SendVerificationCodeDto, VerifyCodeDto,
} from './dto/register.dto';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(University) private universityRepo: Repository<University>,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  // ─── In-memory verification code store (use Redis in production) ────
  private verificationCodes = new Map<string, { code: string; expiresAt: number; universityId: string }>();

  /**
   * Step 1: Validate email domain against all universities and send a 6-digit code.
   */
  async sendVerificationCode(dto: SendVerificationCodeDto) {
    const email = dto.email.toLowerCase().trim();
    const domain = email.split('@')[1];
    if (!domain) throw new BadRequestException('Invalid email');

    // Check if email domain matches any active university
    const university = await this.universityRepo.findOne({
      where: { emailDomain: domain, isActive: true },
    });
    if (!university) {
      throw new BadRequestException(
        'This email domain is not associated with any supported university. Please use your official university email.',
      );
    }

    // Check if email is already registered
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('This email is already registered. Try signing in.');

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.verificationCodes.set(email, { code, expiresAt, universityId: university.id });

    // Send code via email
    this.emailService.sendVerificationCode(email, code)
      .catch((err) => this.logger.error('Failed to send verification code', err));

    return {
      message: 'Verification code sent to your email',
      universityId: university.id,
      universityName: university.name,
    };
  }

  /**
   * Step 2: Verify the 6-digit code.
   */
  async verifyCode(dto: VerifyCodeDto) {
    const email = dto.email.toLowerCase().trim();
    const stored = this.verificationCodes.get(email);

    if (!stored) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    if (Date.now() > stored.expiresAt) {
      this.verificationCodes.delete(email);
      throw new BadRequestException('Verification code expired. Please request a new one.');
    }

    if (stored.code !== dto.code.trim()) {
      throw new BadRequestException('Incorrect verification code');
    }

    // Mark as verified (keep in map so register can check)
    this.verificationCodes.set(email, { ...stored, code: '__VERIFIED__' });

    return {
      message: 'Email verified successfully',
      universityId: stored.universityId,
    };
  }

  async register(dto: RegisterDto) {
    const university = await this.universityRepo.findOne({
      where: { id: dto.universityId, isActive: true },
    });
    if (!university) throw new NotFoundException('University not found');

    // Validate email domain matches university
    const emailDomain = dto.email.split('@')[1].toLowerCase();
    if (emailDomain !== university.emailDomain.toLowerCase()) {
      throw new BadRequestException(
        `Please use your ${university.emailDomain} university email`,
      );
    }

    // Check uniqueness
    const existingEmail = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingHandle = await this.userRepo.findOne({ where: { handle: dto.handle } });
    if (existingHandle) throw new ConflictException('Handle already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      handle: dto.handle,
      universityId: dto.universityId,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
      status: UserStatus.PENDING_VERIFICATION,
    });

    await this.userRepo.save(user);

    // Send verification email (fire and forget)
    this.emailService.sendVerificationEmail(user.email, user.handle, verificationToken)
      .catch((err) => this.logger.error('Failed to send verification email', err));

    return { message: 'Registration successful. Check your university email to verify your account.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userRepo.findOne({
      where: { emailVerificationToken: dto.token },
      select: ['id', 'emailVerificationToken', 'emailVerificationExpiry', 'status'],
    });

    if (!user) throw new BadRequestException('Invalid verification token');
    if (user.emailVerificationExpiry < new Date()) {
      throw new BadRequestException('Verification token expired. Please request a new one.');
    }

    await this.userRepo.update(user.id, {
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    });

    return { message: 'Email verified successfully. Welcome to Circulum!' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
      select: ['id', 'email', 'passwordHash', 'handle', 'role', 'status', 'universityId', 'isEmailVerified', 'suspendedUntil'],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Your account has been permanently banned');
    }

    if (user.status === UserStatus.SUSPENDED && user.suspendedUntil > new Date()) {
      throw new UnauthorizedException(
        `Your account is suspended until ${user.suspendedUntil.toISOString()}`,
      );
    }

    const tokens = await this.generateTokens(user);

    // Update lastSeen
    await this.userRepo.update(user.id, { lastSeenAt: new Date() });

    return tokens;
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
        select: ['id', 'handle', 'role', 'universityId', 'refreshTokenHash', 'status'],
      });

      if (!user || !user.refreshTokenHash) throw new Error('Invalid token');

      const tokenMatch = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
      if (!tokenMatch) throw new Error('Token mismatch');

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refreshTokenHash: null });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const resetToken = randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.userRepo.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    });

    this.emailService.sendPasswordResetEmail(user.email, resetToken)
      .catch((err) => this.logger.error('Failed to send password reset email', err));

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepo.findOne({
      where: { passwordResetToken: dto.token },
      select: ['id', 'passwordResetToken', 'passwordResetExpiry'],
    });

    if (!user) throw new BadRequestException('Invalid reset token');
    if (user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Reset token expired. Please request a new one.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.update(user.id, {
      passwordHash: newPasswordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshTokenHash: null, // Invalidate all sessions
    });

    return { message: 'Password reset successfully. Please log in.' };
  }

  private async generateTokens(user: Pick<User, 'id' | 'handle' | 'role' | 'universityId'>) {
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

    // Store hashed refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(user.id, { refreshTokenHash });

    return { accessToken, refreshToken };
  }
}
