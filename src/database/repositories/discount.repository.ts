import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Discount } from '../schemas/discount.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class DiscountRepository extends BaseRepository<Discount> {
  constructor(@InjectModel('Discount') readonly discountModel: Model<Discount>) {
    super(discountModel);
  }

  async findByCode(code: string, session?: ClientSession): Promise<Discount | null> {
    return this.findOne({ code: code.toUpperCase() }, session);
  }

  async findActiveDiscounts(session?: ClientSession): Promise<Discount[]> {
    const now = new Date();
    return this.findAll(
      {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      session,
    );
  }

  async incrementUsageCount(discountId: string, session?: ClientSession): Promise<Discount | null> {
    return this.update(discountId, { $inc: { usageCount: 1 } }, session);
  }

  async isDiscountValid(discountId: string, session?: ClientSession): Promise<boolean> {
    const discount = await this.findById(discountId, session);
    if (!discount || !discount.isActive) {
      return false;
    }

    const now = new Date();
    if (discount.startDate > now || discount.endDate < now) {
      return false;
    }

    if (discount.maxUsageCount && discount.usageCount >= discount.maxUsageCount) {
      return false;
    }

    return true;
  }
}
