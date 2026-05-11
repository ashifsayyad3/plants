export type UserStatus = 'active' | 'inactive' | 'banned' | 'pending';

export interface RoleRef {
  id:          number;
  name:        string;
  slug:        string;
  description: string | null;
  isSystem:    boolean;
}

export interface UserRecord {
  id:               number;
  uuid:             string;
  name:             string;
  email:            string;
  phone:            string | null;
  status:           UserStatus;
  emailVerifiedAt:  string | null;
  phoneVerifiedAt:  string | null;
  lastLoginAt:      string | null;
  lastLoginIp:      string | null;
  meta:             { avatarUrl?: string; [key: string]: unknown } | null;
  roles:            RoleRef[];
  createdAt:        string;
  updatedAt:        string;
  createdBy:        number | null;
}

export interface UserActivityLog {
  id:          number;
  action:      string;
  subjectType: string | null;
  subjectId:   number | null;
  oldValues:   Record<string, unknown> | null;
  newValues:   Record<string, unknown> | null;
  ipAddress:   string | null;
  createdAt:   string;
}

export interface UserListFilter {
  search:  string;
  status:  UserStatus | '';
  roleId:  number | '';
  sortBy:  string;
  sortDir: 'ASC' | 'DESC';
  page:    number;
  limit:   number;
}

export interface CreateUserPayload {
  name:     string;
  email:    string;
  password: string;
  phone?:   string | null;
  status:   UserStatus;
  roleIds?: number[];
}

export interface UpdateUserPayload {
  name?:  string;
  phone?: string | null;
}

export interface BulkActionPayload {
  uuids:  string[];
  action: 'activate' | 'deactivate' | 'ban' | 'delete';
}

export const STATUS_CONFIG: Record<UserStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  active:   { label: 'Active',    variant: 'success' },
  inactive: { label: 'Inactive',  variant: 'neutral' },
  banned:   { label: 'Banned',    variant: 'danger' },
  pending:  { label: 'Pending',   variant: 'warning' },
};
