import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/notification-center/notification-center.component').then(
        (m) => m.NotificationCenterComponent,
      ),
    data: { breadcrumb: 'Notifications' },
  },
];
