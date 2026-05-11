import { Request, Response, NextFunction } from 'express';
import { ActivityLog } from '../modules/activity-log/activity-log.model';
import { logger }      from '../config/logger';

interface LogOptions {
  action:       string;
  subjectType?: string;
  getSubjectId?: (req: Request) => number | undefined;
  getOldValues?: (req: Request) => Record<string, unknown> | undefined;
  getNewValues?: (res: Response, req: Request) => Record<string, unknown> | undefined;
  skipOnError?:  boolean;
}

/**
 * Factory that returns an Express middleware which writes an ActivityLog row
 * after the response is sent. Fires on `res.on('finish')` to avoid blocking.
 *
 * Usage:
 *   router.post('/users', logActivity({ action: 'user.create', subjectType: 'User' }), handler)
 */
export function logActivity(opts: LogOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      // Optionally skip logging when the response is an error
      if (opts.skipOnError && res.statusCode >= 400) return;

      const user = (req as any).user as { id?: number } | undefined;

      ActivityLog.log({
        userId:      user?.id ?? null,
        action:      opts.action,
        subjectType: opts.subjectType,
        subjectId:   opts.getSubjectId?.(req),
        oldValues:   opts.getOldValues?.(req),
        newValues:   opts.getNewValues?.(res, req),
        ipAddress:   (req.ip ?? req.socket.remoteAddress ?? '').replace('::ffff:', ''),
        userAgent:   req.headers['user-agent'] ?? undefined,
        requestId:   (req as any).requestId,
        meta:        { method: req.method, path: req.path, status: res.statusCode },
      }).catch((err) => logger.warn('[ActivityLog] write failed', { err }));
    });

    next();
  };
}

/**
 * Blanket API audit middleware — logs every mutating request (POST/PUT/PATCH/DELETE).
 * Mount AFTER authenticate so req.user is populated.
 * Only logs the route/method/status; no body captured (avoid PII).
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  if (!MUTATING.has(req.method)) return next();

  res.on('finish', () => {
    const user = (req as any).user as { id?: number } | undefined;
    ActivityLog.log({
      userId:    user?.id ?? null,
      action:    `api.${req.method.toLowerCase()}`,
      ipAddress: (req.ip ?? '').replace('::ffff:', ''),
      userAgent: req.headers['user-agent'] ?? undefined,
      requestId: (req as any).requestId,
      meta:      { method: req.method, path: req.path, status: res.statusCode },
    }).catch((err) => logger.warn('[Audit] write failed', { err }));
  });

  next();
}
