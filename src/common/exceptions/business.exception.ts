import { HttpStatus } from '@nestjs/common';
import { BaseException, type ExceptionContext } from './base.exception';
import type { ErrorCode } from './error-codes.enum';

/**
 * Business logic exception
 * Used for domain-specific business rule violations
 */
export class BusinessException extends BaseException {
  constructor(
    message: string,
    code?: ErrorCode,
    context?: ExceptionContext,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, statusCode, code, context);
  }
}
