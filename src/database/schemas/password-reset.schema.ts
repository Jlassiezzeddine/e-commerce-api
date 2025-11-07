import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'password_resets' })
export class PasswordReset extends Document {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true, maxlength: 255, index: true })
  email: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  token: string;

  @Prop({ type: Date, required: true, index: true })
  expiresAt: Date;

  @Prop({ type: Boolean, default: false })
  isUsed: boolean;

  @Prop({ type: Date })
  usedAt?: Date;

  @Prop({ type: String, maxlength: 45 })
  ipAddress?: string;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: Date })
  invalidatedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);

// Indexes
PasswordResetSchema.index({ token: 1 }, { unique: true });
PasswordResetSchema.index({ email: 1 });
PasswordResetSchema.index({ expiresAt: 1 });
