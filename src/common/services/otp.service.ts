import { Injectable, Logger } from '@nestjs/common';

interface OTPEntry {
  otp: string;
  email: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OTPService {
  private readonly logger = new Logger(OTPService.name);
  private readonly otpStore = new Map<string, OTPEntry>();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;

  generateOTP(email: string): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    this.otpStore.set(email.toLowerCase(), {
      otp,
      email: email.toLowerCase(),
      expiresAt,
      attempts: 0,
    });

    // Cleanup expired OTPs
    this.cleanupExpiredOTPs();

    this.logger.log(`Generated OTP for ${email}, expires at ${expiresAt}`);
    return otp;
  }

  validateOTP(email: string, otp: string): { isValid: boolean; message: string } {
    const entry = this.otpStore.get(email.toLowerCase());

    if (!entry) {
      return {
        isValid: false,
        message: 'OTP not found or has expired. Please request a new one.',
      };
    }

    if (entry.expiresAt < new Date()) {
      this.otpStore.delete(email.toLowerCase());
      return {
        isValid: false,
        message: 'OTP has expired. Please request a new one.',
      };
    }

    if (entry.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(email.toLowerCase());
      return {
        isValid: false,
        message: 'Maximum attempts exceeded. Please request a new OTP.',
      };
    }

    entry.attempts += 1;

    if (entry.otp !== otp) {
      return {
        isValid: false,
        message: `Invalid OTP. ${this.MAX_ATTEMPTS - entry.attempts + 1} attempts remaining.`,
      };
    }

    // OTP is valid, but don't delete it yet (will be deleted after password reset)
    return {
      isValid: true,
      message: 'OTP verified successfully.',
    };
  }

  invalidateOTP(email: string): void {
    this.otpStore.delete(email.toLowerCase());
    this.logger.log(`Invalidated OTP for ${email}`);
  }

  private cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [email, entry] of this.otpStore.entries()) {
      if (entry.expiresAt < now) {
        this.otpStore.delete(email);
      }
    }
  }
}
