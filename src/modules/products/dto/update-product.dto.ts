import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Premium Wireless Headphones' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'premium-wireless-headphones' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'High-quality wireless headphones with noise cancellation' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 299.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: ['https://example.com/image1.jpg'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: { brand: 'Sony', warranty: '2 years' } })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
