import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { DiscountType } from '../../../database/schemas/discount.schema';

export class CreateDiscountDto {
  @ApiPropertyOptional({ example: 'SUMMER2024' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Summer Sale 2024' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({ example: '20% off on all products' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType: DiscountType;

  @ApiProperty({ example: 20, description: 'Percentage (0-100) or fixed amount' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2024-08-31T23:59:59.999Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ example: 100, description: 'Minimum order value' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumOrderValue?: number;

  @ApiPropertyOptional({ example: 2, description: 'Minimum quantity' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minimumQuantity?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Maximum usage count' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUsageCount?: number;
}
