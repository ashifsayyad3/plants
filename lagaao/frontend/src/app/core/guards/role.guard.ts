import { inject }                      from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService }                 from '../services/auth.service';

/**
 * Checks that the user holds at least one of the roles defined in route data.
 *
 * Usage in routes:
 *   {
 *     path: 'admin',
 *     canActivate: [authGuard, roleGuard],
 *     data: { roles: ['admin', 'super_admin'] },
 *   }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth     = inject(AuthService);
  const router   = inject(Router);
  const required = (route.data['roles'] as string[] | undefined) ?? [];

  if (!required.length) return true;

  const user = auth.user();
  if (!user) return router.createUrlTree(['/auth/login']);

  const hasRole = required.some((r) => user.roles.includes(r));
  if (hasRole) return true;

  return router.createUrlTree(['/403']);
};

/**
 * Checks that the user holds ALL the permissions in route data.permissions.
 *
 * Usage:
 *   data: { permissions: ['listings:create'] }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth     = inject(AuthService);
  const router   = inject(Router);
  const required = (route.data['permissions'] as string[] | undefined) ?? [];

  if (!required.length) return true;

  const user = auth.user();
  if (!user) return router.createUrlTree(['/auth/login']);

  // Super admin bypasses all checks
  if (user.roles.includes('super_admin')) return true;

  const hasAll = required.every((p) => user.permissions.includes(p));
  if (hasAll) return true;

  return router.createUrlTree(['/403']);
};
