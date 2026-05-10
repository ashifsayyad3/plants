import { z } from 'zod';
import { CONSTANTS } from '../config/constants';

// ─── Primitives ───────────────────────────────────────────────────────────────

export const IdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID must be a positive integer')
    .transform(Number),
});

export const UuidParamSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
});

// ─── Pagination Query ─────────────────────────────────────────────────────────

export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default(String(CONSTANTS.PAGINATION.DEFAULT_PAGE))
    .transform(Number)
    .pipe(z.number().int().min(1, 'Page must be >= 1')),

  limit: z
    .string()
    .optional()
    .default(String(CONSTANTS.PAGINATION.DEFAULT_LIMIT))
    .transform(Number)
    .pipe(z.number().int().min(1).max(CONSTANTS.PAGINATION.MAX_LIMIT, `Limit must be <= ${CONSTANTS.PAGINATION.MAX_LIMIT}`)),
});

// ─── Sorting Query ────────────────────────────────────────────────────────────

export const SortQuerySchema = z.object({
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional().default('DESC'),
});

// ─── Combined List Query (pagination + sort + search) ────────────────────────

export const ListQuerySchema = PaginationQuerySchema.merge(SortQuerySchema).extend({
  search: z.string().trim().optional(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type IdParam = z.infer<typeof IdParamSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type SortQuery = z.infer<typeof SortQuerySchema>;
export type ListQuery = z.infer<typeof ListQuerySchema>;
