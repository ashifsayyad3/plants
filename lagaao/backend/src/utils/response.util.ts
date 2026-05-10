import { Request, Response } from 'express';
import { CONSTANTS } from '../config/constants';
import { PaginationMeta } from '../types/common.types';

// ─── Internal shapes ──────────────────────────────────────────────────────────

interface SuccessBody<T> {
  success: true;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

interface ErrorBody {
  success: false;
  message: string;
  errors?: unknown;
  requestId?: string;
}

// ─── ResponseUtil ─────────────────────────────────────────────────────────────

export class ResponseUtil {
  // ── Success ────────────────────────────────────────────────────────────────

  static success<T>(
    res: Response,
    data?: T,
    message = CONSTANTS.MESSAGES.SUCCESS,
    statusCode = CONSTANTS.HTTP_STATUS.OK,
  ): Response {
    const body: SuccessBody<T> = { success: true, message };
    if (data !== undefined) body.data = data;
    return res.status(statusCode).json(body);
  }

  static created<T>(res: Response, data?: T, message = CONSTANTS.MESSAGES.CREATED): Response {
    return this.success(res, data, message, CONSTANTS.HTTP_STATUS.CREATED);
  }

  static noContent(res: Response): Response {
    return res.status(CONSTANTS.HTTP_STATUS.NO_CONTENT).send();
  }

  static paginated<T>(
    res: Response,
    rows: T[],
    meta: PaginationMeta,
    message = CONSTANTS.MESSAGES.SUCCESS,
  ): Response {
    const body: SuccessBody<T[]> = { success: true, message, data: rows, meta };
    return res.status(CONSTANTS.HTTP_STATUS.OK).json(body);
  }

  // ── Errors ─────────────────────────────────────────────────────────────────

  static error(
    res: Response,
    message: string,
    statusCode = CONSTANTS.HTTP_STATUS.INTERNAL_ERROR,
    errors?: unknown,
    req?: Request,
  ): Response {
    const body: ErrorBody = { success: false, message };
    if (errors !== undefined) body.errors = errors;
    if (req?.requestId) body.requestId = req.requestId;
    return res.status(statusCode).json(body);
  }

  static notFound(res: Response, message = CONSTANTS.MESSAGES.NOT_FOUND, req?: Request): Response {
    return this.error(res, message, CONSTANTS.HTTP_STATUS.NOT_FOUND, undefined, req);
  }

  static badRequest(res: Response, message = CONSTANTS.MESSAGES.VALIDATION_ERROR, errors?: unknown, req?: Request): Response {
    return this.error(res, message, CONSTANTS.HTTP_STATUS.BAD_REQUEST, errors, req);
  }

  static unauthorized(res: Response, message = CONSTANTS.MESSAGES.UNAUTHORIZED, req?: Request): Response {
    return this.error(res, message, CONSTANTS.HTTP_STATUS.UNAUTHORIZED, undefined, req);
  }

  static forbidden(res: Response, message = CONSTANTS.MESSAGES.FORBIDDEN, req?: Request): Response {
    return this.error(res, message, CONSTANTS.HTTP_STATUS.FORBIDDEN, undefined, req);
  }

  static conflict(res: Response, message: string, req?: Request): Response {
    return this.error(res, message, CONSTANTS.HTTP_STATUS.CONFLICT, undefined, req);
  }
}
