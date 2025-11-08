import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { ErrorResponseDto, ValidationErrorDetail } from '../dto/error-response.dto';
import { BaseException } from '../exceptions/base.exception';
import { ErrorCode } from '../exceptions/error-codes.enum';

interface MongooseError extends Error {
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string; kind: string }>;
}

interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * Enhanced global exception filter
 * Handles all exceptions with MongoDB error detection, validation formatting,
 * request ID tracking, and environment-aware error details
 */
@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment = this.configService.get<string>('app.nodeEnv') === 'development';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    // Get or generate request ID
    const headerRequestId = request.headers['x-request-id'];
    const requestId =
      request.requestId ||
      (typeof headerRequestId === 'string'
        ? headerRequestId
        : Array.isArray(headerRequestId)
          ? headerRequestId[0]
          : undefined) ||
      'unknown';

    // Handle different exception types
    let errorResponse: ErrorResponseDto;
    let logLevel: 'error' | 'warn' | 'debug' = 'error';

    if (exception instanceof BaseException) {
      errorResponse = this.handleBaseException(exception, request, requestId);
      logLevel = this.getLogLevel(exception.getStatus());
    } else if (exception instanceof HttpException) {
      errorResponse = this.handleHttpException(exception, request, requestId);
      logLevel = this.getLogLevel(exception.getStatus());
    } else if (this.isMongoError(exception)) {
      errorResponse = this.handleMongoError(exception as MongooseError, request, requestId);
    } else if (exception instanceof Error) {
      errorResponse = this.handleGenericError(exception, request, requestId);
    } else {
      errorResponse = this.handleUnknownError(request, requestId);
    }

    // Log the error with context
    this.logError(errorResponse, request, exception, logLevel);

    // Send response
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * Handle BaseException (custom exceptions)
   */
  private handleBaseException(
    exception: BaseException,
    request: RequestWithId,
    requestId: string,
  ): ErrorResponseDto {
    const response = exception.getResponse();
    let message: string | string[] = exception.getMessage();
    let code: ErrorCode | undefined = exception.getCode();
    let details: ValidationErrorDetail[] | Record<string, unknown> | undefined =
      exception.getContext();

    if (typeof response === 'object' && response !== null) {
      const responseObj = response as {
        message?: string | string[];
        code?: ErrorCode;
        context?: Record<string, unknown>;
      };
      message = responseObj.message || message;
      code = responseObj.code || code;
      details = responseObj.context || details;
    }

    return {
      statusCode: exception.getStatus(),
      message,
      error: HttpStatus[exception.getStatus()] || 'Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      code,
      details,
      stack: this.isDevelopment ? exception.stack : undefined,
    };
  }

  /**
   * Handle standard HttpException
   */
  private handleHttpException(
    exception: HttpException,
    request: RequestWithId,
    requestId: string,
  ): ErrorResponseDto {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[] = 'An error occurred';
    let error = HttpStatus[status] || 'Error';
    let details: ValidationErrorDetail[] | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as {
        message?: string | string[];
        error?: string;
        details?: ValidationErrorDetail[];
      };
      message = responseObj.message || message;
      error = responseObj.error || error;
      details = responseObj.details;
    }

    // Check if this is a validation error (BadRequestException with array message)
    if (status === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
      details = this.formatValidationErrors(message);
      message = 'Validation failed';
    }

    return {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      details,
      stack: this.isDevelopment ? exception.stack : undefined,
    };
  }

  /**
   * Handle MongoDB errors
   */
  private handleMongoError(
    error: MongooseError,
    request: RequestWithId,
    requestId: string,
  ): ErrorResponseDto {
    // Duplicate key error (E11000)
    if (error.code === 11000) {
      const duplicateKey = this.extractDuplicateKey(error);
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `Resource with ${duplicateKey.field} '${duplicateKey.value}' already exists`,
        error: 'Conflict',
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
        code: ErrorCode.DB_001,
        details: {
          field: duplicateKey.field,
          value: duplicateKey.value,
        },
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    // Validation error
    if (error.name === 'ValidationError' && error.errors) {
      const validationDetails = this.formatMongoValidationErrors(error.errors);
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
        code: ErrorCode.VAL_001,
        details: validationDetails,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    // Cast error (invalid ObjectId)
    if (error.name === 'CastError') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid ID format',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
        code: ErrorCode.DB_002,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    // Connection error
    if (error.name === 'MongoNetworkError' || error.message?.includes('connection')) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection error. Please try again later.',
        error: 'Service Unavailable',
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
        code: ErrorCode.DB_003,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    // Generic MongoDB error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database operation failed',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      code: ErrorCode.DB_004,
      stack: this.isDevelopment ? error.stack : undefined,
    };
  }

  /**
   * Handle generic Error
   */
  private handleGenericError(
    error: Error,
    request: RequestWithId,
    requestId: string,
  ): ErrorResponseDto {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.isDevelopment ? error.message : 'Internal server error',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      code: ErrorCode.GEN_001,
      stack: this.isDevelopment ? error.stack : undefined,
    };
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(request: RequestWithId, requestId: string): ErrorResponseDto {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      code: ErrorCode.GEN_001,
    };
  }

  /**
   * Check if error is a MongoDB error
   */
  private isMongoError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const mongoError = error as MongooseError;
    return (
      mongoError.code === 11000 ||
      mongoError.name === 'ValidationError' ||
      mongoError.name === 'CastError' ||
      mongoError.name === 'MongoNetworkError' ||
      mongoError.message?.includes('Mongo') === true
    );
  }

  /**
   * Extract duplicate key information from MongoDB error
   */
  private extractDuplicateKey(error: MongooseError): { field: string; value: string } {
    if (error.keyPattern && error.keyValue) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return { field, value: String(value) };
    }
    return { field: 'unknown', value: 'unknown' };
  }

  /**
   * Format MongoDB validation errors
   */
  private formatMongoValidationErrors(
    errors: Record<string, { message: string; kind: string }>,
  ): ValidationErrorDetail[] {
    return Object.entries(errors).map(([field, error]) => ({
      field,
      message: error.message,
      value: undefined,
    }));
  }

  /**
   * Format validation errors from ValidationPipe
   */
  private formatValidationErrors(messages: string[]): ValidationErrorDetail[] {
    return messages.map((message) => {
      // Extract field name from ValidationPipe messages
      // Formats: "property email should be an email", "email must be an email", etc.
      const fieldMatch = message.match(/(?:property\s+)?(\w+)(?:\s+(?:should|must|is))/i);
      const field = fieldMatch ? fieldMatch[1] : 'unknown';
      return {
        field,
        message,
      };
    });
  }

  /**
   * Determine log level based on HTTP status
   */
  private getLogLevel(status: number): 'error' | 'warn' | 'debug' {
    if (status >= 500) return 'error';
    if (status >= 400) return 'warn';
    return 'debug';
  }

  /**
   * Log error with context
   */
  private logError(
    errorResponse: ErrorResponseDto,
    request: RequestWithId,
    exception: unknown,
    level: 'error' | 'warn' | 'debug',
  ): void {
    const logContext = {
      requestId: errorResponse.requestId,
      method: request.method,
      url: request.url,
      statusCode: errorResponse.statusCode,
      code: errorResponse.code,
      userId: (request as Request & { user?: { id: string } }).user?.id,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    const logMessage = `${request.method} ${request.url} - Status: ${errorResponse.statusCode} - Message: ${JSON.stringify(errorResponse.message)}`;

    if (level === 'error') {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else if (level === 'warn') {
      this.logger.warn(logMessage, JSON.stringify(logContext));
    } else {
      this.logger.debug(logMessage, JSON.stringify(logContext));
    }
  }
}
