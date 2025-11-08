import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PasswordReset } from '../schemas/password-reset.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class PasswordResetRepository extends BaseRepository<PasswordReset> {
  constructor(@InjectModel('PasswordReset') readonly passwordResetModel: Model<PasswordReset>) {
    super(passwordResetModel);
  }

  async findByToken(token: string): Promise<PasswordReset | null> {
    return this.findOne({ token });
  }

  async findByEmail(email: string): Promise<PasswordReset | null> {
    const result = await this.model
      .findOne({ email: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return result as unknown as PasswordReset | null;
  }

  async markAsUsed(token: string, usedAt: Date = new Date()): Promise<boolean> {
    const result = await this.model.updateOne({ token }, { $set: { isUsed: true, usedAt } });
    return result.modifiedCount > 0;
  }

  async invalidate(token: string): Promise<boolean> {
    const result = await this.model.updateOne({ token }, { $set: { invalidatedAt: new Date() } });
    return result.modifiedCount > 0;
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.model.deleteMany({
      $or: [{ expiresAt: { $lt: new Date() } }, { isUsed: true }, { invalidatedAt: { $ne: null } }],
    });
    return result.deletedCount || 0;
  }
}
