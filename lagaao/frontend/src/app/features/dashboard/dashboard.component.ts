import {
  Component, inject, OnInit, OnDestroy, signal, computed,
} from '@angular/core';
import { FormsModule }     from '@angular/forms';
import { DatePipe }        from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatMenuModule }   from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DashboardStore }           from './store/dashboard.store';
import { ExportService }            from './services/export.service';
import { UiStore }                  from '../../core/store/ui.store';
import { KpiCardComponent }         from './widgets/kpi-card/kpi-card.component';
import { ChartCardComponent }       from './widgets/chart-card/chart-card.component';
import { ActivityFeedComponent }    from './widgets/activity-feed/activity-feed.component';
import { NotificationPanelComponent } from './widgets/notification-panel/notification-panel.component';
import { SkeletonComponent }        from './widgets/skeleton/skeleton.component';
import { TimeAgoPipe }              from '../../shared/pipes/time-ago.pipe';
import { KpiCardConfig }            from './models/dashboard.models';

const KPI_CARDS: KpiCardConfig[] = [
  { key: 'totalUsers',     label: 'Total Users',     icon: 'people',           color: 'primary', deltaKey: 'newUsersToday',    deltaLabel: 'new today' },
  { key: 'activeUsers',    label: 'Active Users',    icon: 'verified_user',    color: 'success' },
  { key: 'newUsersThisWeek', label: 'New This Week', icon: 'person_add',       color: 'info' },
  { key: 'unreadNotifications', label: 'Unread Alerts', icon: 'notifications_active', color: 'warning' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule,
    KpiCardComponent, ChartCardComponent,
    ActivityFeedComponent, NotificationPanelComponent, SkeletonComponent,
    TimeAgoPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly store   = inject(DashboardStore);
  readonly ui      = inject(UiStore);
  readonly export  = inject(ExportService);

  readonly kpiCards  = KPI_CARDS;
  readonly searchQuery = signal('');

  readonly filteredActivity = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.store.activity();
    return this.store.activity().filter((a) =>
      a.action.toLowerCase().includes(q) ||
      a.module.toLowerCase().includes(q) ||
      (a.user?.name?.toLowerCase().includes(q) ?? false),
    );
  });

  ngOnInit(): void {
    this.ui.setPageTitle('Dashboard');
    this.ui.setBreadcrumbs([{ label: 'Dashboard', url: '/' }]);
    this.store.loadAll();
    this.store.startPolling();
  }

  ngOnDestroy(): void {
    this.store.stopPolling();
  }

  async exportActivity(): Promise<void> {
    const rows = this.filteredActivity().map((a) => ({
      Action:    a.action,
      Module:    a.module,
      User:      a.user?.name ?? 'System',
      Email:     a.user?.email ?? '',
      IP:        a.ipAddress ?? '',
      Timestamp: new Date(a.createdAt).toLocaleString(),
    }));
    await this.export.exportToExcel(rows, 'activity-log');
  }

  async exportActivityPdf(): Promise<void> {
    const rows = this.filteredActivity().map((a) => ({
      action:    a.action,
      module:    a.module,
      user:      a.user?.name ?? 'System',
      ip:        a.ipAddress ?? '',
      timestamp: new Date(a.createdAt).toLocaleString(),
    }));
    await this.export.exportToPdf(
      rows,
      [
        { header: 'Action',    dataKey: 'action' },
        { header: 'Module',    dataKey: 'module' },
        { header: 'User',      dataKey: 'user' },
        { header: 'IP',        dataKey: 'ip' },
        { header: 'Timestamp', dataKey: 'timestamp' },
      ],
      'activity-log',
      'Activity Log',
    );
  }
}
