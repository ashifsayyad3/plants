import {
  HttpInterceptorFn, HttpRequest, HttpHandlerFn,
  HttpEvent, HttpErrorResponse,
} from '@angular/common/http';
import { inject }       from '@angular/core';
import { Observable, throwError, BehaviorSubject, switchMap, filter, take, catchError } from 'rxjs';
import { AuthService }  from '../services/auth.service';
import type { ApiResponse } from '../../../../../shared/types/api-response.types';
import type { AuthResponse } from '../models/auth.models';

// Shared refresh state — prevents multiple simultaneous refresh calls
let isRefreshing = false;
const refreshSubject$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token       = authService.accessToken();

  // Skip injecting token for auth endpoints (login, refresh, etc.)
  const isAuthEndpoint = req.url.includes('/auth/login')
    || req.url.includes('/auth/register')
    || req.url.includes('/auth/refresh')
    || req.url.includes('/auth/forgot-password')
    || req.url.includes('/auth/reset-password')
    || req.url.includes('/auth/verify-email');

  const authReq = token && !isAuthEndpoint
    ? addToken(req, token)
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 on a non-auth endpoint → try to refresh
      if (error.status === 401 && !isAuthEndpoint) {
        return handleRefresh(authReq, next, authService);
      }
      return throwError(() => error);
    }),
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handleRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    // Queue request — wait for the current refresh to finish
    return refreshSubject$.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((token) => next(addToken(req, token))),
    );
  }

  isRefreshing = true;
  refreshSubject$.next(null);

  return authService.refresh().pipe(
    switchMap((res: ApiResponse<AuthResponse>) => {
      isRefreshing = false;
      const newToken = res.data?.accessToken ?? '';
      refreshSubject$.next(newToken);
      authService.setAccessToken(newToken);
      return next(addToken(req, newToken));
    }),
    catchError((err) => {
      isRefreshing = false;
      authService.clearSession();
      return throwError(() => err);
    }),
  );
}
