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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let EmailService = EmailService_1 = class EmailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.transporter = nodemailer.createTransport({
            host: config.get('email.host'),
            port: config.get('email.port'),
            secure: config.get('email.port') === 465,
            auth: {
                user: config.get('email.user'),
                pass: config.get('email.pass'),
            },
        });
    }
    async sendVerificationEmail(to, handle, token) {
        const frontendUrl = this.config.get('app.frontendUrl');
        const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
        const fromName = this.config.get('email.fromName');
        const from = this.config.get('email.from');
        await this.transporter.sendMail({
            from: `"${fromName}" <${from}>`,
            to,
            subject: 'Verify your Circulum account',
            html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; color: #111;">Welcome to Circulum, ${handle} 👋</h1>
          <p style="color: #555; line-height: 1.6;">
            You're one step away from joining your campus community.
            Click the button below to verify your university email.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Verify My Email
          </a>
          <p style="color: #888; font-size: 13px;">
            This link expires in 24 hours. If you didn't register, ignore this email.
          </p>
        </div>
      `,
        });
        this.logger.log(`Verification email sent to ${to}`);
    }
    async sendPasswordResetEmail(to, token) {
        const frontendUrl = this.config.get('app.frontendUrl');
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
        const fromName = this.config.get('email.fromName');
        const from = this.config.get('email.from');
        await this.transporter.sendMail({
            from: `"${fromName}" <${from}>`,
            to,
            subject: 'Reset your Circulum password',
            html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; color: #111;">Password Reset</h1>
          <p style="color: #555; line-height: 1.6;">
            We received a request to reset your password. Click the button below to proceed.
          </p>
          <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
          <p style="color: #888; font-size: 13px;">
            This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
      `,
        });
    }
    async sendModerationEmail(to, handle, action, reason) {
        const fromName = this.config.get('email.fromName');
        const from = this.config.get('email.from');
        await this.transporter.sendMail({
            from: `"${fromName}" <${from}>`,
            to,
            subject: `Circulum: Account Notice - ${action}`,
            html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; color: #111;">Account Notice</h1>
          <p style="color: #555;">Hi ${handle},</p>
          <p style="color: #555; line-height: 1.6;">
            Your account has received a <strong>${action}</strong> due to a violation of Circulum's community guidelines.
          </p>
          <p style="color: #555;"><strong>Reason:</strong> ${reason}</p>
          <p style="color: #888; font-size: 13px;">
            If you believe this was a mistake, please contact support.
          </p>
        </div>
      `,
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map