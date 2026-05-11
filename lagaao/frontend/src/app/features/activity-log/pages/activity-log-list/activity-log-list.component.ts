import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule }              from '@angular/forms';
import { MatIconModule }            from '@angular/material/icon';
import { MatButtonModule }          from '@angular/material/button';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule }       from '@angular/material/expansion';
import { DatePipe, JsonPipe }       from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ActivityLogApiService }   from '../../services/activity-log-api.service';
import { ActivityLogRecord, ActivityLogFilters, formatAction, actionVariant } from '../../models/activity-log.models';
import { PageHeaderComponent }     from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent }    from '../../../../shared/components/status-badge/status-badge.component';
import { ToastService }            from '../../../../core/services/toast.service';

@Component({
  selector: 'app-activity-log-list',
  standalone: true,
  imports: [
    FormsModule, DatePipe, JsonPipe,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatTooltipModule,
    MatProgressSpinnerModule, MatExpansionModule,
    PageHeaderComponent, StatusBadgeComponent,
  ],
  templateUrl: './activity-log-list.component.html',
  styleUrl: './activity-log-list.component.scss',
})
export class ActivityLogListComponent implements OnInit {
  private readonly api   = inject(ActivityLogApiService);
  private readonly toast = inject(ToastService);

  readonly loading     = signal(false);
  readonly exporting   = signal(false);
  readonly logs        = signal<ActivityLogRecord[]>([]);
  readonly total       = signal(0);
  readonly page        = signal(1);
  readonly totalPages  = signal(1);
  readonly expandedId  = signal<string | null>(null);

  readonly hasMore  = computed(() => this.page() < this.totalPages());
  readonly hasPrev  = computed(() => this.page() > 1);

  readonly formatAction  = formatAction;
  readonly actionVariant = actionVariant;

  filters: ActivityLogFilters = {
    page: 1, limit: 50,
    search: '', userId: '', action: '',
    subjectType: '', from: '', to: '',
  };

  private readonly search$ = new Subject<string>();

  readonly subjectTypes = [
    '', 'User', 'Role', 'File', 'Notification', 'Listing',
  ];

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.load(1));
    this.load();
  }

  load(page = this.filters.page): void {
    this.filters.page = page;
    this.loading.set(true);
    this.api.list({
      page:        this.filters.page,
      limit:       this.filters.limit,
      search:      this.filters.search     || undefined,
      userId:      this.filters.userId     ? +this.filters.userId : undefined,
      action:      this.filters.action     || undefined,
      subjectType: this.filters.subjectType || undefined,
      from:        this.filters.from       || undefined,
      to:          this.filters.to         || undefined,
    }).subscribe({
      next: (res: any) => {
        const meta = res.meta ?? {};
        this.logs.set(res.data ?? []);
        this.total.set(meta.total ?? 0);
        this.page.set(meta.page ?? 1);
        this.totalPages.set(meta.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => { this.toast.error('Failed to load activity logs'); this.loading.set(false); },
    });
  }

  onSearch(): void { this.search$.next(this.filters.search); }

  resetFilters(): void {
    this.filters = { page: 1, limit: 50, search: '', userId: '', action: '', subjectType: '', from: '', to: '' };
    this.load(1);
  }

  toggleExpand(id: string): void {
    this.expandedId.update((cur) => cur === id ? null : id);
  }

  exportCsv(): void {
    this.exporting.set(true);
    this.api.exportCsv({
      search: this.filters.search || undefined,
      userId: this.filters.userId ? +this.filters.userId : undefined,
      action: this.filters.action || undefined,
      subjectType: this.filters.subjectType || undefined,
      from: this.filters.from || undefined,
      to:   this.filters.to   || undefined,
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => { this.toast.error('Export failed'); this.exporting.set(false); },
    });
  }
}
