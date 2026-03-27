export declare class RegisterDto {
    email: string;
    password: string;
    handle: string;
    universityId: string;
}
export declare class VerifyEmailDto {
    token: string;
}
export declare class SendVerificationCodeDto {
    email: string;
}
export declare class VerifyCodeDto {
    email: string;
    code: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
