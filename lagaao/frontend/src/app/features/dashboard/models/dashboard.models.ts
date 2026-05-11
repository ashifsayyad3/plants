export interface KpiStats {
  totalUsers:          number;
  activeUsers:         number;
  pendingUsers:        number;
  newUsersToday:       number;
  newUsersThisWeek:    number;
  totalRoles:          number;
  totalNotifications:  number;
  unreadNotifications: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardCharts {
  userGrowth:     ChartDataPoint[];
  usersByStatus:  ChartDataPoint[];
  activityByType: ChartDataPoint[];
}

export interface ActivityEntry {
  id:        number;
  action:    string;
  module:    string;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id:    number;
    name:  string;
    email: string;
  } | null;
}

export interface NotificationEntry {
  id:        number;
  title:     string;
  body:      string;
  type:      string;
  channel:   string;
  isRead:    boolean;
  createdAt: string;
}

export interface DashboardState {
  stats:         KpiStats | null;
  charts:        DashboardCharts | null;
  activity:      ActivityEntry[];
  notifications: NotificationEntry[];
  loadingStats:         boolean;
  loadingCharts:        boolean;
  loadingActivity:      boolean;
  loadingNotifications: boolean;
  lastRefreshed: Date | null;
}

export interface KpiCardConfig {
  key:       keyof KpiStats;
  label:     string;
  icon:      string;
  color:     'primary' | 'success' | 'warning' | 'info';
  format?:   'number' | 'percent';
  deltaKey?: keyof KpiStats;
  deltaLabel?: string;
}
