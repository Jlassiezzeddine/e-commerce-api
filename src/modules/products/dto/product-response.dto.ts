import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { BaseDto } from '../../../common/dto/base.dto';

@Exclude()
export class ProductResponseDto extends BaseDto {
  @ApiProperty({ example: 'Premium Wireless Headphones' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'premium-wireless-headphones' })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'High-quality wireless headphones' })
  @Expose()
  description: string;

  @ApiProperty({ example: 299.99 })
  @Expose()
  basePrice: number;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @Expose()
  categoryId: string;

  @ApiProperty({ example: 'WH-1000XM4' })
  @Expose()
  sku: string;

  @ApiPropertyOptional({ example: ['https://example.com/image1.jpg'], type: [String] })
  @Expose()
  images?: string[];

  @ApiPropertyOptional()
  @Expose()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 249.99 })
  @Expose()
  finalPrice?: number;

  @ApiPropertyOptional({ type: [Object] })
  @Expose()
  appliedDiscounts?: Array<{
    id: string;
    name: string;
    discountType: string;
    value: number;
  }>;
}
