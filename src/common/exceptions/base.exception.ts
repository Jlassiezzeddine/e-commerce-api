import { HttpException, type HttpStatus } from '@nestjs/common';
import type { ErrorCode } from './error-codes.enum';

export interface ExceptionContext {
  [key: string]: unknown;
}

/**
 * Base exception class for all custom exceptions
 * Provides consistent structure with error codes and context
 */
export abstract class BaseException extends HttpException {
  constructor(
    message: string | string[],
    statusCode: HttpStatus,
    public readonly code?: ErrorCode,
    public readonly context?: ExceptionContext,
  ) {
    super(
      {
        message,
        code,
        context,
      },
      statusCode,
    );
  }

  /**
   * Get the error message as a string
   */
  getMessage(): string {
    const response = this.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && response !== null) {
      const responseObj = response as { message?: string | string[] };
      if (Array.isArray(responseObj.message)) {
        return responseObj.message.join(', ');
      }
      return responseObj.message || 'Unknown error';
    }
    return 'Unknown error';
  }

  /**
   * Get the error code
   */
  getCode(): ErrorCode | undefined {
    return this.code;
  }

  /**
   * Get the exception context
   */
  getContext(): ExceptionContext | undefined {
    return this.context;
  }
}
