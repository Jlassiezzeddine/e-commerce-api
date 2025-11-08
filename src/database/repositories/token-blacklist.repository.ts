import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenBlacklist } from '../schemas/token-blacklist.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class TokenBlacklistRepository extends BaseRepository<TokenBlacklist> {
  constructor(@InjectModel('TokenBlacklist') readonly tokenBlacklistModel: Model<TokenBlacklist>) {
    super(tokenBlacklistModel);
  }

  async findByToken(token: string): Promise<TokenBlacklist | null> {
    return this.findOne({ token });
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.model.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount || 0;
  }

  async countExpiredTokens(): Promise<number> {
    return this.model.countDocuments({
      expiresAt: { $lt: new Date() },
    });
  }
}
