import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink }             from '@angular/router';
import { MatCardModule }          from '@angular/material/card';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatButtonModule }        from '@angular/material/button';
import { MatIconModule }          from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService }            from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        @if (submitted()) {
          <mat-card-content class="success-state">
            <mat-icon class="success-icon">forward_to_inbox</mat-icon>
            <h2>Check Your Email</h2>
            <p>If an account exists for <strong>{{ form.controls.email.value }}</strong>,
               a reset link has been sent.</p>
            <button mat-raised-button color="primary" routerLink="/auth/login">Back to Login</button>
          </mat-card-content>
        } @else {
          <mat-card-header>
            <mat-card-title>Forgot Password</mat-card-title>
            <mat-card-subtitle>Enter your email to receive a reset link</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email Address</mat-label>
                <input matInput type="email" formControlName="email" placeholder="you@example.com" />
                <mat-icon matPrefix>email</mat-icon>
                @if (form.controls.email.touched && form.controls.email.errors) {
                  <mat-error>Enter a valid email address</mat-error>
                }
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit"
                class="submit-btn" [disabled]="loading()">
                @if (loading()) { <mat-spinner diameter="20" /> }
                @else { Send Reset Link }
              </button>
            </form>
          </mat-card-content>
          <mat-card-actions class="auth-footer">
            <p><a routerLink="/auth/login">← Back to Login</a></p>
          </mat-card-actions>
        }
      </mat-card>
    </div>
  `,
  styleUrl: '../login/login.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  form      = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  loading   = signal(false);
  submitted = signal(false);

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.forgotPassword(this.form.controls.email.value).subscribe({
      next:     () => { this.loading.set(false); this.submitted.set(true); },
      error:    () => { this.loading.set(false); this.submitted.set(true); }, // same UX both ways
    });
  }
}
