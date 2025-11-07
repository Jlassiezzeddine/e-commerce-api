import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model } from 'mongoose';
import type { User } from '../schemas/user.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectModel('User') readonly userModel: Model<User>) {
    super(userModel);
  }

  async findByEmail(email: string, session?: ClientSession): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() }, session);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
    session?: ClientSession,
  ): Promise<User | null> {
    return this.update(userId, { refreshToken }, session);
  }

  async updateLastLogin(userId: string, session?: ClientSession): Promise<User | null> {
    return this.update(userId, { lastLoginAt: new Date() }, session);
  }
}
