import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../../common/exceptions/base.exception';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';

export class CategoryNotFoundException extends BaseException {
  constructor(identifier: string, type: 'id' | 'slug' = 'id') {
    super(
      `Category with ${type} '${identifier}' not found`,
      HttpStatus.NOT_FOUND,
      ErrorCode.CATEGORY_001,
      { [type]: identifier },
    );
  }
}

export class CategoryConflictException extends BaseException {
  constructor(field: string, value: string) {
    super(
      `Category with ${field} '${value}' already exists`,
      HttpStatus.CONFLICT,
      ErrorCode.CATEGORY_002,
      { field, value },
    );
  }
}

export class CategoryOperationException extends BaseException {
  constructor(operation: string, context?: Record<string, unknown>) {
    super(`Failed to ${operation} category`, HttpStatus.BAD_REQUEST, ErrorCode.CATEGORY_003, {
      operation,
      ...context,
    });
  }
}
