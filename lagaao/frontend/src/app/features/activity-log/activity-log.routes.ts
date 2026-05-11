import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ACTIVITY_LOG_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/activity-log-list/activity-log-list.component').then(
        (m) => m.ActivityLogListComponent,
      ),
    data: { breadcrumb: 'Activity Log' },
  },
];
