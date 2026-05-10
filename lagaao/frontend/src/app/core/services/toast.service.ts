import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snack = inject(MatSnackBar);

  private base(message: string, type: ToastType, config: Partial<MatSnackBarConfig> = {}): void {
    this.snack.open(message, 'Dismiss', {
      duration:           4000,
      horizontalPosition: 'end',
      verticalPosition:   'bottom',
      panelClass:         [`toast-${type}`],
      ...config,
    });
  }

  success(message: string): void { this.base(message, 'success'); }
  error(message: string, duration = 6000): void { this.base(message, 'error', { duration }); }
  warning(message: string): void { this.base(message, 'warning'); }
  info(message: string): void    { this.base(message, 'info'); }

  dismiss(): void { this.snack.dismiss(); }
}
