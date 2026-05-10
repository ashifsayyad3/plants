import { Component, inject }  from '@angular/core';
import { RouterLink }         from '@angular/router';
import { MatIconModule }      from '@angular/material/icon';
import { UiStore }            from '../../core/store/ui.store';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    @if (ui.breadcrumbs().length > 1) {
      <nav class="breadcrumb" aria-label="Breadcrumb">
        @for (crumb of ui.breadcrumbs(); track crumb.label; let last = $last) {
          @if (!last) {
            <a class="breadcrumb__item breadcrumb__item--link"
              [routerLink]="crumb.url">
              @if (crumb.icon) { <mat-icon>{{ crumb.icon }}</mat-icon> }
              {{ crumb.label }}
            </a>
            <mat-icon class="breadcrumb__sep">chevron_right</mat-icon>
          } @else {
            <span class="breadcrumb__item breadcrumb__item--current" aria-current="page">
              {{ crumb.label }}
            </span>
          }
        }
      </nav>
    }
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: $spacing-sm $spacing-lg;
      font-size: $font-size-sm;
    }
    .breadcrumb__item {
      display: flex;
      align-items: center;
      gap: 4px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &--link { color: var(--text-link); text-decoration: none;
        &:hover { text-decoration: underline; } }
      &--current { color: var(--text-muted); font-weight: 500; }
    }
    .breadcrumb__sep { font-size: 14px; width: 14px; height: 14px; color: var(--text-muted); }
  `],
})
export class BreadcrumbComponent {
  readonly ui = inject(UiStore);
}
