import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { DashboardApiService } from '../services/dashboard.service';
import { DashboardState, KpiStats, DashboardCharts, ActivityEntry, NotificationEntry } from '../models/dashboard.models';
import { ToastService } from '../../../core/services/toast.service';

const INITIAL: DashboardState = {
  stats:                null,
  charts:               null,
  activity:             [],
  notifications:        [],
  loadingStats:         false,
  loadingCharts:        false,
  loadingActivity:      false,
  loadingNotifications: false,
  lastRefreshed:        null,
};

const POLL_INTERVAL_MS = 60_000; // 1 min

@Injectable({ providedIn: 'root' })
export class DashboardStore implements OnDestroy {
  private readonly api   = inject(DashboardApiService);
  private readonly toast = inject(ToastService);

  private readonly _state = signal<DashboardState>(INITIAL);
  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  // ─── Selectors ───────────────────────────────────────────────────────────────
  readonly stats         = computed(() => this._state().stats);
  readonly charts        = computed(() => this._state().charts);
  readonly activity      = computed(() => this._state().activity);
  readonly notifications = computed(() => this._state().notifications);
  readonly isLoading     = computed(() =>
    this._state().loadingStats ||
    this._state().loadingCharts ||
    this._state().loadingActivity ||
    this._state().loadingNotifications,
  );
  readonly lastRefreshed = computed(() => this._state().lastRefreshed);
  readonly unreadCount   = computed(() => this._state().notifications.filter((n) => !n.isRead).length);

  // ─── Per-section loading ─────────────────────────────────────────────────────
  readonly loadingStats         = computed(() => this._state().loadingStats);
  readonly loadingCharts        = computed(() => this._state().loadingCharts);
  readonly loadingActivity      = computed(() => this._state().loadingActivity);
  readonly loadingNotifications = computed(() => this._state().loadingNotifications);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  loadAll(): void {
    this.loadStats();
    this.loadCharts();
    this.loadActivity();
    this.loadNotifications();
  }

  loadStats(): void {
    this.patch({ loadingStats: true });
    this.api.getStats().subscribe({
      next:  (stats)  => this.patch({ stats, loadingStats: false, lastRefreshed: new Date() }),
      error: ()       => { this.patch({ loadingStats: false }); this.toast.error('Failed to load KPI stats'); },
    });
  }

  loadCharts(): void {
    this.patch({ loadingCharts: true });
    this.api.getCharts().subscribe({
      next:  (charts) => this.patch({ charts, loadingCharts: false }),
      error: ()       => this.patch({ loadingCharts: false }),
    });
  }

  loadActivity(): void {
    this.patch({ loadingActivity: true });
    this.api.getActivity().subscribe({
      next:  (activity) => this.patch({ activity, loadingActivity: false }),
      error: ()         => this.patch({ loadingActivity: false }),
    });
  }

  loadNotifications(): void {
    this.patch({ loadingNotifications: true });
    this.api.getNotifications().subscribe({
      next:  (notifications) => this.patch({ notifications, loadingNotifications: false }),
      error: ()              => this.patch({ loadingNotifications: false }),
    });
  }

  markNotificationRead(id: number): void {
    this._state.update((s) => ({
      ...s,
      notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
    }));
  }

  startPolling(): void {
    this.stopPolling();
    this._pollTimer = setInterval(() => this.loadAll(), POLL_INTERVAL_MS);
  }

  stopPolling(): void {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  reset(): void {
    this.stopPolling();
    this._state.set(INITIAL);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private patch(partial: Partial<DashboardState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }
}
