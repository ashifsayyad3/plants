import { Component, input, output } from '@angular/core';
import { MatIconModule }   from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-state__icon">{{ icon() }}</mat-icon>
      <h3 class="empty-state__title">{{ title() }}</h3>
      @if (message()) {
        <p class="empty-state__message">{{ message() }}</p>
      }
      @if (actionLabel()) {
        <button mat-flat-button color="primary" (click)="action.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: $spacing-xxl $spacing-lg;
      text-align: center;
      gap: $spacing-sm;
    }
    .empty-state__icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: var(--text-muted);
      opacity: 0.5;
    }
    .empty-state__title {
      margin: 0;
      font-size: $font-size-lg;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .empty-state__message {
      margin: 0;
      font-size: $font-size-sm;
      color: var(--text-muted);
      max-width: 360px;
    }
  `],
})
export class EmptyStateComponent {
  readonly icon        = input<string>('inbox');
  readonly title       = input<string>('No data found');
  readonly message     = input<string>('');
  readonly actionLabel = input<string>('');
  readonly action      = output<void>();
}
