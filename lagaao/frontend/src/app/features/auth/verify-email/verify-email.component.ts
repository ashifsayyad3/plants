import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink }         from '@angular/router';
import { MatCardModule }     from '@angular/material/card';
import { MatButtonModule }   from '@angular/material/button';
import { MatIconModule }     from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService }       from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card" style="text-align:center; padding:32px 16px">
        @if (loading()) {
          <mat-spinner style="margin:0 auto 16px" />
          <p>Verifying your email…</p>
        } @else if (success()) {
          <mat-icon style="font-size:64px;width:64px;height:64px;color:#43a047">verified</mat-icon>
          <h2>Email Verified!</h2>
          <p>Your account is now active. You can sign in.</p>
          <button mat-raised-button color="primary" routerLink="/auth/login">Sign In</button>
        } @else {
          <mat-icon style="font-size:64px;width:64px;height:64px;color:#e53935">error</mat-icon>
          <h2>Verification Failed</h2>
          <p>{{ error() }}</p>
          <button mat-raised-button routerLink="/auth/login">Back to Login</button>
        }
      </mat-card>
    </div>
  `,
  styleUrl: '../login/login.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  private readonly auth  = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  loading = signal(true);
  success = signal(false);
  error   = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) { this.loading.set(false); this.error.set('No verification token provided.'); return; }

    this.auth.verifyEmail(token).subscribe({
      next:  () => { this.loading.set(false); this.success.set(true); },
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message ?? 'Verification failed.'); },
    });
  }
}
