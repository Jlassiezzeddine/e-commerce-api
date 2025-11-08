import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Electronics' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'electronics' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  slug?: string;

  @ApiPropertyOptional({ example: 'Electronic devices and accessories' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
