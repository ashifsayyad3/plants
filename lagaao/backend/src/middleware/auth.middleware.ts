import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken }  from '../utils/jwt.util';
import { ResponseUtil }       from '../utils/response.util';
import { CONSTANTS }          from '../config/constants';

// ─── authenticate ─────────────────────────────────────────────────────────────

/**
 * Verifies the Bearer token in the Authorization header.
 * On success, populates req.user with the decoded payload.
 * On failure, returns 401.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    ResponseUtil.unauthorized(res, CONSTANTS.MESSAGES.UNAUTHORIZED, req);
    return;
  }

  try {
    const token   = header.slice(7);
    const payload = verifyAccessToken(token);

    req.user = {
      id:          payload.sub,
      email:       payload.email,
      role:        payload.roles[0] ?? 'user',
      roles:       payload.roles,
      permissions: payload.permissions,
      uuid:        payload.uuid,
    };

    next();
  } catch (err) {
    // verifyAccessToken throws AppError — forward to global handler
    next(err);
  }
}

// ─── optionalAuthenticate ─────────────────────────────────────────────────────

/**
 * Like authenticate but does NOT reject unauthenticated requests.
 * Use for public routes that show extra data when logged in.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(header.slice(7));
      req.user = {
        id:          payload.sub,
        email:       payload.email,
        role:        payload.roles[0] ?? 'user',
        roles:       payload.roles,
        permissions: payload.permissions,
        uuid:        payload.uuid,
      };
    } catch {
      // silently ignore — unauthenticated is fine here
    }
  }
  next();
}

// ─── authorize (Role-based) ───────────────────────────────────────────────────

/**
 * Checks that the authenticated user holds at least one of the required roles.
 * Must be used AFTER authenticate().
 *
 * Usage:
 *   router.delete('/users/:id', authenticate, authorize('admin', 'super_admin'), handler);
 */
export function authorize(...allowedRoles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRoles: string[] = (req.user as { roles?: string[] })?.roles ?? [];

    const hasRole = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      ResponseUtil.forbidden(res, CONSTANTS.MESSAGES.FORBIDDEN, req);
      return;
    }
    next();
  };
}

// ─── requirePermission (Permission-based) ─────────────────────────────────────

/**
 * Checks that the authenticated user's roles grant the given permission.
 * Must be used AFTER authenticate().
 *
 * Usage:
 *   router.post('/listings', authenticate, requirePermission('listings:create'), handler);
 */
export function requirePermission(...perms: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userPerms: string[] = (req.user as { permissions?: string[] })?.permissions ?? [];
    const userRoles: string[] = (req.user as { roles?: string[] })?.roles ?? [];

    // Super admin bypasses all permission checks
    if (userRoles.includes('super_admin')) { next(); return; }

    const hasAll = perms.every((p) => userPerms.includes(p));
    if (!hasAll) {
      ResponseUtil.forbidden(res, CONSTANTS.MESSAGES.FORBIDDEN, req);
      return;
    }
    next();
  };
}

// ─── requireVerifiedEmail ─────────────────────────────────────────────────────

/**
 * Rejects requests from users who have not yet verified their email.
 * Attach after authenticate() on sensitive routes.
 */
export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction): void {
  const user = req.user as { emailVerifiedAt?: Date | null } | undefined;
  if (!user?.emailVerifiedAt) {
    ResponseUtil.error(res, CONSTANTS.MESSAGES.EMAIL_NOT_VERIFIED, CONSTANTS.HTTP_STATUS.FORBIDDEN, undefined, req);
    return;
  }
  next();
}
