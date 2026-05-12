import { Injectable, inject, signal, computed } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject, switchMap, takeUntil } from 'rxjs';
import { UserApiService } from '../services/user-api.service';
import { ToastService }   from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ExportService }  from '../../dashboard/services/export.service';
import { UserRecord, UserListFilter, BulkActionPayload, RoleRef } from '../models/user.models';
import { PaginationMeta } from '@shared/types/api-response.types';

const DEFAULT_FILTER: UserListFilter = {
  search: '', status: '', roleId: '', sortBy: 'createdAt', sortDir: 'DESC', page: 1, limit: 15,
};

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly api     = inject(UserApiService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly exportSvc = inject(ExportService);

  // ─── State ─────────────────────────────────────────────────────────────────
  private readonly _users        = signal<UserRecord[]>([]);
  private readonly _meta         = signal<PaginationMeta | null>(null);
  private readonly _filter       = signal<UserListFilter>({ ...DEFAULT_FILTER });
  private readonly _loading      = signal(false);
  private readonly _selected     = signal<Set<string>>(new Set());
  private readonly _roles        = signal<RoleRef[]>([]);

  // ─── Selectors ─────────────────────────────────────────────────────────────
  readonly users       = this._users.asReadonly();
  readonly meta        = this._meta.asReadonly();
  readonly filter      = this._filter.asReadonly();
  readonly loading     = this._loading.asReadonly();
  readonly roles       = this._roles.asReadonly();
  readonly selectedSet = this._selected.asReadonly();

  readonly selectedCount  = computed(() => this._selected().size);
  readonly selectedUuids  = computed(() => Array.from(this._selected()));
  readonly allSelected    = computed(() =>
    this._users().length > 0 && this._users().every((u) => this._selected().has(u.uuid)),
  );

  // ─── Search debounce ───────────────────────────────────────────────────────
  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$     = new Subject<void>();

  constructor() {
    this.searchInput$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((search) => {
      this._filter.update((f) => ({ ...f, search, page: 1 }));
      this.loadUsers();
    });
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  loadUsers(): void {
    this._loading.set(true);
    this.api.getUsers(this._filter()).subscribe({
      next: (res) => {
        this._users.set(res.data ?? []);
        this._meta.set(res.meta ?? null);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.toast.error('Failed to load users');
      },
    });
  }

  loadRoles(): void {
    this.api.getRoles().subscribe({
      next: (roles) => this._roles.set(roles),
    });
  }

  setSearch(q: string): void {
    this.searchInput$.next(q);
  }

  setFilter(partial: Partial<UserListFilter>): void {
    this._filter.update((f) => ({ ...f, ...partial, page: 1 }));
    this.loadUsers();
  }

  setPage(page: number): void {
    this._filter.update((f) => ({ ...f, page }));
    this.loadUsers();
  }

  setSort(sortBy: string, sortDir: 'ASC' | 'DESC'): void {
    this._filter.update((f) => ({ ...f, sortBy, sortDir, page: 1 }));
    this.loadUsers();
  }

  resetFilter(): void {
    this._filter.set({ ...DEFAULT_FILTER });
    this.loadUsers();
  }

  // ─── Selection ──────────────────────────────────────────────────────────────

  toggleRow(uuid: string): void {
    this._selected.update((s) => {
      const next = new Set(s);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  }

  toggleAll(): void {
    const current = this._selected();
    const all     = this._users();
    if (all.every((u) => current.has(u.uuid))) {
      this._selected.update((s) => { const n = new Set(s); all.forEach((u) => n.delete(u.uuid)); return n; });
    } else {
      this._selected.update((s) => { const n = new Set(s); all.forEach((u) => n.add(u.uuid)); return n; });
    }
  }

  clearSelection(): void {
    this._selected.set(new Set());
  }

  isSelected(uuid: string): boolean {
    return this._selected().has(uuid);
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  changeStatus(uuid: string, status: string, reason?: string): void {
    this.api.changeStatus(uuid, status, reason).subscribe({
      next: (updated) => {
        this._users.update((list) => list.map((u) => u.uuid === uuid ? updated : u));
        this.toast.success('User status updated');
      },
      error: () => this.toast.error('Failed to update status'),
    });
  }

  deleteUser(uuid: string): void {
    this.confirm.danger('Delete User', 'This will permanently remove the user. This action cannot be undone.', 'Delete').subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.deleteUser(uuid).subscribe({
        next: () => {
          this._users.update((list) => list.filter((u) => u.uuid !== uuid));
          this._meta.update((m) => m ? { ...m, total: m.total - 1 } : m);
          this.toast.success('User deleted');
        },
        error: () => this.toast.error('Failed to delete user'),
      });
    });
  }

  bulkAction(action: BulkActionPayload['action']): void {
    const uuids = this.selectedUuids();
    if (!uuids.length) return;

    const labels: Record<string, string> = {
      activate: 'activate', deactivate: 'deactivate', ban: 'ban', delete: 'permanently delete',
    };

    this.confirm.danger(
      'Bulk Action',
      `${uuids.length} user(s) will be ${labels[action]}d. Continue?`,
      action === 'delete' ? 'Delete All' : 'Confirm',
    ).subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.bulkAction({ uuids, action }).subscribe({
        next: (r) => {
          this.toast.success(`${r.affected} user(s) ${labels[action]}d`);
          this.clearSelection();
          this.loadUsers();
        },
        error: () => this.toast.error('Bulk action failed'),
      });
    });
  }

  exportCsv(): void {
    this.api.exportCsv(this._filter()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement('a'), { href: url, download: `users-${Date.now()}.csv` });
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success('Export started');
      },
      error: () => this.toast.error('Export failed'),
    });
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
