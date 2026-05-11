import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const FILES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/file-manager/file-manager.component').then(
        (m) => m.FileManagerComponent,
      ),
    data: { breadcrumb: 'File Manager' },
  },
];
