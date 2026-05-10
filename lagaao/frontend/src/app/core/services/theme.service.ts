import { Injectable, signal, effect, inject } from '@angular/core';
import { StorageService } from './storage.service';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'lagaao_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);

  private readonly _theme = signal<Theme>(this.loadInitialTheme());

  readonly theme    = this._theme.asReadonly();
  readonly isDark   = () => this._theme() === 'dark';

  constructor() {
    // Persist theme and apply data-theme attribute on every change
    effect(() => {
      const t = this._theme();
      document.documentElement.setAttribute('data-theme', t);
      this.storage.set(STORAGE_KEY, t);
    });
  }

  toggle(): void {
    this._theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  set(theme: Theme): void {
    this._theme.set(theme);
  }

  private loadInitialTheme(): Theme {
    const stored = this.storage.get<Theme>(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    // Respect OS preference on first visit
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
