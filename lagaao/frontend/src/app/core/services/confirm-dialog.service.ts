import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  open(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data,
        width: '480px',
        maxWidth: '95vw',
      })
      .afterClosed() as Observable<boolean>;
  }

  confirm(title: string, message: string): Observable<boolean> {
    return this.open({ title, message });
  }

  danger(title: string, message: string, confirmLabel = 'Delete'): Observable<boolean> {
    return this.open({ title, message, confirmLabel, dangerous: true });
  }
}
