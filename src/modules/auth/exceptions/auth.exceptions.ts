import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../../common/exceptions/base.exception';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';

export class AuthenticationFailedException extends BaseException {
  constructor(message: string = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_001, context);
  }
}

export class InvalidTokenException extends BaseException {
  constructor(message: string = 'Invalid or expired token', context?: Record<string, unknown>) {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_002, context);
  }
}

export class TokenExpiredException extends BaseException {
  constructor(message: string = 'Token has expired', context?: Record<string, unknown>) {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_003, context);
  }
}

export class InsufficientPermissionsException extends BaseException {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.AUTH_004, context);
  }
}

export class UserAlreadyExistsException extends BaseException {
  constructor(field: string, value: string) {
    super(`User with ${field} '${value}' already exists`, HttpStatus.CONFLICT, ErrorCode.AUTH_005, {
      field,
      value,
    });
  }
}

export class InvalidCredentialsException extends BaseException {
  constructor(message: string = 'Invalid email or password', context?: Record<string, unknown>) {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_006, context);
  }
}

export class AccountLockedException extends BaseException {
  constructor(message: string = 'Account is locked', context?: Record<string, unknown>) {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.AUTH_007, context);
  }
}

export class AccountInactiveException extends BaseException {
  constructor(message: string = 'Account is inactive', context?: Record<string, unknown>) {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.AUTH_008, context);
  }
}

export class UserAlreadyVerifiedException extends BaseException {
  constructor(
    message: string = 'User email is already verified',
    context?: Record<string, unknown>,
  ) {
    super(message, HttpStatus.CONFLICT, ErrorCode.AUTH_005, context);
  }
}

export class InvalidVerificationTokenException extends BaseException {
  constructor(
    message: string = 'Invalid or expired verification token',
    context?: Record<string, unknown>,
  ) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.AUTH_002, context);
  }
}
