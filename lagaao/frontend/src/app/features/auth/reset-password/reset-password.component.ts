import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule }          from '@angular/material/card';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatButtonModule }        from '@angular/material/button';
import { MatIconModule }          from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService }            from '../../../core/services/auth.service';
import { HttpErrorResponse }      from '@angular/common/http';

function passwordMatchValidator(c: AbstractControl): ValidationErrors | null {
  const pass    = c.get('password')?.value as string;
  const confirm = c.get('confirmPassword')?.value as string;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        @if (success()) {
          <mat-card-content class="success-state">
            <mat-icon class="success-icon" style="color:#43a047">check_circle</mat-icon>
            <h2>Password Reset</h2>
            <p>Your password has been changed successfully.</p>
            <button mat-raised-button color="primary" routerLink="/auth/login">Sign In</button>
          </mat-card-content>
        } @else {
          <mat-card-header>
            <mat-card-title>Reset Password</mat-card-title>
            <mat-card-subtitle>Enter your new password</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input matInput [type]="showPass() ? 'text' : 'password'" formControlName="password" />
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="showPass.set(!showPass())">
                  <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.controls.password.touched && form.controls.password.errors) {
                  <mat-error>Min 8 chars with uppercase, number &amp; special character</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm Password</mat-label>
                <input matInput [type]="showPass() ? 'text' : 'password'" formControlName="confirmPassword" />
                <mat-icon matPrefix>lock_reset</mat-icon>
                @if (form.errors?.['passwordMismatch'] && form.controls.confirmPassword.touched) {
                  <mat-error>Passwords do not match</mat-error>
                }
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="loading()">
                @if (loading()) { <mat-spinner diameter="20" /> } @else { Reset Password }
              </button>
            </form>
          </mat-card-content>
        }
      </mat-card>
    </div>
  `,
  styleUrl: '../login/login.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb    = inject(FormBuilder);
  private readonly auth  = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private token = '';
  form     = this.fb.nonNullable.group({
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });
  loading  = signal(false);
  error    = signal('');
  success  = signal(false);
  showPass = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.router.navigate(['/auth/forgot-password']);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { password, confirmPassword } = this.form.getRawValue();
    this.auth.resetPassword(this.token, password, confirmPassword).subscribe({
      next:  () => { this.loading.set(false); this.success.set(true); },
      error: (err: HttpErrorResponse) => { this.loading.set(false); this.error.set(err.error?.message ?? 'Failed'); },
    });
  }
}
