import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { ProductItem } from '../schemas/product-item.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductItemRepository extends BaseRepository<ProductItem> {
  constructor(@InjectModel('ProductItem') readonly productItemModel: Model<ProductItem>) {
    super(productItemModel);
  }

  async findBySku(sku: string, session?: ClientSession): Promise<ProductItem | null> {
    return this.findOne({ sku: sku.toUpperCase() }, session);
  }

  async findByProduct(productId: string, session?: ClientSession): Promise<ProductItem[]> {
    return this.findAll({ productId, isActive: true }, session);
  }

  async updateStock(
    itemId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<ProductItem | null> {
    return this.update(itemId, { $inc: { quantityInStock: quantity } }, session);
  }

  async findInStock(productId: string, session?: ClientSession): Promise<ProductItem[]> {
    return this.findAll({ productId, quantityInStock: { $gt: 0 }, isActive: true }, session);
  }
}
