import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { BaseDto } from '../../../common/dto/base.dto';
import { DiscountType } from '../../../database/schemas/discount.schema';

@Exclude()
export class DiscountResponseDto extends BaseDto {
  @ApiPropertyOptional({ example: 'SUMMER2024' })
  @Expose()
  code?: string;

  @ApiProperty({ example: 'Summer Sale 2024' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ example: '20% off on all products' })
  @Expose()
  description?: string;

  @ApiProperty({ enum: DiscountType })
  @Expose()
  discountType: DiscountType;

  @ApiProperty({ example: 20 })
  @Expose()
  value: number;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
  @Expose()
  startDate: Date;

  @ApiProperty({ example: '2024-08-31T23:59:59.999Z' })
  @Expose()
  endDate: Date;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ example: 100 })
  @Expose()
  minimumOrderValue?: number;

  @ApiPropertyOptional({ example: 2 })
  @Expose()
  minimumQuantity?: number;

  @ApiPropertyOptional({ example: 1000 })
  @Expose()
  maxUsageCount?: number;

  @ApiProperty({ example: 150 })
  @Expose()
  usageCount: number;
}
