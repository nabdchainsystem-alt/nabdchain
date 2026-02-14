// =============================================================================
// Portal Formatters - Consolidated Helper Functions
// =============================================================================
// Centralized formatting utilities used across buyer and seller portals

/**
 * Format currency amount with proper locale formatting
 * @param amount - The numeric amount to format
 * @param currency - Currency code (e.g., 'SAR', 'USD')
 * @returns Formatted currency string (e.g., "SAR 1,234.56")
 */
export const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format price with currency symbol
 * @param price - The numeric price
 * @param currency - Currency code
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string = 'SAR'): string => {
  return formatCurrency(price, currency);
};

/**
 * Calculate price change between two values
 * @param original - Original price
 * @param current - Current price
 * @returns Object with amount, percentage, and direction
 */
export const calculatePriceChange = (
  original: number,
  current: number,
): { amount: number; percentage: number; isIncrease: boolean } => {
  const amount = current - original;
  const percentage = original > 0 ? ((current - original) / original) * 100 : 0;
  return {
    amount,
    percentage: Math.abs(percentage),
    isIncrease: amount > 0,
  };
};

/**
 * Format quantity with unit
 * @param quantity - Numeric quantity
 * @param unit - Unit of measurement (e.g., 'pcs', 'kg')
 * @returns Formatted quantity string
 */
export const formatQuantity = (quantity: number, unit: string = 'pcs'): string => {
  return `${quantity.toLocaleString()} ${unit}`;
};

/**
 * Format date to localized string
 * @param date - Date object or ISO string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
};

/**
 * Format percentage
 * @param value - Numeric value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format order/invoice number with padding
 * @param prefix - Prefix for the number (e.g., 'ORD', 'INV')
 * @param id - Numeric or string ID
 * @returns Formatted number string (e.g., "ORD-000123")
 */
export const formatDocumentNumber = (prefix: string, id: string | number): string => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  return `${prefix}-${numericId.toString().padStart(6, '0')}`;
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Format a timestamp with date and time
 * @param dateStr - ISO date string
 * @returns Formatted date + time string (e.g., "Jan 15, 2:30 PM"), or '-' if empty
 */
export const formatTimestamp = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
