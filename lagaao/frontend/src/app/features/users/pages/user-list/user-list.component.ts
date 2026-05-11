import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule }   from '@angular/material/button';
import { MatIconModule }     from '@angular/material/icon';
import { MatMenuModule }     from '@angular/material/menu';
import { MatSelectModule }   from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }    from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule }  from '@angular/material/tooltip';
import { MatChipsModule }    from '@angular/material/chips';
import { DatePipe }          from '@angular/common';

import { UserStore }          from '../../store/user.store';
import { UiStore }            from '../../../../core/store/ui.store';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AvatarComponent }    from '../../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BulkActionToolbarComponent } from '../../components/bulk-action-toolbar/bulk-action-toolbar.component';
import { SkeletonComponent }  from '../../../dashboard/widgets/skeleton/skeleton.component';
import { TimeAgoPipe }        from '../../../../shared/pipes/time-ago.pipe';
import { TruncatePipe }       from '../../../../shared/pipes/truncate.pipe';
import { STATUS_CONFIG }      from '../../models/user.models';
import type { BadgeConfig }   from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatButtonModule, MatIconModule, MatMenuModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule, MatTooltipModule, MatChipsModule,
    StatusBadgeComponent, AvatarComponent, EmptyStateComponent, PageHeaderComponent,
    BulkActionToolbarComponent, SkeletonComponent, TimeAgoPipe, TruncatePipe,
  ],
  templateUrl: './user-list.component.html',
  styleUrl:    './user-list.component.scss',
})
export class UserListComponent implements OnInit, OnDestroy {
  readonly store  = inject(UserStore);
  readonly ui     = inject(UiStore);
  readonly router = inject(Router);

  readonly searchInput = signal('');
  readonly skeletonRows = Array(8).fill(null);

  readonly statusBadgeConfig: BadgeConfig = {
    active:   'success',
    inactive: 'neutral',
    banned:   'danger',
    pending:  'warning',
  };

  readonly statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'banned', label: 'Banned' },
  ];

  readonly pageActions = [
    {
      label: 'Add User', icon: 'person_add', color: 'primary' as const,
      action: () => this.router.navigate(['/users/create']),
    },
  ];

  ngOnInit(): void {
    this.ui.setPageTitle('Users');
    this.ui.setBreadcrumbs([{ label: 'Dashboard', url: '/' }, { label: 'Users', url: '/users' }]);
    this.store.loadUsers();
    this.store.loadRoles();
  }

  ngOnDestroy(): void {
    this.store.clearSelection();
  }

  onSearch(q: string): void {
    this.searchInput.set(q);
    this.store.setSearch(q);
  }

  onSort(col: string): void {
    const f = this.store.filter();
    const dir = f.sortBy === col && f.sortDir === 'ASC' ? 'DESC' : 'ASC';
    this.store.setSort(col, dir);
  }

  sortIcon(col: string): string {
    const f = this.store.filter();
    if (f.sortBy !== col) return 'unfold_more';
    return f.sortDir === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  navigateTo(uuid: string): void {
    this.router.navigate(['/users', uuid]);
  }
}
