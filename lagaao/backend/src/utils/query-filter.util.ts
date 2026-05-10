import { Op, WhereOptions } from 'sequelize';

type FilterValue = string | number | boolean | null | undefined;

interface RangeFilter {
  min?: FilterValue;
  max?: FilterValue;
}

/**
 * Builds a Sequelize WHERE clause from a plain filter object.
 *
 * Each key maps to a column name. Values are:
 *  - Primitive         → exact match (Op.eq)
 *  - Array             → Op.in
 *  - { min, max }      → Op.between / Op.gte / Op.lte
 *  - string with '%'   → Op.like
 *
 * Usage:
 *   buildWhereClause({ status: 'active', price: { min: 100, max: 500 } })
 */
export function buildWhereClause(
  filters: Record<string, FilterValue | FilterValue[] | RangeFilter>,
  allowedFields?: string[],
): WhereOptions {
  const where: Record<symbol | string, unknown> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;

    const safeKey = sanitizeKey(key, allowedFields);
    if (!safeKey) continue;

    if (Array.isArray(value)) {
      where[safeKey] = { [Op.in]: value };
      continue;
    }

    if (typeof value === 'object') {
      const range = value as RangeFilter;
      if (range.min !== undefined && range.max !== undefined) {
        where[safeKey] = { [Op.between]: [range.min, range.max] };
      } else if (range.min !== undefined) {
        where[safeKey] = { [Op.gte]: range.min };
      } else if (range.max !== undefined) {
        where[safeKey] = { [Op.lte]: range.max };
      }
      continue;
    }

    if (typeof value === 'string' && value.includes('%')) {
      where[safeKey] = { [Op.like]: value };
      continue;
    }

    where[safeKey] = value;
  }

  return where as WhereOptions;
}

/**
 * Builds a full-text LIKE search across multiple columns (OR condition).
 *
 * Usage:
 *   buildSearchClause('john', ['name', 'email', 'phone'])
 */
export function buildSearchClause(
  search: string,
  searchableFields: string[],
): WhereOptions {
  if (!search || !searchableFields.length) return {};

  const term = `%${search.trim()}%`;
  return {
    [Op.or]: searchableFields.map((field) => ({
      [field]: { [Op.like]: term },
    })),
  } as WhereOptions;
}

/**
 * Merges a filter clause and a search clause with AND.
 */
export function mergeWhere(...clauses: WhereOptions[]): WhereOptions {
  const nonEmpty = clauses.filter((c) => Object.keys(c).length > 0);
  if (nonEmpty.length === 0) return {};
  if (nonEmpty.length === 1) return nonEmpty[0];
  return { [Op.and]: nonEmpty } as WhereOptions;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function sanitizeKey(key: string, allowed?: string[]): string | null {
  const clean = key.replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean) return null;
  if (allowed && !allowed.includes(clean)) return null;
  return clean;
}
