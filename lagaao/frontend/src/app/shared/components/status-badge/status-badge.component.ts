import { Component, input, computed } from '@angular/core';
import { NgClass } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeConfig {
  [key: string]: BadgeVariant;
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="badge" [ngClass]="'badge--' + resolvedVariant()">
      {{ label() }}
    </span>
  `,
  styles: [`
    @use 'styles/variables' as *;
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px $spacing-sm;
      border-radius: $radius-full;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
      text-transform: capitalize;
      white-space: nowrap;
    }
    .badge--success { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge--warning { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .badge--danger  { background: var(--status-danger-bg);  color: var(--status-danger-text); }
    .badge--info    { background: var(--status-info-bg);    color: var(--status-info-text); }
    .badge--neutral { background: var(--surface-hover);     color: var(--text-muted); }
  `],
})
export class StatusBadgeComponent {
  readonly value   = input.required<string | number | boolean>();
  readonly config  = input<BadgeConfig>({});
  readonly variant = input<BadgeVariant | null>(null);

  readonly label = computed(() => String(this.value()));

  readonly resolvedVariant = computed<BadgeVariant>(() => {
    if (this.variant()) return this.variant()!;
    const key = String(this.value()).toLowerCase();
    return this.config()[key] ?? this.config()[String(this.value())] ?? 'neutral';
  });
}
