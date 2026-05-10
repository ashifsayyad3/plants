export interface Breadcrumb {
  label:     string;
  url?:      string;
  icon?:     string;
}

export interface NavItem {
  label:       string;
  icon:        string;
  route?:      string;
  children?:   NavItem[];
  roles?:      string[];
  permissions?: string[];
  badge?:      string | number;
  divider?:    boolean;
}

export interface TableColumn<T = unknown> {
  key:        string;
  header:     string;
  sortable?:  boolean;
  width?:     string;
  align?:     'left' | 'center' | 'right';
  type?:      'text' | 'date' | 'badge' | 'number' | 'currency' | 'boolean' | 'actions' | 'avatar';
  format?:    (value: unknown, row: T) => string;
  badgeConfig?: Record<string, { label: string; color: string }>;
}

export interface PageMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TableState<T> {
  rows:     T[];
  meta:     PageMeta | null;
  loading:  boolean;
  error:    string | null;
}
