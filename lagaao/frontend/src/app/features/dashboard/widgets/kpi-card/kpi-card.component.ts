import { Component, input, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { KpiStats, KpiCardConfig } from '../../models/dashboard.models';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [NgClass, MatIconModule, MatTooltipModule, SkeletonComponent],
  template: `
    <div class="kpi-card" [ngClass]="'kpi-card--' + config().color">
      <div class="kpi-card__icon-wrap">
        <mat-icon>{{ config().icon }}</mat-icon>
      </div>

      <div class="kpi-card__body">
        @if (loading()) {
          <app-skeleton height="36px" width="80px" />
          <app-skeleton height="14px" width="120px" />
        } @else {
          <span class="kpi-card__value">{{ displayValue() }}</span>
          <span class="kpi-card__label">{{ config().label }}</span>
          @if (deltaValue() !== null) {
            <span class="kpi-card__delta" [ngClass]="deltaValue()! > 0 ? 'positive' : 'neutral'">
              <mat-icon>{{ deltaValue()! > 0 ? 'trending_up' : 'trending_flat' }}</mat-icon>
              {{ deltaValue() }} {{ config().deltaLabel ?? 'today' }}
            </span>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../../styles/variables' as *;

    .kpi-card {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: $radius-lg;
      padding: $spacing-lg;
      transition: transform $transition-fast, box-shadow $transition-fast;
      cursor: default;

      &:hover { transform: translateY(-2px); box-shadow: $shadow-md; }
    }

    .kpi-card__icon-wrap {
      width: 52px; height: 52px;
      border-radius: $radius-md;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 26px; width: 26px; height: 26px; }
    }

    .kpi-card--primary .kpi-card__icon-wrap { background: rgba(92,53,199,.12); color: var(--color-primary); }
    .kpi-card--success .kpi-card__icon-wrap { background: var(--status-success-bg); color: var(--status-success-text); }
    .kpi-card--warning .kpi-card__icon-wrap { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .kpi-card--info    .kpi-card__icon-wrap { background: var(--status-info-bg);    color: var(--status-info-text); }

    .kpi-card__body    { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .kpi-card__value   { font-size: 28px; font-weight: 700; line-height: 1; color: var(--text-primary); }
    .kpi-card__label   { font-size: $font-size-sm; color: var(--text-muted); white-space: nowrap; }

    .kpi-card__delta {
      display: flex; align-items: center; gap: 2px;
      font-size: 11px; font-weight: 600; margin-top: 2px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &.positive { color: var(--status-success-text); }
      &.neutral  { color: var(--text-muted); }
    }
  `],
})
export class KpiCardComponent {
  readonly config  = input.required<KpiCardConfig>();
  readonly stats   = input<KpiStats | null>(null);
  readonly loading = input<boolean>(false);

  readonly displayValue = computed(() => {
    const s = this.stats();
    if (!s) return '–';
    const v = s[this.config().key];
    return typeof v === 'number' ? v.toLocaleString() : String(v);
  });

  readonly deltaValue = computed((): number | null => {
    const k = this.config().deltaKey;
    const s = this.stats();
    if (!k || !s) return null;
    return s[k] as number;
  });
}
