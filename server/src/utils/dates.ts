// =============================================================================
// Date Utilities - Shared date helpers for route handlers
// =============================================================================

import type { AnalyticsPeriod } from '../services/analyticsService';

/**
 * Convert a period string ('week' | 'month' | 'quarter' | 'year') to
 * an AnalyticsPeriod with current + previous date ranges.
 */
export function getPeriodDates(period: string): AnalyticsPeriod {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default: // 'month'
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - (now.getTime() - startDate.getTime()));

  return {
    period: period as AnalyticsPeriod['period'],
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  };
}

/**
 * Get the start date for a given period string, relative to now.
 * Useful when you only need startDate (not the full AnalyticsPeriod).
 */
export function getPeriodStartDate(period: 'week' | 'month' | 'quarter' | 'year'): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Safely parse a date query parameter string to a Date object.
 * Returns null if the value is falsy or not a valid date.
 */
export function parseDateParam(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
