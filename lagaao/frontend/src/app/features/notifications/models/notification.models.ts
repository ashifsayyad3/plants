export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export interface NotificationRecord {
  uuid:           string;
  type:           string;
  title:          string;
  body:           string | null;
  channel:        NotificationChannel;
  actionUrl:      string | null;
  notifiableType: string | null;
  notifiableId:   number | null;
  isRead:         boolean;
  readAt:         string | null;
  sentAt:         string | null;
  meta:           Record<string, unknown> | null;
  createdAt:      string;
}

export interface NotificationState {
  items:       NotificationRecord[];
  total:       number;
  page:        number;
  totalPages:  number;
  loading:     boolean;
  unreadCount: number;
}

// Maps notification type → Material icon name
export function notifIcon(type: string): string {
  const map: Record<string, string> = {
    'system':        'info',
    'alert':         'warning',
    'success':       'check_circle',
    'error':         'error',
    'message':       'chat',
    'file':          'attachment',
    'user':          'person',
    'payment':       'payments',
    'announcement':  'campaign',
  };
  return map[type] ?? 'notifications';
}

// Maps notification type → badge variant
export function notifVariant(type: string): string {
  const map: Record<string, string> = {
    'alert':   'warning',
    'error':   'danger',
    'success': 'success',
  };
  return map[type] ?? 'info';
}
