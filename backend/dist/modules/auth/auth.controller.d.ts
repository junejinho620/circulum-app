import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto/register.dto';
import { User } from '../../database/entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    logout(user: User): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    me(user: User): {
        id: string;
        handle: string;
        role: import("../../database/entities/user.entity").UserRole;
        status: import("../../database/entities/user.entity").UserStatus;
        universityId: string;
        university: import("../../database/entities/university.entity").University;
        majorId: string;
        postCount: number;
        commentCount: number;
        totalKarma: number;
        createdAt: Date;
    };
}
