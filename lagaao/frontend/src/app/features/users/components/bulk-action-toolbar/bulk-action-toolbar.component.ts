import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatMenuModule }   from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-bulk-action-toolbar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  template: `
    @if (count() > 0) {
      <div class="bulk-toolbar">
        <span class="bulk-toolbar__count">{{ count() }} selected</span>

        <button mat-stroked-button (click)="action.emit('activate')" matTooltip="Set status to Active">
          <mat-icon>check_circle</mat-icon> Activate
        </button>
        <button mat-stroked-button (click)="action.emit('deactivate')" matTooltip="Set status to Inactive">
          <mat-icon>pause_circle</mat-icon> Deactivate
        </button>
        <button mat-stroked-button (click)="action.emit('ban')" matTooltip="Ban selected users">
          <mat-icon>block</mat-icon> Ban
        </button>
        <button mat-stroked-button color="warn" (click)="action.emit('delete')">
          <mat-icon>delete</mat-icon> Delete
        </button>

        <button mat-icon-button (click)="clear.emit()" matTooltip="Clear selection">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    }
  `,
  styles: [`
    @use '../../../../../../styles/variables' as *;
    .bulk-toolbar {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      padding: $spacing-sm $spacing-md;
      background: var(--color-primary-bg);
      border: 1px solid rgba(92,53,199,.25);
      border-radius: $radius-md;
      flex-wrap: wrap;
      animation: slideDown 0.15s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .bulk-toolbar__count {
      font-size: $font-size-sm; font-weight: 600;
      color: var(--color-primary); margin-right: $spacing-sm;
    }
  `],
})
export class BulkActionToolbarComponent {
  readonly count  = input.required<number>();
  readonly action = output<'activate' | 'deactivate' | 'ban' | 'delete'>();
  readonly clear  = output<void>();
}
