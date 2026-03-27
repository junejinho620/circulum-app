import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../database/entities/user.entity';
import { University } from '../../database/entities/university.entity';
import { RegisterDto, LoginDto, RefreshTokenDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, SendVerificationCodeDto, VerifyCodeDto } from './dto/register.dto';
import { EmailService } from '../notifications/email.service';
export declare class AuthService {
    private userRepo;
    private universityRepo;
    private jwtService;
    private config;
    private emailService;
    private readonly logger;
    constructor(userRepo: Repository<User>, universityRepo: Repository<University>, jwtService: JwtService, config: ConfigService, emailService: EmailService);
    private verificationCodes;
    sendVerificationCode(dto: SendVerificationCodeDto): Promise<{
        message: string;
        universityId: string;
        universityName: string;
    }>;
    verifyCode(dto: VerifyCodeDto): Promise<{
        message: string;
        universityId: string;
    }>;
    register(dto: RegisterDto): Promise<{
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private generateTokens;
}
