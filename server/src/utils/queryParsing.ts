// =============================================================================
// Query Parsing Utilities - Shared helpers for Express route handlers
// =============================================================================

/**
 * Safely extract a string from an Express query parameter value.
 * Handles the case where query params can be string | string[] | undefined.
 */
export function getQueryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/**
 * Parse a query parameter as an integer with a default fallback.
 */
export function parseQueryInt(value: unknown, defaultValue: number): number {
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  if (typeof value === 'number') return Math.floor(value);
  return defaultValue;
}
