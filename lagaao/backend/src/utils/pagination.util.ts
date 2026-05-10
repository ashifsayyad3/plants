import { CONSTANTS } from '../config/constants';
import { PaginationMeta, PaginationOptions, PaginatedResult } from '../types/common.types';

/**
 * Converts raw page/limit from query params into Sequelize-ready offset + limit.
 */
export function buildPagination(
  page: number = CONSTANTS.PAGINATION.DEFAULT_PAGE,
  limit: number = CONSTANTS.PAGINATION.DEFAULT_LIMIT,
): PaginationOptions {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), CONSTANTS.PAGINATION.MAX_LIMIT);

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
}

/**
 * Builds the pagination meta block for API responses.
 */
export function buildPaginationMeta(
  total: number,
  options: PaginationOptions,
): PaginationMeta {
  const totalPages = Math.ceil(total / options.limit);

  return {
    page: options.page,
    limit: options.limit,
    total,
    totalPages,
    hasNextPage: options.page < totalPages,
    hasPrevPage: options.page > 1,
  };
}

/**
 * Combines rows + count into the standard PaginatedResult shape.
 * Pass the Sequelize { rows, count } result directly.
 */
export function toPaginatedResult<T>(
  rows: T[],
  count: number,
  options: PaginationOptions,
): PaginatedResult<T> {
  return {
    rows,
    meta: buildPaginationMeta(count, options),
  };
}
