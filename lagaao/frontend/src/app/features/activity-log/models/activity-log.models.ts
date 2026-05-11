export interface ActivityLogRecord {
  id:          string;
  userId:      number | null;
  user:        { name: string; email: string } | null;
  action:      string;
  subjectType: string | null;
  subjectId:   number | null;
  oldValues:   Record<string, unknown> | null;
  newValues:   Record<string, unknown> | null;
  ipAddress:   string | null;
  userAgent:   string | null;
  requestId:   string | null;
  meta:        Record<string, unknown> | null;
  createdAt:   string;
}

export interface ActivityLogFilters {
  page:        number;
  limit:       number;
  search:      string;
  userId:      string;
  action:      string;
  subjectType: string;
  from:        string;
  to:          string;
}

// Format action string for display: 'user.create' → 'User Create'
export function formatAction(action: string): string {
  return action.split('.').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

// Map action prefix → color class
export function actionVariant(action: string): string {
  if (action.startsWith('api.delete')) return 'danger';
  if (action.startsWith('api.post') || action.includes('.create')) return 'success';
  if (action.startsWith('api.patch') || action.includes('.update')) return 'warning';
  return 'info';
}
