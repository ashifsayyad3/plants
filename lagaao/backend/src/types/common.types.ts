import { Request } from 'express';

// ─── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  rows: T[];
  meta: PaginationMeta;
}

// ─── Sorting ──────────────────────────────────────────────────────────────────
export type SortOrder = 'ASC' | 'DESC';

export interface SortOption {
  field: string;
  order: SortOrder;
}

// ─── Query Filtering ──────────────────────────────────────────────────────────
export interface FilterOperator {
  eq?: unknown;
  ne?: unknown;
  gt?: number | string;
  gte?: number | string;
  lt?: number | string;
  lte?: number | string;
  like?: string;
  in?: unknown[];
  between?: [unknown, unknown];
}

export type FilterMap = Record<string, FilterOperator | unknown>;

// ─── Request Extensions ───────────────────────────────────────────────────────
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  requestId?: string;
}

// ─── API Response Shape ───────────────────────────────────────────────────────
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
  requestId?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Sequelize Base Model Attributes ─────────────────────────────────────────
export interface BaseAttributes {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}
