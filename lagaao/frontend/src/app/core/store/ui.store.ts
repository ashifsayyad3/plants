import { Injectable, signal, computed } from '@angular/core';
import { Breadcrumb } from '../models/ui.models';

/**
 * UI Store — holds application-level UI state:
 *   - Global loading spinner overlay
 *   - Breadcrumb trail
 *   - Sidebar collapse state
 *
 * All state is signal-based (no NgRx/Observable overhead for simple UI state).
 */
@Injectable({ providedIn: 'root' })
export class UiStore {
  // ─── Loading ──────────────────────────────────────────────────────────────
  private readonly _loadingCount = signal(0);
  readonly isLoading = computed(() => this._loadingCount() > 0);

  showLoader(): void  { this._loadingCount.update((n) => n + 1); }
  hideLoader(): void  { this._loadingCount.update((n) => Math.max(0, n - 1)); }

  // ─── Breadcrumbs ──────────────────────────────────────────────────────────
  private readonly _breadcrumbs = signal<Breadcrumb[]>([]);
  readonly breadcrumbs = this._breadcrumbs.asReadonly();

  setBreadcrumbs(crumbs: Breadcrumb[]): void {
    this._breadcrumbs.set(crumbs);
  }

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  private readonly _sidebarOpen = signal(true);
  readonly sidebarOpen = this._sidebarOpen.asReadonly();

  toggleSidebar(): void      { this._sidebarOpen.update((v) => !v); }
  setSidebar(open: boolean): void { this._sidebarOpen.set(open); }

  // ─── Page title ───────────────────────────────────────────────────────────
  private readonly _pageTitle = signal('');
  readonly pageTitle = this._pageTitle.asReadonly();

  setPageTitle(title: string): void {
    this._pageTitle.set(title);
    document.title = title ? `${title} — Lagaao` : 'Lagaao';
  }
}
