import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router }     from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  AuthUser, AuthState, LoginRequest, RegisterRequest, AuthResponse,
} from '../models/auth.models';
import type { ApiResponse } from '../../../../../shared/types/api-response.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base   = `${environment.apiUrl}/auth`;

  // ─── Reactive State (signals) ─────────────────────────────────────────────

  private readonly _state = signal<AuthState>({
    user:        this.loadUser(),
    accessToken: this.loadToken(),
    isLoading:   false,
    isLoggedIn:  !!this.loadToken(),
  });

  readonly user        = computed(() => this._state().user);
  readonly accessToken = computed(() => this._state().accessToken);
  readonly isLoggedIn  = computed(() => this._state().isLoggedIn);
  readonly isLoading   = computed(() => this._state().isLoading);

  // Permission/role helpers
  hasRole       = (role: string)       => computed(() => this._state().user?.roles.includes(role) ?? false);
  hasPermission = (perm: string)       => computed(() => this._state().user?.permissions.includes(perm) ?? false);
  isSuperAdmin  = computed(()          => this._state().user?.roles.includes('super_admin') ?? false);

  // ─── API Calls ────────────────────────────────────────────────────────────

  login(dto: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    this.setLoading(true);
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/login`, dto, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.success && res.data) this.setSession(res.data);
      }),
      catchError((err) => { this.setLoading(false); return throwError(() => err); }),
    );
  }

  register(dto: RegisterRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/register`, dto);
  }

  refresh(): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/refresh`, {}, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.success && res.data) this.setSession(res.data);
      }),
    );
  }

  logout(): void {
    this.http.post(`${this.base}/logout`, {}, { withCredentials: true }).subscribe({
      complete: () => this.clearSession(),
      error:    () => this.clearSession(),
    });
  }

  forgotPassword(email: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string, confirmPassword: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/reset-password`, { token, password, confirmPassword });
  }

  verifyEmail(token: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/verify-email`, { token });
  }

  resendVerification(email: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/resend-verification`, { email });
  }

  getMe(): Observable<ApiResponse<AuthUser>> {
    return this.http.get<ApiResponse<AuthUser>>(`${this.base}/me`).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this._state.update((s) => ({ ...s, user: res.data! }));
          this.saveUser(res.data!);
        }
      }),
    );
  }

  // ─── Token Management ─────────────────────────────────────────────────────

  setAccessToken(token: string): void {
    this._state.update((s) => ({ ...s, accessToken: token }));
    sessionStorage.setItem('lagaao_at', token);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private setSession(data: AuthResponse): void {
    this._state.set({
      user:        data.user,
      accessToken: data.accessToken,
      isLoading:   false,
      isLoggedIn:  true,
    });
    sessionStorage.setItem('lagaao_at', data.accessToken);
    this.saveUser(data.user);
  }

  clearSession(): void {
    this._state.set({ user: null, accessToken: null, isLoading: false, isLoggedIn: false });
    sessionStorage.removeItem('lagaao_at');
    sessionStorage.removeItem('lagaao_user');
    this.router.navigate(['/auth/login']);
  }

  private setLoading(v: boolean): void {
    this._state.update((s) => ({ ...s, isLoading: v }));
  }

  private loadToken(): string | null {
    return sessionStorage.getItem('lagaao_at');
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem('lagaao_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch { return null; }
  }

  private saveUser(user: AuthUser): void {
    sessionStorage.setItem('lagaao_user', JSON.stringify(user));
  }
}
