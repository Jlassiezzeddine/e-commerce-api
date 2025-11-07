import { Injectable } from '@nestjs/common';
import type { PasswordResetRepository } from '../../../database/repositories/password-reset.repository';
import type { TokenBlacklistRepository } from '../../../database/repositories/token-blacklist.repository';
import type { PasswordReset } from '../../../database/schemas/password-reset.schema';
import type { IAuthRepository } from './auth.repository.interface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    private readonly tokenBlacklistRepo: TokenBlacklistRepository,
    private readonly passwordResetRepo: PasswordResetRepository,
  ) {}

  async blacklistToken(
    token: string,
    userId: string,
    expiresAt: Date,
    reason = 'logout',
  ): Promise<void> {
    await this.tokenBlacklistRepo.create({
      token,
      userId,
      expiresAt,
      reason,
      blacklistedAt: new Date(),
    });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const entry = await this.tokenBlacklistRepo.findByToken(token);
    return !!entry;
  }

  async createPasswordReset(
    userId: string,
    email: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PasswordReset> {
    return this.passwordResetRepo.create({
      userId,
      email,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    });
  }

  async findPasswordResetByToken(token: string): Promise<PasswordReset | null> {
    return this.passwordResetRepo.findByToken(token);
  }

  async findPasswordResetByEmail(email: string): Promise<PasswordReset | null> {
    return this.passwordResetRepo.findByEmail(email);
  }

  async markPasswordResetAsUsed(token: string, usedAt?: Date): Promise<void> {
    await this.passwordResetRepo.markAsUsed(token, usedAt);
  }

  async invalidatePasswordReset(token: string): Promise<void> {
    await this.passwordResetRepo.invalidate(token);
  }

  async cleanupExpiredPasswordResets(): Promise<number> {
    return this.passwordResetRepo.cleanupExpired();
  }
}
