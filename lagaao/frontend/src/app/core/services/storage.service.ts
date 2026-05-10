import { Injectable } from '@angular/core';

/**
 * Type-safe wrapper around localStorage/sessionStorage with JSON
 * serialisation and a graceful fallback when storage is unavailable
 * (e.g. private browsing with cookies blocked).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string, storage: 'local' | 'session' = 'local'): T | null {
    try {
      const raw = this.store(storage).getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
  }

  set(key: string, value: unknown, storage: 'local' | 'session' = 'local'): void {
    try { this.store(storage).setItem(key, JSON.stringify(value)); } catch { /* quota exceeded */ }
  }

  remove(key: string, storage: 'local' | 'session' = 'local'): void {
    try { this.store(storage).removeItem(key); } catch { /* noop */ }
  }

  clear(storage: 'local' | 'session' = 'local'): void {
    try { this.store(storage).clear(); } catch { /* noop */ }
  }

  private store(type: 'local' | 'session'): Storage {
    return type === 'local' ? localStorage : sessionStorage;
  }
}
