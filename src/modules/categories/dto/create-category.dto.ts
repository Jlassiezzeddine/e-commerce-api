import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'electronics' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  slug: string;

  @ApiPropertyOptional({ example: 'Electronic devices and accessories' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

