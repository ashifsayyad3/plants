import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink }   from '@angular/router';
import { MatIconModule }        from '@angular/material/icon';
import { MatButtonModule }      from '@angular/material/button';
import { MatBadgeModule }       from '@angular/material/badge';
import { MatMenuModule }        from '@angular/material/menu';
import { MatDividerModule }     from '@angular/material/divider';
import { MatTooltipModule }     from '@angular/material/tooltip';
import { DatePipe, NgClass }    from '@angular/common';
import { NotificationStore }    from '../../store/notification.store';
import { notifIcon, notifVariant } from '../../models/notification.models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    RouterLink, NgClass, DatePipe,
    MatIconModule, MatButtonModule, MatBadgeModule,
    MatMenuModule, MatDividerModule, MatTooltipModule,
  ],
  template: `
    <button mat-icon-button
      [matMenuTriggerFor]="notifMenu"
      matTooltip="Notifications"
      (menuOpened)="onOpen()"
      aria-label="Notifications">
      <mat-icon
        [matBadge]="store.unreadCount() || null"
        matBadgeColor="warn"
        matBadgeSize="small">
        notifications
      </mat-icon>
    </button>

    <mat-menu #notifMenu="matMenu" class="notif-menu" xPosition="before">
      <!-- Header -->
      <div class="nm-header" (click)="$event.stopPropagation()">
        <span class="nm-title">Notifications</span>
        @if (store.unreadCount() > 0) {
          <button mat-button color="primary" class="nm-mark-all" (click)="store.markAllRead()">
            Mark all read
          </button>
        }
      </div>

      <mat-divider />

      <!-- List -->
      <div class="nm-list" (click)="$event.stopPropagation()">
        @if (store.loading()) {
          @for (_ of skeletons; track $index) {
            <div class="nm-skeleton">
              <div class="nm-sk-icon"></div>
              <div class="nm-sk-body">
                <div class="nm-sk-line nm-sk-line--short"></div>
                <div class="nm-sk-line"></div>
              </div>
            </div>
          }
        } @else if (store.items().length === 0) {
          <div class="nm-empty">
            <mat-icon>notifications_none</mat-icon>
            <p>You're all caught up!</p>
          </div>
        } @else {
          @for (n of store.items(); track n.uuid) {
            <div class="nm-item" [class.nm-item--unread]="!n.isRead" (click)="onItemClick(n)">
              <div class="nm-item__icon nm-item__icon--{{ notifVariant(n.type) }}">
                <mat-icon>{{ notifIcon(n.type) }}</mat-icon>
              </div>
              <div class="nm-item__body">
                <p class="nm-item__title">{{ n.title }}</p>
                @if (n.body) {
                  <p class="nm-item__body-text">{{ n.body }}</p>
                }
                <span class="nm-item__time">{{ n.createdAt | date:'short' }}</span>
              </div>
              @if (!n.isRead) {
                <span class="nm-item__dot" matTooltip="Unread"></span>
              }
            </div>
          }
        }
      </div>

      <mat-divider />

      <!-- Footer -->
      <div class="nm-footer" (click)="$event.stopPropagation()">
        <a mat-button routerLink="/notifications" (click)="closeMenu()">View all</a>
      </div>
    </mat-menu>
  `,
  styles: [`
    @use '../../../../../../../styles/variables' as *;

    ::ng-deep .notif-menu .mat-mdc-menu-panel {
      max-width: 360px !important;
      min-width: 320px !important;
      border-radius: $radius-lg !important;
      overflow: hidden;
    }

    .nm-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: $spacing-sm $spacing-md;
    }
    .nm-title { font-weight: 600; font-size: $font-size-base; color: var(--text-primary); }
    .nm-mark-all { font-size: $font-size-sm; }

    .nm-list { max-height: 360px; overflow-y: auto; }

    .nm-item {
      display: flex; align-items: flex-start; gap: $spacing-sm;
      padding: $spacing-sm $spacing-md; cursor: pointer;
      transition: background .15s;
      &:hover { background: var(--surface-hover); }
      &--unread { background: var(--surface-ground); }
    }

    .nm-item__icon {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      &--info    { background: var(--status-info-bg);    color: var(--status-info-text); }
      &--success { background: var(--status-success-bg); color: var(--status-success-text); }
      &--warning { background: var(--status-warning-bg); color: var(--status-warning-text); }
      &--danger  { background: var(--status-danger-bg);  color: var(--status-danger-text); }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .nm-item__body { flex: 1; min-width: 0; }
    .nm-item__title {
      font-size: $font-size-sm; font-weight: 500; color: var(--text-primary);
      margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .nm-item__body-text {
      font-size: 12px; color: var(--text-secondary); margin: 2px 0 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .nm-item__time { font-size: 11px; color: var(--text-muted); }
    .nm-item__dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--color-primary); flex-shrink: 0; margin-top: 4px;
    }

    .nm-empty {
      display: flex; flex-direction: column; align-items: center;
      padding: $spacing-xl $spacing-md; color: var(--text-muted);
      mat-icon { font-size: 40px; width: 40px; height: 40px; }
      p { margin: $spacing-xs 0 0; font-size: $font-size-sm; }
    }

    .nm-footer { display: flex; justify-content: center; padding: $spacing-xs 0; }

    // Skeletons
    .nm-skeleton { display: flex; gap: $spacing-sm; padding: $spacing-sm $spacing-md; }
    .nm-sk-icon  { width: 36px; height: 36px; border-radius: 50%; background: var(--surface-hover); flex-shrink: 0; }
    .nm-sk-body  { flex: 1; display: flex; flex-direction: column; gap: 6px; justify-content: center; }
    .nm-sk-line  {
      height: 12px; border-radius: 4px; background: var(--surface-hover);
      animation: pulse 1.4s ease-in-out infinite;
      &--short { width: 60%; }
    }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .4 } }
  `],
})
export class NotificationBellComponent implements OnInit {
  readonly store = inject(NotificationStore);
  private  readonly router = inject(Router);

  readonly notifIcon    = notifIcon;
  readonly notifVariant = notifVariant;
  readonly skeletons    = Array(3);

  private _menuOpen = signal(false);

  ngOnInit(): void {
    this.store.startPolling();
  }

  onOpen(): void {
    this._menuOpen.set(true);
    this.store.load({ page: 1 });
  }

  onItemClick(n: { uuid: string; isRead: boolean; actionUrl: string | null }): void {
    if (!n.isRead) this.store.markRead(n.uuid);
    if (n.actionUrl) this.router.navigateByUrl(n.actionUrl);
  }

  closeMenu(): void { this._menuOpen.set(false); }
}
