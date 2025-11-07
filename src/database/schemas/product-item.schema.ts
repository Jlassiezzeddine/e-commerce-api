import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'product_items' })
export class ProductItem extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  sku: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0, default: 0 })
  quantityInStock: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  attributes: Record<string, string>; // e.g., { size: 'L', color: 'Red' }

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ProductItemSchema = SchemaFactory.createForClass(ProductItem);

// Indexes
ProductItemSchema.index({ productId: 1 });
ProductItemSchema.index({ sku: 1 });
ProductItemSchema.index({ isActive: 1 });
ProductItemSchema.index({ price: 1 });
ProductItemSchema.index({ quantityInStock: 1 });
