// =============================================================================
// Pagination Utilities - Shared helpers for paginated queries
// =============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/**
 * Parse and validate pagination parameters from raw query values.
 * Clamps limit to [1, maxLimit] and page to [1, ∞).
 */
export function parsePagination(
  rawPage: unknown,
  rawLimit: unknown,
  maxLimit: number = 100,
  defaultLimit: number = 20,
): PaginationParams {
  let page = typeof rawPage === 'string' ? parseInt(rawPage, 10) : (typeof rawPage === 'number' ? rawPage : 1);
  let limit = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : (typeof rawLimit === 'number' ? rawLimit : defaultLimit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}
