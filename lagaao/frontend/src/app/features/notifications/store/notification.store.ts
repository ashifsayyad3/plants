import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { NotificationApiService } from '../services/notification-api.service';
import { NotificationRecord }     from '../models/notification.models';
import { AppStore }               from '../../../core/store/app.store';
import { ToastService }           from '../../../core/services/toast.service';

const POLL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class NotificationStore implements OnDestroy {
  private readonly api    = inject(NotificationApiService);
  private readonly app    = inject(AppStore);
  private readonly toast  = inject(ToastService);

  // ─── State ────────────────────────────────────────────────────────────────
  readonly items       = signal<NotificationRecord[]>([]);
  readonly total       = signal(0);
  readonly page        = signal(1);
  readonly totalPages  = signal(1);
  readonly loading     = signal(false);
  readonly unreadCount = signal(0);

  readonly hasMore = computed(() => this.page() < this.totalPages());

  // ─── Polling ──────────────────────────────────────────────────────────────
  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  startPolling(): void {
    if (this._pollTimer) return;
    this.refreshUnreadCount();
    this._pollTimer = setInterval(() => this.refreshUnreadCount(), POLL_MS);
  }

  stopPolling(): void {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  }

  ngOnDestroy(): void { this.stopPolling(); }

  // ─── Load page ────────────────────────────────────────────────────────────
  load(params: { page?: number; unreadOnly?: boolean; channel?: string; type?: string } = {}): void {
    this.loading.set(true);
    this.api.list({ page: params.page ?? 1, limit: 20, ...params }).subscribe({
      next: (res: any) => {
        const meta = res.meta ?? {};
        this.items.set(res.data ?? []);
        this.total.set(meta.total ?? 0);
        this.page.set(meta.page ?? 1);
        this.totalPages.set(meta.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ─── Refresh badge count ──────────────────────────────────────────────────
  refreshUnreadCount(): void {
    this.api.unreadCount().subscribe((n) => {
      this.unreadCount.set(n);
      this.app.setUnreadCount(n);
    });
  }

  // ─── Mark one read ────────────────────────────────────────────────────────
  markRead(uuid: string): void {
    this.api.markRead(uuid).subscribe({
      next: (updated) => {
        this.items.update((list) =>
          list.map((n) => n.uuid === uuid ? { ...n, isRead: true, readAt: updated.readAt } : n),
        );
        this.unreadCount.update((c) => Math.max(0, c - 1));
        this.app.decrementUnread();
      },
    });
  }

  // ─── Mark all read ────────────────────────────────────────────────────────
  markAllRead(): void {
    this.api.markAllRead().subscribe({
      next: () => {
        this.items.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
        this.app.clearUnread();
        this.toast.success('All notifications marked as read');
      },
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  delete(uuid: string): void {
    const wasUnread = this.items().find((n) => n.uuid === uuid && !n.isRead);
    this.api.delete(uuid).subscribe({
      next: () => {
        this.items.update((list) => list.filter((n) => n.uuid !== uuid));
        this.total.update((t) => Math.max(0, t - 1));
        if (wasUnread) {
          this.unreadCount.update((c) => Math.max(0, c - 1));
          this.app.decrementUnread();
        }
      },
      error: () => this.toast.error('Failed to delete notification'),
    });
  }
}
