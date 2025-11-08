import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../../common/exceptions/base.exception';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';

export class DiscountNotFoundException extends BaseException {
  constructor(discountId?: string) {
    super(
      discountId ? `Discount with ID ${discountId} not found` : 'Discount not found',
      HttpStatus.NOT_FOUND,
      ErrorCode.DISCOUNT_001,
      discountId ? { discountId } : undefined,
    );
  }
}

export class DiscountValidationException extends BaseException {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.DISCOUNT_002, context);
  }
}

export class DiscountExpiredException extends BaseException {
  constructor(discountId?: string) {
    super(
      discountId ? `Discount with ID ${discountId} has expired` : 'Discount has expired',
      HttpStatus.BAD_REQUEST,
      ErrorCode.DISCOUNT_003,
      discountId ? { discountId } : undefined,
    );
  }
}

export class DiscountOperationException extends BaseException {
  constructor(operation: string, context?: Record<string, unknown>) {
    super(`Failed to ${operation} discount`, HttpStatus.BAD_REQUEST, ErrorCode.DISCOUNT_004, {
      operation,
      ...context,
    });
  }
}
