import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule }   from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule }  from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SkeletonComponent }   from '../skeleton/skeleton.component';
import { TimeAgoPipe }         from '../../../../shared/pipes/time-ago.pipe';
import { StatusBadgeComponent, BadgeVariant } from '../../../../shared/components/status-badge/status-badge.component';
import { NotificationEntry }   from '../../models/dashboard.models';

const TYPE_VARIANT: Record<string, BadgeVariant> = {
  info:    'info',
  success: 'success',
  warning: 'warning',
  error:   'danger',
};

const TYPE_ICON: Record<string, string> = {
  info:    'info',
  success: 'check_circle',
  warning: 'warning',
  error:   'error',
};

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [NgClass, MatIconModule, MatButtonModule, MatBadgeModule, MatTooltipModule,
            SkeletonComponent, TimeAgoPipe, StatusBadgeComponent],
  template: `
    <div class="notif-card">
      <div class="notif-card__header">
        <h3 class="notif-card__title">
          Notifications
          @if (unreadCount() > 0) {
            <span class="notif-card__badge">{{ unreadCount() }}</span>
          }
        </h3>
      </div>

      <div class="notif-card__list">
        @if (loading()) {
          @for (_ of skeletons; track $index) {
            <div class="notif-item notif-item--skeleton">
              <app-skeleton width="34px" height="34px" radius="50%" />
              <div class="notif-item__text">
                <app-skeleton height="14px" width="160px" />
                <app-skeleton height="11px" width="80px" />
              </div>
            </div>
          }
        } @else if (items().length === 0) {
          <p class="notif-card__empty">All caught up!</p>
        } @else {
          @for (n of items(); track n.id) {
            <div class="notif-item" [class.notif-item--unread]="!n.isRead" (click)="markRead.emit(n.id)">
              <div class="notif-item__icon" [attr.data-type]="n.type">
                <mat-icon>{{ typeIcon(n.type) }}</mat-icon>
              </div>
              <div class="notif-item__text">
                <span class="notif-item__title">{{ n.title }}</span>
                <span class="notif-item__body">{{ n.body }}</span>
                <span class="notif-item__meta">{{ n.createdAt | timeAgo }}</span>
              </div>
              <app-status-badge [value]="n.type" [config]="typeVariantMap" />
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .notif-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: $radius-lg;
      padding: $spacing-lg;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .notif-card__header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: $spacing-md;
    }
    .notif-card__title {
      margin: 0; font-size: $font-size-base; font-weight: 600; color: var(--text-primary);
      display: flex; align-items: center; gap: $spacing-sm;
    }
    .notif-card__badge {
      background: var(--color-primary); color: #fff;
      border-radius: $radius-full; font-size: 11px; font-weight: 700;
      padding: 1px 7px; line-height: 1.6;
    }
    .notif-card__empty { color: var(--text-muted); font-size: $font-size-sm; text-align: center; padding: $spacing-lg 0; }

    .notif-card__list {
      display: flex; flex-direction: column; gap: 2px;
      overflow-y: auto; flex: 1; max-height: 380px;
    }

    .notif-item {
      display: flex; align-items: flex-start; gap: $spacing-sm;
      padding: $spacing-sm;
      border-radius: $radius-md;
      cursor: pointer;
      transition: background $transition-fast;
      &:hover { background: var(--surface-hover); }
    }
    .notif-item--unread { background: rgba(92,53,199,.05); }
    .notif-item--skeleton { pointer-events: none; }

    .notif-item__icon {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      &[data-type="success"] { background: var(--status-success-bg); color: var(--status-success-text); }
      &[data-type="warning"] { background: var(--status-warning-bg); color: var(--status-warning-text); }
      &[data-type="error"]   { background: var(--status-danger-bg);  color: var(--status-danger-text); }
      &[data-type="info"]    { background: var(--status-info-bg);    color: var(--status-info-text); }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .notif-item__text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .notif-item__title { font-size: $font-size-sm; font-weight: 600; color: var(--text-primary); }
    .notif-item__body  { font-size: $font-size-sm; color: var(--text-secondary); }
    .notif-item__meta  { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  `],
})
export class NotificationPanelComponent {
  readonly items    = input<NotificationEntry[]>([]);
  readonly loading  = input<boolean>(false);
  readonly markRead = output<number>();

  readonly skeletons = Array(5).fill(null);

  readonly typeVariantMap = TYPE_VARIANT;

  unreadCount(): number {
    return this.items().filter((n) => !n.isRead).length;
  }

  typeIcon(type: string): string {
    return TYPE_ICON[type] ?? 'notifications';
  }
}
