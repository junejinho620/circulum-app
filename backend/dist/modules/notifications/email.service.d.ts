import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private config;
    private readonly logger;
    private transporter;
    constructor(config: ConfigService);
    sendVerificationEmail(to: string, handle: string, token: string): Promise<void>;
    sendPasswordResetEmail(to: string, token: string): Promise<void>;
    sendModerationEmail(to: string, handle: string, action: string, reason: string): Promise<void>;
}
