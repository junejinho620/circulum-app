import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('email.host'),
      port: config.get<number>('email.port'),
      secure: config.get<number>('email.port') === 465,
      auth: {
        user: config.get<string>('email.user'),
        pass: config.get<string>('email.pass'),
      },
    });
  }

  async sendVerificationEmail(to: string, handle: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('app.frontendUrl');
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    const fromName = this.config.get<string>('email.fromName');
    const from = this.config.get<string>('email.from');

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

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const fromName = this.config.get<string>('email.fromName');
    const from = this.config.get<string>('email.from');

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

  async sendModerationEmail(to: string, handle: string, action: string, reason: string): Promise<void> {
    const fromName = this.config.get<string>('email.fromName');
    const from = this.config.get<string>('email.from');

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
}
