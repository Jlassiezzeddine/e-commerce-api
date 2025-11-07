import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenBlacklistRepository } from '../../../../database/repositories/token-blacklist.repository';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly tokenBlacklistRepo: TokenBlacklistRepository) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    try {
      const deletedCount = await this.tokenBlacklistRepo.deleteExpiredTokens();

      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} expired tokens from blacklist`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired tokens:', error);
    }
  }

  async cleanupExpiredTokensManually(): Promise<number> {
    try {
      const deletedCount = await this.tokenBlacklistRepo.deleteExpiredTokens();
      this.logger.log(`Manually cleaned up ${deletedCount} expired tokens from blacklist`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Error manually cleaning up expired tokens:', error);
      throw error;
    }
  }

  async getBlacklistStats() {
    try {
      const totalCount = await this.tokenBlacklistRepo.count();
      const expiredCount = await this.tokenBlacklistRepo.countExpiredTokens();

      return {
        totalTokens: totalCount,
        expiredTokens: expiredCount,
        activeTokens: totalCount - expiredCount,
      };
    } catch (error) {
      this.logger.error('Error getting blacklist stats:', error);
      throw error;
    }
  }
}
