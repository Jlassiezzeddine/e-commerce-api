import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

@Schema({ timestamps: true, collection: 'discounts' })
export class Discount extends Document {
  @Prop({ unique: true, uppercase: true, trim: true, sparse: true })
  code?: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: String, enum: DiscountType, required: true })
  discountType: DiscountType;

  @Prop({ required: true, min: 0 })
  value: number; // Percentage (0-100) or fixed amount

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ min: 0 })
  minimumOrderValue?: number;

  @Prop({ min: 1 })
  minimumQuantity?: number;

  @Prop({ min: 1 })
  maxUsageCount?: number;

  @Prop({ default: 0, min: 0 })
  usageCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);

// Indexes
DiscountSchema.index({ code: 1 });
DiscountSchema.index({ isActive: 1 });
DiscountSchema.index({ startDate: 1, endDate: 1 });
DiscountSchema.index({ discountType: 1 });
