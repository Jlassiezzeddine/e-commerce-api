import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../../common/exceptions/base.exception';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';

export class UserNotFoundException extends BaseException {
  constructor(identifier: string, type: 'id' | 'email' = 'id') {
    super(`User with ${type} '${identifier}' not found`, HttpStatus.NOT_FOUND, ErrorCode.USER_001, {
      [type]: identifier,
    });
  }
}

export class UserConflictException extends BaseException {
  constructor(field: string, value: string) {
    super(`User with ${field} '${value}' already exists`, HttpStatus.CONFLICT, ErrorCode.USER_002, {
      field,
      value,
    });
  }
}

export class UserOperationException extends BaseException {
  constructor(operation: string, context?: Record<string, unknown>) {
    super(`Failed to ${operation} user`, HttpStatus.BAD_REQUEST, ErrorCode.USER_003, {
      operation,
      ...context,
    });
  }
}
