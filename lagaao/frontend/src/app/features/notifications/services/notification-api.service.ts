import { Injectable, inject } from '@angular/core';
import { Observable, map }   from 'rxjs';
import { ApiService }        from '../../../core/services/api.service';
import { NotificationRecord } from '../models/notification.models';
import { PaginatedResponse }  from '@shared/types/api-response.types';

export interface ListParams {
  page?:       number;
  limit?:      number;
  channel?:    string;
  type?:       string;
  unreadOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly api = inject(ApiService);

  list(params: ListParams = {}): Observable<PaginatedResponse<NotificationRecord>> {
    return this.api.get<NotificationRecord[]>('/notifications', params as any) as any;
  }

  unreadCount(): Observable<number> {
    return this.api.get<{ count: number }>('/notifications/unread-count').pipe(
      map((r) => r.data?.count ?? 0),
    );
  }

  markRead(uuid: string): Observable<NotificationRecord> {
    return this.api.patch<NotificationRecord>(`/notifications/${uuid}/read`, {}).pipe(
      map((r) => r.data!),
    );
  }

  markBulkRead(uuids: string[]): Observable<{ updated: number }> {
    return this.api.patch<{ updated: number }>('/notifications/mark-bulk-read', { uuids }).pipe(
      map((r) => r.data!),
    );
  }

  markAllRead(): Observable<{ updated: number }> {
    return this.api.patch<{ updated: number }>('/notifications/mark-all-read', {}).pipe(
      map((r) => r.data!),
    );
  }

  delete(uuid: string): Observable<void> {
    return this.api.delete<void>(`/notifications/${uuid}`).pipe(map(() => void 0));
  }
}
