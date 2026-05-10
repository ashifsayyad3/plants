import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { UiStore } from '../store/ui.store';

const SKIP_HEADER = 'X-Skip-Loader';

/**
 * Shows/hides the global loading overlay for every HTTP request.
 * Add the X-Skip-Loader header to opt out (e.g. background polling).
 *
 * Usage in a service:
 *   this.http.get('/api/v1/data', { headers: { 'X-Skip-Loader': '1' } })
 */
export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const ui = inject(UiStore);

  if (req.headers.has(SKIP_HEADER)) {
    return next(req.clone({ headers: req.headers.delete(SKIP_HEADER) }));
  }

  ui.showLoader();
  return next(req).pipe(finalize(() => ui.hideLoader()));
};
