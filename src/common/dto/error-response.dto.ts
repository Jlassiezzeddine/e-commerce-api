import { ApiProperty } from '@nestjs/swagger';
import { ErrorCode } from '../exceptions/error-codes.enum';

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Standard error response DTO
 * Used for consistent error responses across the API
 */
export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code', example: 400 })
  statusCode: number;

  @ApiProperty({ description: 'Error message or array of messages', example: 'Validation failed' })
  message: string | string[];

  @ApiProperty({ description: 'Error type/category', example: 'Bad Request' })
  error: string;

  @ApiProperty({
    description: 'ISO timestamp of when the error occurred',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path where the error occurred',
    example: '/api/v1/products',
  })
  path: string;

  @ApiProperty({
    description: 'Request ID for error correlation',
    example: 'req-1234567890',
    required: false,
  })
  requestId?: string;

  @ApiProperty({
    description: 'Error code for programmatic handling',
    enum: ErrorCode,
    required: false,
  })
  code?: ErrorCode;

  @ApiProperty({
    description: 'Additional error details (e.g., validation errors)',
    required: false,
    example: [{ field: 'email', message: 'email must be an email' }],
  })
  details?: ValidationErrorDetail[] | Record<string, unknown>;

  @ApiProperty({ description: 'Stack trace (only in development)', required: false })
  stack?: string;
}
