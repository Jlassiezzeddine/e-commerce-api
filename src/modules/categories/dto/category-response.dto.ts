import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { BaseDto } from '../../../common/dto/base.dto';

@Exclude()
export class CategoryResponseDto extends BaseDto {
  @ApiProperty({ example: 'Electronics' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'electronics' })
  @Expose()
  slug: string;

  @ApiPropertyOptional({ example: 'Electronic devices and accessories' })
  @Expose()
  description?: string;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;
}

