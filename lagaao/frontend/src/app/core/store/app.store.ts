import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * App-level store — cross-cutting state that doesn't belong to a specific module.
 * Feature-specific state lives in the feature's own store file.
 */
@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly auth = inject(AuthService);

  // ─── Notification badge count ─────────────────────────────────────────────
  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  setUnreadCount(n: number): void   { this._unreadCount.set(n); }
  decrementUnread(): void           { this._unreadCount.update((n) => Math.max(0, n - 1)); }
  clearUnread(): void               { this._unreadCount.set(0); }

  // ─── Online status ────────────────────────────────────────────────────────
  private readonly _isOnline = signal(navigator.onLine);
  readonly isOnline = this._isOnline.asReadonly();

  constructor() {
    window.addEventListener('online',  () => this._isOnline.set(true));
    window.addEventListener('offline', () => this._isOnline.set(false));
  }

  // ─── Derived state ────────────────────────────────────────────────────────
  readonly currentUser  = computed(() => this.auth.user());
  readonly isLoggedIn   = computed(() => this.auth.isLoggedIn());
  readonly isSuperAdmin = computed(() => this.auth.user()?.roles.includes('super_admin') ?? false);
  readonly isAdmin      = computed(() => {
    const roles = this.auth.user()?.roles ?? [];
    return roles.includes('admin') || roles.includes('super_admin');
  });
}
