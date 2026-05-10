import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive }        from '@angular/router';
import { NgClass, NgTemplateOutlet }           from '@angular/common';
import { MatIconModule }   from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule }from '@angular/material/tooltip';
import { UiStore }         from '../../core/store/ui.store';
import { AuthService }     from '../../core/services/auth.service';
import { NAV_ITEMS }       from '../../core/config/navigation.config';
import { NavItem }         from '../../core/models/ui.models';
import { AppStore }        from '../../core/store/app.store';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, NgTemplateOutlet, MatIconModule, MatRippleModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl:    './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly ui   = inject(UiStore);
  private readonly auth = inject(AuthService);
  readonly app          = inject(AppStore);

  readonly isOpen      = this.ui.sidebarOpen;
  readonly expandedGroups = signal<Set<string>>(new Set());

  readonly navItems = computed<NavItem[]>(() => {
    const user = this.auth.user();
    if (!user) return [];
    return this.filterNavItems(NAV_ITEMS, user.roles, user.permissions);
  });

  toggleGroup(label: string): void {
    this.expandedGroups.update((set) => {
      const next = new Set(set);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  isExpanded(label: string): boolean {
    return this.expandedGroups().has(label);
  }

  trackByLabel(_: number, item: NavItem): string {
    return item.label;
  }

  private filterNavItems(items: NavItem[], roles: string[], perms: string[]): NavItem[] {
    const isSuperAdmin = roles.includes('super_admin');

    return items.filter((item) => {
      if (isSuperAdmin) return true;
      if (item.roles?.length       && !item.roles.some((r) => roles.includes(r)))       return false;
      if (item.permissions?.length && !item.permissions.some((p) => perms.includes(p))) return false;
      return true;
    }).map((item) => ({
      ...item,
      children: item.children ? this.filterNavItems(item.children, roles, perms) : undefined,
    }));
  }
}
