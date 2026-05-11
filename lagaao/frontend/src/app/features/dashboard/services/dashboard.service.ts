import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  KpiStats, DashboardCharts, ActivityEntry, NotificationEntry,
} from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly api = inject(ApiService);

  getStats(): Observable<KpiStats> {
    return this.api.get<KpiStats>('/dashboard/stats').pipe(map((r) => r.data!));
  }

  getCharts(): Observable<DashboardCharts> {
    return this.api.get<DashboardCharts>('/dashboard/charts').pipe(map((r) => r.data!));
  }

  getActivity(limit = 20): Observable<ActivityEntry[]> {
    return this.api.get<ActivityEntry[]>('/dashboard/activity', { limit }).pipe(map((r) => r.data!));
  }

  getNotifications(limit = 10): Observable<NotificationEntry[]> {
    return this.api.get<NotificationEntry[]>('/dashboard/notifications', { limit }).pipe(map((r) => r.data!));
  }
}
