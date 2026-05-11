import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule }   from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SkeletonComponent }  from '../skeleton/skeleton.component';
import { AvatarComponent }    from '../../../../../shared/components/avatar/avatar.component';
import { TimeAgoPipe }        from '../../../../../shared/pipes/time-ago.pipe';
import { ActivityEntry }      from '../../models/dashboard.models';

const ACTION_ICON: Record<string, string> = {
  login:    'login',
  logout:   'logout',
  register: 'person_add',
  update:   'edit',
  delete:   'delete',
  create:   'add_circle',
  view:     'visibility',
};

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [DatePipe, MatIconModule, MatButtonModule, MatTooltipModule, SkeletonComponent, AvatarComponent, TimeAgoPipe],
  template: `
    <div class="feed-card">
      <div class="feed-card__header">
        <h3 class="feed-card__title">Recent Activity</h3>
        <button mat-stroked-button (click)="refresh.emit()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <div class="feed-card__list">
        @if (loading()) {
          @for (_ of skeletons; track $index) {
            <div class="feed-item feed-item--skeleton">
              <app-skeleton width="36px" height="36px" radius="50%" />
              <div class="feed-item__text">
                <app-skeleton height="14px" width="180px" />
                <app-skeleton height="11px" width="100px" />
              </div>
            </div>
          }
        } @else if (items().length === 0) {
          <p class="feed-card__empty">No recent activity.</p>
        } @else {
          @for (item of items(); track item.id) {
            <div class="feed-item">
              <div class="feed-item__icon" [attr.data-action]="item.action">
                <mat-icon>{{ actionIcon(item.action) }}</mat-icon>
              </div>
              <div class="feed-item__text">
                <span class="feed-item__action">
                  <strong>{{ item.user?.name ?? 'System' }}</strong>
                  · {{ item.action }} in {{ item.module }}
                </span>
                <span class="feed-item__meta"
                  [matTooltip]="item.createdAt | date:'medium'">
                  {{ item.createdAt | timeAgo }}
                  @if (item.ipAddress) { · {{ item.ipAddress }} }
                </span>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../../styles/variables' as *;

    .feed-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: $radius-lg;
      padding: $spacing-lg;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .feed-card__header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: $spacing-md;
    }
    .feed-card__title { margin: 0; font-size: $font-size-base; font-weight: 600; color: var(--text-primary); }
    .feed-card__empty { color: var(--text-muted); font-size: $font-size-sm; text-align: center; padding: $spacing-lg 0; }

    .feed-card__list {
      display: flex; flex-direction: column; gap: $spacing-sm;
      overflow-y: auto; flex: 1;
      max-height: 380px;
    }

    .feed-item {
      display: flex; align-items: center; gap: $spacing-sm;
      padding: $spacing-sm;
      border-radius: $radius-md;
      transition: background $transition-fast;
      &:hover { background: var(--surface-hover); }
    }
    .feed-item--skeleton { pointer-events: none; }

    .feed-item__icon {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(92,53,199,.1); color: var(--color-primary);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .feed-item__text { display: flex; flex-direction: column; min-width: 0; }
    .feed-item__action {
      font-size: $font-size-sm; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .feed-item__meta { font-size: 11px; color: var(--text-muted); }
  `],
})
export class ActivityFeedComponent {
  readonly items   = input<ActivityEntry[]>([]);
  readonly loading = input<boolean>(false);
  readonly refresh = output<void>();

  readonly skeletons = Array(6).fill(null);

  actionIcon(action: string): string {
    return ACTION_ICON[action.toLowerCase()] ?? 'radio_button_unchecked';
  }
}
