import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'token_blacklist' })
export class TokenBlacklist extends Document {
  @Prop({ type: String, required: true, unique: true, index: true })
  token: string;

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: Date, required: true, index: true })
  expiresAt: Date;

  @Prop({ type: String, maxlength: 255 })
  reason?: string; // 'logout', 'refresh', etc.

  @Prop({ type: Date })
  blacklistedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const TokenBlacklistSchema = SchemaFactory.createForClass(TokenBlacklist);

// Indexes
TokenBlacklistSchema.index({ token: 1 }, { unique: true });
TokenBlacklistSchema.index({ userId: 1 });
TokenBlacklistSchema.index({ expiresAt: 1 });
