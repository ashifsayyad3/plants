import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink }         from '@angular/router';
import { MatCardModule }              from '@angular/material/card';
import { MatFormFieldModule }         from '@angular/material/form-field';
import { MatInputModule }             from '@angular/material/input';
import { MatButtonModule }            from '@angular/material/button';
import { MatIconModule }              from '@angular/material/icon';
import { MatProgressSpinnerModule }   from '@angular/material/progress-spinner';
import { AuthService }                from '../../../core/services/auth.service';
import { HttpErrorResponse }          from '@angular/common/http';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pass    = control.get('password')?.value as string;
  const confirm = control.get('confirmPassword')?.value as string;
  return pass === confirm ? null : { passwordMismatch: true };
}

function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? '';
  const errors: Record<string, boolean> = {};
  if (!/[A-Z]/.test(v))        errors['noUppercase'] = true;
  if (!/[a-z]/.test(v))        errors['noLowercase'] = true;
  if (!/[0-9]/.test(v))        errors['noNumber']    = true;
  if (!/[^A-Za-z0-9]/.test(v)) errors['noSpecial']   = true;
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl:    './register.component.scss',
})
export class RegisterComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.nonNullable.group(
    {
      name:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           ['', [Validators.pattern(/^\+?[0-9]{7,15}$/)]],
      password:        ['', [Validators.required, Validators.minLength(8), strongPasswordValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  loading  = signal(false);
  error    = signal('');
  success  = signal(false);
  showPass = signal(false);

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.error.set('');

    const { confirmPassword: _removed, ...dto } = this.form.getRawValue();

    this.auth.register(dto).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }

  getPasswordStrength(): { label: string; color: string; width: string } {
    const v: string = this.form.controls.password.value ?? '';
    let score = 0;
    if (v.length >= 8)            score++;
    if (/[A-Z]/.test(v))         score++;
    if (/[0-9]/.test(v))         score++;
    if (/[^A-Za-z0-9]/.test(v))  score++;

    const map = [
      { label: '',        color: 'transparent', width: '0%'   },
      { label: 'Weak',    color: '#e53935',      width: '25%'  },
      { label: 'Fair',    color: '#fb8c00',      width: '50%'  },
      { label: 'Good',    color: '#43a047',      width: '75%'  },
      { label: 'Strong',  color: '#1b5e20',      width: '100%' },
    ];
    return map[score];
  }
}
