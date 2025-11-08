import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../../common/exceptions/base.exception';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';

export class ProductNotFoundException extends BaseException {
  constructor(productId?: string) {
    super(
      productId ? `Product with ID ${productId} not found` : 'Product not found',
      HttpStatus.NOT_FOUND,
      ErrorCode.PRODUCT_001,
      productId ? { productId } : undefined,
    );
  }
}

export class ProductConflictException extends BaseException {
  constructor(field: string, value: string) {
    super(
      `Product with ${field} '${value}' already exists`,
      HttpStatus.CONFLICT,
      ErrorCode.PRODUCT_002,
      { field, value },
    );
  }
}

export class ProductValidationException extends BaseException {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_003, context);
  }
}

export class ProductOperationException extends BaseException {
  constructor(operation: string, context?: Record<string, unknown>) {
    super(`Failed to ${operation} product`, HttpStatus.BAD_REQUEST, ErrorCode.PRODUCT_004, {
      operation,
      ...context,
    });
  }
}
