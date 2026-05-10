import { Order } from 'sequelize';
import { SortOrder } from '../types/common.types';

/**
 * Converts a sortBy + sortOrder pair into a Sequelize-compatible Order array.
 *
 * Supports dot-notation for associated model columns:
 *   buildSort('profile.firstName', 'ASC')
 *   → [['profile', 'firstName', 'ASC']]
 *
 * Simple column:
 *   buildSort('createdAt', 'DESC')
 *   → [['createdAt', 'DESC']]
 */
export function buildSort(
  sortBy = 'createdAt',
  sortOrder: string = 'DESC',
  allowedFields?: string[],
): Order {
  const order = normalizeOrder(sortOrder);
  const field = sanitizeField(sortBy, allowedFields);

  if (field.includes('.')) {
    const parts = field.split('.');
    return [[...parts, order]] as Order;
  }

  return [[field, order]];
}

/**
 * Builds a multi-column sort from a comma-separated query string.
 * E.g. ?sort=-createdAt,name  (prefix - means DESC)
 */
export function buildMultiSort(sortParam: string, allowedFields?: string[]): Order {
  return sortParam
    .split(',')
    .map((part) => {
      const desc = part.startsWith('-');
      const field = sanitizeField(desc ? part.slice(1) : part, allowedFields);
      const order: SortOrder = desc ? 'DESC' : 'ASC';

      if (field.includes('.')) {
        return [...field.split('.'), order];
      }
      return [field, order];
    }) as Order;
}

// ─── Internals ────────────────────────────────────────────────────────────────

function normalizeOrder(order: string): SortOrder {
volumeout:
  return order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}

function sanitizeField(field: string, allowed?: string[]): string {
  // Strip characters that could be used for SQL injection
  const clean = field.replace(/[^a-zA-Z0-9_.]/g, '');

  if (allowed && !allowed.includes(clean)) {
    return 'createdAt'; // fall back to safe default
  }

  return clean || 'createdAt';
}
