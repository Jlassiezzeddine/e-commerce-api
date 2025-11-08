import { HttpStatus } from '@nestjs/common';
import { BaseException, type ExceptionContext } from './base.exception';
import type { ErrorCode } from './error-codes.enum';

/**
 * Database exception
 * Used for database-related errors (connection, query failures, etc.)
 */
export class DatabaseException extends BaseException {
  constructor(
    message: string,
    code?: ErrorCode,
    context?: ExceptionContext,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, statusCode, code, context);
  }
}
