import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthenticationFailedException extends HttpException {
  constructor(message: string = 'Authentication failed') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidTokenException extends HttpException {
  constructor(message: string = 'Invalid or expired token') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends HttpException {
  constructor(message: string = 'Token has expired') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class InsufficientPermissionsException extends HttpException {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class UserAlreadyExistsException extends HttpException {
  constructor(field: string, value: string) {
    super(`User with ${field} '${value}' already exists`, HttpStatus.CONFLICT);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor(message: string = 'Invalid email or password') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class AccountLockedException extends HttpException {
  constructor(message: string = 'Account is locked') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class AccountInactiveException extends HttpException {
  constructor(message: string = 'Account is inactive') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class UserAlreadyVerifiedException extends HttpException {
  constructor(message: string = 'User email is already verified') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class InvalidVerificationTokenException extends HttpException {
  constructor(message: string = 'Invalid or expired verification token') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
