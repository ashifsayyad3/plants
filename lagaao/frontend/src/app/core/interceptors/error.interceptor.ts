import {
  HttpInterceptorFn, HttpRequest, HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject }           from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService }     from '../services/toast.service';
import { AuthService }      from '../services/auth.service';

/**
 * Translates HTTP error responses into user-facing toast messages.
 * 401s are handled by auth.interceptor (token refresh) — this handles the rest.
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const toast = inject(ToastService);
  const auth  = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 is handled upstream by auth.interceptor — skip here
      if (err.status === 401) return throwError(() => err);

      const message = extractMessage(err);

      switch (err.status) {
        case 0:   toast.error('No internet connection. Please check your network.'); break;
        case 403: toast.error(message || 'You do not have permission to do this.'); break;
        case 404: /* let components handle 404 silently */; break;
        case 409: toast.warning(message || 'A conflict occurred. The record may already exist.'); break;
        case 422: /* validation — let forms display inline errors */; break;
        case 429: toast.warning('Too many requests. Please slow down and try again.'); break;
        case 500:
        case 502:
        case 503: toast.error('Server error. Our team has been notified.'); break;
        default:  toast.error(message || 'Something went wrong. Please try again.'); break;
      }

      return throwError(() => err);
    }),
  );
};

function extractMessage(err: HttpErrorResponse): string {
  return (err.error as { message?: string })?.message ?? err.message ?? '';
}
