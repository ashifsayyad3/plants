import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule }     from '@angular/material/tabs';
import { MatButtonModule }   from '@angular/material/button';
import { MatIconModule }     from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }    from '@angular/material/input';
import { MatSelectModule }   from '@angular/material/select';
import { MatDividerModule }  from '@angular/material/divider';
import { MatChipsModule }    from '@angular/material/chips';
import { MatTooltipModule }  from '@angular/material/tooltip';
import { MatMenuModule }     from '@angular/material/menu';

import { UserApiService }    from '../../services/user-api.service';
import { ToastService }      from '../../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { UiStore }           from '../../../../core/store/ui.store';
import { UserAvatarComponent }    from '../../components/user-avatar/user-avatar.component';
import { RoleSelectorComponent }  from '../../components/role-selector/role-selector.component';
import { StatusBadgeComponent }   from '../../../../shared/components/status-badge/status-badge.component';
import { SkeletonComponent }      from '../../../dashboard/widgets/skeleton/skeleton.component';
import { TimeAgoPipe }            from '../../../../shared/pipes/time-ago.pipe';
import { UserRecord, UserActivityLog, RoleRef, STATUS_CONFIG } from '../../models/user.models';
import type { BadgeConfig } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    DatePipe, ReactiveFormsModule, RouterLink,
    MatTabsModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDividerModule, MatChipsModule,
    MatTooltipModule, MatMenuModule,
    UserAvatarComponent, RoleSelectorComponent, StatusBadgeComponent,
    SkeletonComponent, TimeAgoPipe, JsonPipe,
  ],
  templateUrl: './user-detail.component.html',
  styleUrl:    './user-detail.component.scss',
})
export class UserDetailComponent implements OnInit {
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly api     = inject(UserApiService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly ui      = inject(UiStore);
  private readonly fb      = inject(FormBuilder);

  readonly user          = signal<UserRecord | null>(null);
  readonly activity      = signal<UserActivityLog[]>([]);
  readonly roles         = signal<RoleRef[]>([]);
  readonly loading       = signal(true);
  readonly loadingActivity = signal(false);
  readonly saving        = signal(false);
  readonly savingRoles   = signal(false);
  readonly showPassword  = signal(false);

  form!: FormGroup;
  pwForm!: FormGroup;

  readonly statusBadgeConfig: BadgeConfig = {
    active: 'success', inactive: 'neutral', banned: 'danger', pending: 'warning',
  };

  readonly selectedRoleIds = signal<number[]>([]);

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid')!;
    this.buildForms();
    this.loadUser(uuid);
    this.loadActivity(uuid);
    this.api.getRoles().subscribe((r) => this.roles.set(r));
  }

  private buildForms(): void {
    this.form = this.fb.group({
      name:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      phone:  [null],
      status: ['active', Validators.required],
    });

    this.pwForm = this.fb.group({
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordsMatchValidator });
  }

  private passwordsMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  private loadUser(uuid: string): void {
    this.loading.set(true);
    this.api.getUser(uuid).subscribe({
      next: (u) => {
        this.user.set(u);
        this.selectedRoleIds.set(u.roles.map((r) => r.id));
        this.form.patchValue({ name: u.name, phone: u.phone, status: u.status });
        this.ui.setPageTitle(u.name);
        this.ui.setBreadcrumbs([
          { label: 'Dashboard', url: '/' },
          { label: 'Users', url: '/users' },
          { label: u.name, url: '' },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('User not found');
        this.router.navigate(['/users']);
      },
    });
  }

  private loadActivity(uuid: string): void {
    this.loadingActivity.set(true);
    this.api.getActivity(uuid).subscribe({
      next: (logs) => { this.activity.set(logs); this.loadingActivity.set(false); },
      error: () => this.loadingActivity.set(false),
    });
  }

  saveProfile(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const u = this.user()!;
    this.saving.set(true);
    const v = this.form.value;
    this.api.updateUser(u.uuid, { name: v.name, phone: v.phone }).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.saving.set(false);
        this.toast.success('Profile updated');
      },
      error: () => { this.saving.set(false); this.toast.error('Update failed'); },
    });
  }

  saveStatus(): void {
    const u = this.user()!;
    const status = this.form.get('status')?.value;
    this.saving.set(true);
    this.api.changeStatus(u.uuid, status).subscribe({
      next: (updated) => { this.user.set(updated); this.saving.set(false); this.toast.success('Status updated'); },
      error: () => { this.saving.set(false); this.toast.error('Status update failed'); },
    });
  }

  saveRoles(): void {
    const u = this.user()!;
    this.savingRoles.set(true);
    this.api.assignRoles(u.uuid, this.selectedRoleIds()).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.savingRoles.set(false);
        this.toast.success('Roles updated');
      },
      error: () => { this.savingRoles.set(false); this.toast.error('Role update failed'); },
    });
  }

  changePassword(): void {
    if (this.pwForm.invalid) { this.pwForm.markAllAsTouched(); return; }
    const u = this.user()!;
    this.saving.set(true);
    this.api.changePassword(u.uuid, this.pwForm.value.newPassword).subscribe({
      next: () => {
        this.pwForm.reset();
        this.saving.set(false);
        this.toast.success('Password changed');
      },
      error: () => { this.saving.set(false); this.toast.error('Password change failed'); },
    });
  }

  deleteUser(): void {
    const u = this.user()!;
    this.confirm.danger('Delete User', `Delete ${u.name}? This cannot be undone.`, 'Delete').subscribe((ok) => {
      if (!ok) return;
      this.api.deleteUser(u.uuid).subscribe({
        next: () => { this.toast.success('User deleted'); this.router.navigate(['/users']); },
        error: () => this.toast.error('Delete failed'),
      });
    });
  }

  onAvatarUpdated(url: string): void {
    this.user.update((u) => u ? { ...u, meta: { ...(u.meta ?? {}), avatarUrl: url } } : u);
  }
}
