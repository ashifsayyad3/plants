import {
  Component, input, effect, ElementRef, ViewChild,
  OnDestroy, inject, computed,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatMenuModule }   from '@angular/material/menu';
import type { Chart as ChartType, ChartConfiguration } from 'chart.js';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ExportService }     from '../../services/export.service';
import { ThemeService }      from '../../../../../core/services/theme.service';
import { ChartDataPoint }    from '../../models/dashboard.models';

export type ChartKind = 'line' | 'bar' | 'doughnut' | 'pie';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [NgClass, MatButtonModule, MatIconModule, MatMenuModule, SkeletonComponent],
  template: `
    <div class="chart-card">
      <div class="chart-card__header">
        <div>
          <h3 class="chart-card__title">{{ title() }}</h3>
          @if (subtitle()) { <p class="chart-card__subtitle">{{ subtitle() }}</p> }
        </div>
        <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Chart options">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="exportCsv()">
            <mat-icon>download</mat-icon><span>Export CSV</span>
          </button>
        </mat-menu>
      </div>

      <div class="chart-card__body">
        @if (loading()) {
          <div class="chart-card__skeleton">
            <app-skeleton height="100%" width="100%" radius="8px" />
          </div>
        } @else {
          <canvas #chartCanvas></canvas>
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../../styles/variables' as *;

    .chart-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: $radius-lg;
      padding: $spacing-lg;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .chart-card__header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: $spacing-md;
    }
    .chart-card__title    { margin: 0; font-size: $font-size-base; font-weight: 600; color: var(--text-primary); }
    .chart-card__subtitle { margin: 2px 0 0; font-size: $font-size-sm; color: var(--text-muted); }
    .chart-card__body     { flex: 1; min-height: 200px; position: relative; }
    .chart-card__skeleton { height: 100%; }
    canvas { width: 100% !important; height: 100% !important; }
  `],
})
export class ChartCardComponent implements OnDestroy {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly title    = input.required<string>();
  readonly subtitle = input<string>('');
  readonly kind     = input<ChartKind>('line');
  readonly data     = input<ChartDataPoint[]>([]);
  readonly loading  = input<boolean>(false);

  private readonly themeService = inject(ThemeService);
  private readonly exportSvc    = inject(ExportService);
  private chart: ChartType | null = null;

  constructor() {
    effect(() => {
      const d = this.data();
      const l = this.loading();
      if (!l && d.length) {
        // defer to next tick so canvas is in DOM
        setTimeout(() => this.renderChart(), 0);
      }
    });

    // re-render when theme changes
    effect(() => {
      this.themeService.theme();
      if (this.chart) {
        setTimeout(() => this.renderChart(), 0);
      }
    });
  }

  private async renderChart(): Promise<void> {
    if (!this.canvasRef) return;

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const isDark = this.themeService.theme() === 'dark';
    const textColor  = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    const gridColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    const kind       = this.kind();
    const points     = this.data();
    const labels     = points.map((p) => p.label);
    const values     = points.map((p) => p.value);

    const PALETTE = ['#5c35c7','#0d9488','#f59e0b','#ef4444','#2563eb','#7c3aed','#059669','#d97706'];

    const isPie = kind === 'doughnut' || kind === 'pie';

    const dataset: any = isPie
      ? { data: values, backgroundColor: PALETTE.slice(0, values.length), borderWidth: 2, borderColor: isDark ? '#1e1e2e' : '#fff' }
      : {
          data: values,
          backgroundColor: kind === 'bar' ? 'rgba(92,53,199,0.7)' : 'rgba(92,53,199,0.15)',
          borderColor: '#5c35c7',
          borderWidth: 2,
          fill: kind === 'line',
          tension: 0.4,
          pointRadius: kind === 'line' ? 3 : 0,
          pointHoverRadius: 5,
        };

    const config: ChartConfiguration = {
      type: kind,
      data: { labels, datasets: [dataset] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
          legend: {
            display: isPie,
            position: 'bottom',
            labels: { color: textColor, padding: 16, usePointStyle: true, pointStyleWidth: 10 },
          },
          tooltip: {
            backgroundColor: isDark ? '#2d2d44' : '#fff',
            titleColor: isDark ? '#fff' : '#111',
            bodyColor: textColor,
            borderColor: isDark ? '#444' : '#e0e0e0',
            borderWidth: 1,
          },
        },
        scales: isPie ? undefined : {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, maxTicksLimit: 8 },
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor },
            beginAtZero: true,
          },
        },
      },
    };

    this.chart = new Chart(this.canvasRef.nativeElement, config);
  }

  exportCsv(): void {
    this.exportSvc.exportToCsv(
      this.data().map((p) => ({ label: p.label, value: p.value })),
      this.title().toLowerCase().replace(/\s+/g, '-'),
    );
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
