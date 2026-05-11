import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { UserApiService }  from '../../services/user-api.service';
import { ToastService }    from '../../../../core/services/toast.service';
import { UiStore }         from '../../../../core/store/ui.store';
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { RoleRef, CreateUserPayload } from '../../models/user.models';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, UserFormComponent],
  template: `
    <div class="create-page">
      <div class="create-page__header">
        <button mat-icon-button routerLink="/users"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1 class="create-page__title">Create User</h1>
          <p class="create-page__subtitle">Add a new user to the system</p>
        </div>
      </div>

      <div class="create-page__card">
        <app-user-form
          [roles]="roles()"
          [saving]="saving()"
          [isEdit]="false"
          (saved)="onCreate($any($event))"
          (cancel)="router.navigate(['/users'])" />
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../../styles/variables' as *;
    .create-page { padding: $spacing-lg; max-width: 720px; margin: 0 auto; }
    .create-page__header {
      display: flex; align-items: flex-start; gap: $spacing-sm; margin-bottom: $spacing-lg;
    }
    .create-page__title    { margin: 0; font-size: $font-size-xl; font-weight: 700; color: var(--text-primary); }
    .create-page__subtitle { margin: 4px 0 0; font-size: $font-size-sm; color: var(--text-muted); }
    .create-page__card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: $radius-lg;
      padding: $spacing-lg;
    }
  `],
})
export class UserCreateComponent implements OnInit {
  readonly router = inject(Router);
  private readonly api   = inject(UserApiService);
  private readonly toast = inject(ToastService);
  private readonly ui    = inject(UiStore);

  readonly roles  = signal<RoleRef[]>([]);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.ui.setPageTitle('Create User');
    this.ui.setBreadcrumbs([
      { label: 'Dashboard', url: '/' },
      { label: 'Users', url: '/users' },
      { label: 'Create', url: '' },
    ]);
    this.api.getRoles().subscribe((r) => this.roles.set(r));
  }

  onCreate(payload: CreateUserPayload): void {
    this.saving.set(true);
    this.api.createUser(payload).subscribe({
      next: (user) => {
        this.saving.set(false);
        this.toast.success('User created successfully');
        this.router.navigate(['/users', user.uuid]);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Failed to create user';
        this.toast.error(msg);
      },
    });
  }
}
