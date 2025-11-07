import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscountRepository } from '../../database/repositories/discount.repository';
import { ProductDiscountRepository } from '../../database/repositories/product-discount.repository';
import { DiscountSchema } from '../../database/schemas/discount.schema';
import { ProductDiscountSchema } from '../../database/schemas/product-discount.schema';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Discount', schema: DiscountSchema },
      { name: 'ProductDiscount', schema: ProductDiscountSchema },
    ]),
  ],
  controllers: [DiscountsController],
  providers: [DiscountRepository, ProductDiscountRepository, DiscountsService],
  exports: [DiscountsService, DiscountRepository, ProductDiscountRepository],
})
export class DiscountsModule {}
