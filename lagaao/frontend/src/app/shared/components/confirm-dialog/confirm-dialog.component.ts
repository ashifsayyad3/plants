import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';

export interface ConfirmDialogData {
  title:      string;
  message:    string;
  confirmLabel?: string;
  cancelLabel?:  string;
  dangerous?:    boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-dialog__header" [class.confirm-dialog__header--danger]="data.dangerous">
        <mat-icon>{{ data.dangerous ? 'warning' : 'help_outline' }}</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button [mat-dialog-close]="false">
          {{ data.cancelLabel ?? 'Cancel' }}
        </button>
        <button mat-flat-button
          [color]="data.dangerous ? 'warn' : 'primary'"
          [mat-dialog-close]="true">
          {{ data.confirmLabel ?? 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    .confirm-dialog { min-width: 360px; max-width: 480px; }
    .confirm-dialog__header {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      padding: $spacing-lg $spacing-lg 0;
      mat-icon { color: var(--color-primary); font-size: 28px; width: 28px; height: 28px; }
      h2 { margin: 0; font-size: $font-size-lg; }
    }
    .confirm-dialog__header--danger mat-icon { color: var(--status-danger-text); }
    p { color: var(--text-secondary); margin: 0; }
  `],
})
export class ConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data      = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
