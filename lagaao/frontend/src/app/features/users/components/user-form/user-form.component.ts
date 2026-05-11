import { Component, input, output, OnInit, OnChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatSelectModule }    from '@angular/material/select';
import { MatButtonModule }    from '@angular/material/button';
import { MatIconModule }      from '@angular/material/icon';
import { MatDividerModule }   from '@angular/material/divider';
import { UserRecord, RoleRef, CreateUserPayload, UpdateUserPayload } from '../../models/user.models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDividerModule,
  ],
  templateUrl: './user-form.component.html',
  styleUrl:    './user-form.component.scss',
})
export class UserFormComponent implements OnInit, OnChanges {
  readonly user    = input<UserRecord | null>(null);
  readonly roles   = input<RoleRef[]>([]);
  readonly saving  = input<boolean>(false);
  readonly isEdit  = input<boolean>(false);
  readonly saved   = output<CreateUserPayload | UpdateUserPayload>();
  readonly cancel  = output<void>();

  private readonly fb = inject(FormBuilder);
  form!: FormGroup;
  showPassword = false;

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(): void {
    if (this.form && this.user()) {
      this.patchForm();
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email:    ['', [Validators.required, Validators.email, Validators.maxLength(191)]],
      phone:    [null],
      status:   ['active', Validators.required],
      password: ['', this.isEdit() ? [] : [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      roleIds:  [[]],
    });

    if (this.user()) this.patchForm();

    if (this.isEdit()) {
      this.form.get('email')?.disable();
    }
  }

  private patchForm(): void {
    const u = this.user()!;
    this.form.patchValue({
      name:    u.name,
      email:   u.email,
      phone:   u.phone,
      status:  u.status,
      roleIds: u.roles.map((r) => r.id),
    });
  }

  private passwordStrengthValidator(ctrl: AbstractControl): { [key: string]: boolean } | null {
    const v = ctrl.value as string;
    if (!v) return null;
    if (!/[A-Z]/.test(v)) return { noUppercase: true };
    if (!/[a-z]/.test(v)) return { noLowercase: true };
    if (!/[0-9]/.test(v)) return { noNumber: true };
    return null;
  }

  get passwordError(): string {
    const c = this.form.get('password');
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required'])    return 'Password is required';
    if (c.errors['minlength'])   return 'At least 8 characters';
    if (c.errors['noUppercase']) return 'Add at least one uppercase letter';
    if (c.errors['noLowercase']) return 'Add at least one lowercase letter';
    if (c.errors['noNumber'])    return 'Add at least one number';
    return 'Invalid password';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (this.isEdit()) {
      this.saved.emit({ name: v.name, phone: v.phone || null } as UpdateUserPayload);
    } else {
      this.saved.emit({
        name: v.name, email: v.email, password: v.password,
        phone: v.phone || null, status: v.status, roleIds: v.roleIds,
      } as CreateUserPayload);
    }
  }
}
