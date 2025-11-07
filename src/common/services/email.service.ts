import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface IEmailService {
  sendAccountVerificationEmail(email: string, token: string, name: string): Promise<boolean>;
  sendPasswordResetEmail(
    email: string,
    otp: string,
    resetToken: string,
    name: string,
  ): Promise<boolean>;
  sendPasswordResetSuccessEmail(email: string, name: string): Promise<boolean>;
}

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.resendApiKey');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Email sending will be disabled.');
    }
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>('email.fromEmail') || 'noreply@yourdomain.com';
    this.fromName = this.configService.get<string>('email.fromName') || 'E-Commerce API';
    this.frontendUrl =
      this.configService.get<string>('email.frontendUrl') || 'http://localhost:3000';
  }

  async sendAccountVerificationEmail(email: string, token: string, name: string): Promise<boolean> {
    try {
      const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h1 style="color: #333;">Email Verification</h1>
            <p>Hello ${name},</p>
            <p>Thank you for registering with us! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">This link will expire in 1 hour.</p>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't create an account, please ignore this email.</p>
          </div>
        </body>
        </html>
      `;

      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send verification email to ${email}:`, result.error);
        return false;
      }

      this.logger.log(`Verification email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending verification email to ${email}:`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    otp: string,
    resetToken: string,
    name: string,
  ): Promise<boolean> {
    try {
      const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h1 style="color: #333;">Password Reset Request</h1>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. Use the OTP code below or click the reset link:</p>
            <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h2 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h2>
              <p style="margin-top: 10px; font-size: 14px; color: #666;">This OTP is valid for 10 minutes</p>
            </div>
            <p>Or click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">This link will expire in 1 hour.</p>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request a password reset, please ignore this email.</p>
          </div>
        </body>
        </html>
      `;

      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Password Reset Request',
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send password reset email to ${email}:`, result.error);
        return false;
      }

      this.logger.log(`Password reset email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending password reset email to ${email}:`, error);
      return false;
    }
  }

  async sendPasswordResetSuccessEmail(email: string, name: string): Promise<boolean> {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h1 style="color: #28a745;">Password Reset Successful</h1>
            <p>Hello ${name},</p>
            <p>Your password has been successfully reset. You can now log in with your new password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.frontendUrl}/login" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login Now</a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't reset your password, please contact our support team immediately.</p>
          </div>
        </body>
        </html>
      `;

      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Password Reset Successful',
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send password reset success email to ${email}:`, result.error);
        return false;
      }

      this.logger.log(`Password reset success email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending password reset success email to ${email}:`, error);
      return false;
    }
  }
}
