import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DiscountType } from '../../../database/schemas/discount.schema';

export class UpdateDiscountDto {
  @ApiPropertyOptional({ example: 'SUMMER2024' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Summer Sale 2024' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '20% off on all products' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ example: '2024-06-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-08-31T23:59:59.999Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumOrderValue?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minimumQuantity?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUsageCount?: number;
}
