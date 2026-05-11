import { NavItem } from '../models/ui.models';

/**
 * Central navigation configuration.
 * roles/permissions arrays control visibility — sidebar filters dynamically.
 * Add new feature routes here; the sidebar rebuilds automatically.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon:  'dashboard',
    route: '/',
  },
  {
    label: 'Listings',
    icon:  'storefront',
    route: '/listings',
    permissions: ['listings:read'],
  },
  {
    label: 'Users',
    icon:  'people',
    route: '/users',
    permissions: ['users:read'],
    roles: ['admin', 'super_admin'],
  },
  {
    label: 'Files',
    icon:  'folder',
    route: '/files',
  },
  {
    label: 'Notifications',
    icon:  'notifications',
    route: '/notifications',
  },
  { divider: true, label: '', icon: '' },
  {
    label: 'Administration',
    icon:  'admin_panel_settings',
    roles: ['admin', 'super_admin'],
    children: [
      { label: 'Roles',        icon: 'manage_accounts', route: '/admin/roles',       permissions: ['roles:read'] },
      { label: 'Permissions',  icon: 'security',        route: '/admin/permissions', permissions: ['permissions:read'] },
      { label: 'Settings',     icon: 'settings',        route: '/admin/settings',    permissions: ['settings:read'] },
      { label: 'Activity Log', icon: 'history',         route: '/admin/activity-log',permissions: ['activity_logs:read'] },
    ],
  },
];
