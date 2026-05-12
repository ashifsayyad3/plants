import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';

export interface PageAction {
  label:   string;
  icon?:   string;
  color?:  'primary' | 'accent' | 'warn';
  action:  () => void;
  disabled?: boolean;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="page-header">
      <div class="page-header__left">
        <h1 class="page-header__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      @if (actions().length) {
        <div class="page-header__actions">
          @for (action of actions(); track action.label) {
            <button mat-flat-button
              [color]="action.color ?? 'primary'"
              [disabled]="action.disabled ?? false"
              (click)="action.action()">
              @if (action.icon) { <mat-icon>{{ action.icon }}</mat-icon> }
              {{ action.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: $spacing-md;
      margin-bottom: $spacing-lg;
      flex-wrap: wrap;
    }
    .page-header__title {
      margin: 0;
      font-size: $font-size-xl;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .page-header__subtitle {
      margin: $spacing-xs 0 0;
      font-size: $font-size-sm;
      color: var(--text-muted);
    }
    .page-header__actions {
      display: flex;
      gap: $spacing-sm;
      flex-shrink: 0;
    }
  `],
})
export class PageHeaderComponent {
  readonly title    = input.required<string>();
  readonly subtitle = input<string>('');
  readonly actions  = input<PageAction[]>([]);
}
