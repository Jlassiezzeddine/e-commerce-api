import { PasswordReset } from '@database/schemas/password-reset.schema';

export interface IAuthRepository {
  blacklistToken(token: string, userId: string, expiresAt: Date, reason?: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  createPasswordReset(
    userId: string,
    email: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PasswordReset>;
  findPasswordResetByToken(token: string): Promise<PasswordReset | null>;
  findPasswordResetByEmail(email: string): Promise<PasswordReset | null>;
  markPasswordResetAsUsed(token: string, usedAt?: Date): Promise<void>;
  invalidatePasswordReset(token: string): Promise<void>;
  cleanupExpiredPasswordResets(): Promise<number>;
}
