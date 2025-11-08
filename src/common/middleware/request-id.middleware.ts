import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Request ID Middleware
 * Generates a unique request ID for each request and adds it to headers
 * This enables error correlation and request tracking
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing request ID from header if present, otherwise generate one
    const requestId = req.headers['x-request-id'] || randomUUID();

    // Add request ID to request object for access in controllers/services
    (req as Request & { requestId: string }).requestId = requestId as string;

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
