import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { ResponseUtil } from '../utils/response.util';
import { CONSTANTS } from '../config/constants';

// ─── Custom Application Error ─────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Convenience Error Subclasses ─────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(message: string = CONSTANTS.MESSAGES.NOT_FOUND) {
    super(message, CONSTANTS.HTTP_STATUS.NOT_FOUND);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = CONSTANTS.MESSAGES.VALIDATION_ERROR) {
    super(message, CONSTANTS.HTTP_STATUS.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = CONSTANTS.MESSAGES.UNAUTHORIZED) {
    super(message, CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = CONSTANTS.MESSAGES.FORBIDDEN) {
    super(message, CONSTANTS.HTTP_STATUS.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, CONSTANTS.HTTP_STATUS.CONFLICT);
  }
}

// ─── 404 Handler ──────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  ResponseUtil.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
}

// ─── Global Error Handler ─────────────────────────────────────────────────────

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const reqAny = req as any;
  logger.error('Unhandled error', {
    requestId: reqAny.requestId,
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  // Zod errors that escape validate() middleware (shouldn't happen, but safety net)
  if (err instanceof ZodError) {
    ResponseUtil.badRequest(res, CONSTANTS.MESSAGES.VALIDATION_ERROR, err.flatten().fieldErrors);
    return;
  }

  // Sequelize unique constraint violation
  if ((err as NodeJS.ErrnoException).name === 'SequelizeUniqueConstraintError') {
    ResponseUtil.error(res, 'A record with this value already exists', CONSTANTS.HTTP_STATUS.CONFLICT);
    return;
  }

  // Sequelize validation error
  if ((err as NodeJS.ErrnoException).name === 'SequelizeValidationError') {
    ResponseUtil.badRequest(res, CONSTANTS.MESSAGES.VALIDATION_ERROR, (err as { errors?: { message: string }[] }).errors?.map((e) => e.message));
    return;
  }

  // Operational AppError — safe to expose message to client
  if (err instanceof AppError && err.isOperational) {
    ResponseUtil.error(res, err.message, err.statusCode);
    return;
  }

  // Unknown / programmer error — hide internals
  ResponseUtil.error(res, CONSTANTS.MESSAGES.INTERNAL_ERROR, CONSTANTS.HTTP_STATUS.INTERNAL_ERROR);
}
