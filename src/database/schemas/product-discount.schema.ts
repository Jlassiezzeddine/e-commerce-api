import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'product_discounts' })
export class ProductDiscount extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductItem' })
  productItemId?: MongooseSchema.Types.ObjectId; // Optional: specific to a product item

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Discount', required: true })
  discountId: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ProductDiscountSchema = SchemaFactory.createForClass(ProductDiscount);

// Indexes
ProductDiscountSchema.index({ productId: 1, discountId: 1 }, { unique: true });
ProductDiscountSchema.index({ productItemId: 1, discountId: 1 });
ProductDiscountSchema.index({ discountId: 1 });
ProductDiscountSchema.index({ isActive: 1 });
