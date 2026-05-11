import { Injectable, inject } from '@angular/core';
import { Observable, map }   from 'rxjs';
import { ApiService }        from '../../../core/services/api.service';
import { ActivityLogRecord } from '../models/activity-log.models';

export interface ActivityLogListParams {
  page?:        number;
  limit?:       number;
  search?:      string;
  userId?:      number;
  action?:      string;
  subjectType?: string;
  from?:        string;
  to?:          string;
}

@Injectable({ providedIn: 'root' })
export class ActivityLogApiService {
  private readonly api = inject(ApiService);

  list(params: ActivityLogListParams = {}): Observable<any> {
    const clean: Record<string, any> = {};
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') clean[k] = v; });
    return this.api.get<ActivityLogRecord[]>('/activity-logs', clean) as any;
  }

  getById(id: string): Observable<ActivityLogRecord> {
    return this.api.get<ActivityLogRecord>(`/activity-logs/${id}`).pipe(map((r) => r.data!));
  }

  getSummary(days = 7): Observable<{ action: string; count: number }[]> {
    return this.api.get<{ action: string; count: number }[]>('/activity-logs/summary', { days }).pipe(
      map((r) => r.data ?? []),
    );
  }

  exportCsv(params: ActivityLogListParams = {}): Observable<Blob> {
    // Fetch up to 5000 rows then convert client-side
    return this.list({ ...params, page: 1, limit: 5000 }).pipe(
      map((res: any) => {
        const rows: ActivityLogRecord[] = res.data ?? [];
        const header = 'ID,User,Action,Subject,IP,Created At\n';
        const csv = rows.map((r) =>
          [r.id, r.user?.email ?? r.userId ?? '', r.action,
           `${r.subjectType ?? ''}:${r.subjectId ?? ''}`,
           r.ipAddress ?? '', r.createdAt].join(',')
        ).join('\n');
        return new Blob([header + csv], { type: 'text/csv' });
      }),
    );
  }
}
