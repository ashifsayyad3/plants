import { inject }             from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService }          from '../services/auth.service';

/** Blocks logged-in users from accessing /auth/* — redirects to home */
export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return true;

  return router.createUrlTree(['/']);
};
