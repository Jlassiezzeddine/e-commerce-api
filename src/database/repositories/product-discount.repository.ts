import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { ProductDiscount } from '../schemas/product-discount.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class ProductDiscountRepository extends BaseRepository<ProductDiscount> {
  constructor(
    @InjectModel('ProductDiscount') readonly productDiscountModel: Model<ProductDiscount>,
  ) {
    super(productDiscountModel);
  }

  async findByProduct(productId: string, session?: ClientSession): Promise<ProductDiscount[]> {
    return this.findAll({ productId, isActive: true }, session);
  }

  async findByProductItem(
    productItemId: string,
    session?: ClientSession,
  ): Promise<ProductDiscount[]> {
    return this.findAll({ productItemId, isActive: true }, session);
  }

  async findByDiscount(discountId: string, session?: ClientSession): Promise<ProductDiscount[]> {
    return this.findAll({ discountId, isActive: true }, session);
  }

  async linkProductToDiscount(
    productId: string,
    discountId: string,
    productItemId?: string,
    session?: ClientSession,
  ): Promise<ProductDiscount> {
    const data: Partial<ProductDiscount> = {
      productId: productId as never,
      discountId: discountId as never,
      isActive: true,
    };

    if (productItemId) {
      data.productItemId = productItemId as never;
    }

    return this.create(data, session);
  }

  async unlinkProductFromDiscount(
    productId: string,
    discountId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const link = await this.findOne({ productId, discountId }, session);
    if (!link) {
      return false;
    }
    return this.delete(link.id, session);
  }
}
