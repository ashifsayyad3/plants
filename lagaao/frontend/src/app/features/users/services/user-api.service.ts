import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import {
  UserRecord, UserListFilter, CreateUserPayload, UpdateUserPayload,
  BulkActionPayload, UserActivityLog, RoleRef,
} from '../models/user.models';
import { PaginatedResponse } from '@shared/types/api-response.types';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly api     = inject(ApiService);
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ── List ──────────────────────────────────────────────────────────────────
  getUsers(filter: Partial<UserListFilter>): Observable<PaginatedResponse<UserRecord>> {
    const params: Record<string, string | number> = {};
    if (filter.page)    params['page']    = filter.page;
    if (filter.limit)   params['limit']   = filter.limit;
    if (filter.search)  params['search']  = filter.search;
    if (filter.status)  params['status']  = filter.status;
    if (filter.roleId)  params['roleId']  = filter.roleId;
    if (filter.sortBy)  params['sortBy']  = filter.sortBy;
    if (filter.sortDir) params['sortDir'] = filter.sortDir;
    return this.api.getPaginated<UserRecord>('/users', params);
  }

  // ── Single ────────────────────────────────────────────────────────────────
  getUser(uuid: string): Observable<UserRecord> {
    return this.api.get<UserRecord>(`/users/${uuid}`).pipe(map((r) => r.data!));
  }

  // ── Create ────────────────────────────────────────────────────────────────
  createUser(payload: CreateUserPayload): Observable<UserRecord> {
    return this.api.post<UserRecord>('/users', payload).pipe(map((r) => r.data!));
  }

  // ── Update ────────────────────────────────────────────────────────────────
  updateUser(uuid: string, payload: UpdateUserPayload): Observable<UserRecord> {
    return this.api.put<UserRecord>(`/users/${uuid}`, payload).pipe(map((r) => r.data!));
  }

  // ── Status ────────────────────────────────────────────────────────────────
  changeStatus(uuid: string, status: string, reason?: string): Observable<UserRecord> {
    return this.api.patch<UserRecord>(`/users/${uuid}/status`, { status, reason }).pipe(map((r) => r.data!));
  }

  // ── Password ──────────────────────────────────────────────────────────────
  changePassword(uuid: string, newPassword: string): Observable<void> {
    return this.api.patch<void>(`/users/${uuid}/password`, { newPassword }).pipe(map(() => void 0));
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  deleteUser(uuid: string): Observable<void> {
    return this.api.delete<void>(`/users/${uuid}`).pipe(map(() => void 0));
  }

  // ── Roles ─────────────────────────────────────────────────────────────────
  assignRoles(uuid: string, roleIds: number[]): Observable<UserRecord> {
    return this.api.put<UserRecord>(`/users/${uuid}/roles`, { roleIds }).pipe(map((r) => r.data!));
  }

  // ── Bulk ──────────────────────────────────────────────────────────────────
  bulkAction(payload: BulkActionPayload): Observable<{ affected: number }> {
    return this.api.post<{ affected: number }>('/users/bulk', payload).pipe(map((r) => r.data!));
  }

  // ── Activity ──────────────────────────────────────────────────────────────
  getActivity(uuid: string): Observable<UserActivityLog[]> {
    return this.api.get<UserActivityLog[]>(`/users/${uuid}/activity`).pipe(map((r) => r.data ?? []));
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  updateAvatar(uuid: string, avatarUrl: string): Observable<UserRecord> {
    return this.api.patch<UserRecord>(`/users/${uuid}/avatar`, { avatarUrl }).pipe(map((r) => r.data!));
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  exportCsv(filter: Partial<UserListFilter>): Observable<Blob> {
    const params = new HttpParams({ fromObject: filter as Record<string, string> });
    return this.http.get(`${this.baseUrl}/users/export`, { params, responseType: 'blob' });
  }

  // ── Roles dropdown ────────────────────────────────────────────────────────
  getRoles(): Observable<RoleRef[]> {
    return this.api.get<RoleRef[]>('/roles').pipe(map((r) => r.data ?? []));
  }
}
