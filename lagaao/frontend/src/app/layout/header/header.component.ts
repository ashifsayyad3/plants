import { Component, inject, computed } from '@angular/core';
import { RouterLink }          from '@angular/router';
import { MatIconModule }       from '@angular/material/icon';
import { MatButtonModule }     from '@angular/material/button';
import { MatMenuModule }       from '@angular/material/menu';
import { MatTooltipModule }    from '@angular/material/tooltip';
import { MatBadgeModule }      from '@angular/material/badge';
import { MatDividerModule }    from '@angular/material/divider';
import { UiStore }             from '../../core/store/ui.store';
import { AuthService }         from '../../core/services/auth.service';
import { ThemeService }        from '../../core/services/theme.service';
import { AppStore }            from '../../core/store/app.store';
import { NotificationBellComponent } from '../../features/notifications/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink, MatIconModule, MatButtonModule, MatMenuModule,
    MatTooltipModule, MatBadgeModule, MatDividerModule,
    NotificationBellComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl:    './header.component.scss',
})
export class HeaderComponent {
  readonly ui    = inject(UiStore);
  readonly auth  = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly app   = inject(AppStore);

  readonly user         = computed(() => this.auth.user());
  readonly userInitial  = computed(() => this.auth.user()?.name.charAt(0).toUpperCase() ?? '?');
  readonly unreadCount  = this.app.unreadCount;

  logout(): void { this.auth.logout(); }
}
