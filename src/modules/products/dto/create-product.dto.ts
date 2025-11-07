import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Wireless Headphones' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'premium-wireless-headphones' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'High-quality wireless headphones with noise cancellation' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'WH-1000XM4' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({ example: ['https://example.com/image1.jpg'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: { brand: 'Sony', warranty: '2 years' } })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
