/**
 * Export Formatters
 * Utility functions for formatting data in exports
 */

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

const CURRENCY_SYMBOLS: Record<string, string> = {
  SAR: 'SAR',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED',
  EGP: 'EGP',
};

const CURRENCY_DECIMALS: Record<string, number> = {
  SAR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  AED: 2,
  EGP: 2,
  JPY: 0,
  KWD: 3,
  BHD: 3,
};

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'SAR',
  options?: { showSymbol?: boolean; compact?: boolean }
): string {
  if (amount === null || amount === undefined) return '-';

  const { showSymbol = true, compact = false } = options || {};
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  let formatted: string;

  if (compact && Math.abs(amount) >= 1000000) {
    formatted = (amount / 1000000).toFixed(1) + 'M';
  } else if (compact && Math.abs(amount) >= 1000) {
    formatted = (amount / 1000).toFixed(1) + 'K';
  } else {
    formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return showSymbol ? `${symbol} ${formatted}` : formatted;
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

export function formatNumber(
  value: number | null | undefined,
  options?: { decimals?: number; compact?: boolean }
): string {
  if (value === null || value === undefined) return '-';

  const { decimals = 0, compact = false } = options || {};

  if (compact && Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (compact && Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercentage(
  value: number | null | undefined,
  options?: { decimals?: number; showSign?: boolean }
): string {
  if (value === null || value === undefined) return '-';

  const { decimals = 0, showSign = false } = options || {};

  // Handle values that might be in decimal form (0.15) or percentage form (15)
  const percentage = value > 1 ? value : value * 100;

  const formatted = percentage.toFixed(decimals);
  const sign = showSign && percentage > 0 ? '+' : '';

  return `${sign}${formatted}%`;
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

export function formatDate(
  date: Date | string | null | undefined,
  timezone: string = 'UTC',
  includeTime: boolean = false
): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return d.toLocaleDateString('en-US', options);
}

export function formatDateISO(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  return d.toISOString().split('T')[0];
}

export function formatDateTime(
  date: Date | string | null | undefined,
  timezone: string = 'UTC'
): string {
  return formatDate(date, timezone, true);
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatDaysUntil(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `${diffDays} days`;
}

// ============================================================================
// STATUS FORMATTING
// ============================================================================

export function formatStatus(status: string | null | undefined): string {
  if (!status) return '-';

  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getStatusCategory(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const categories: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    // Success statuses
    completed: 'success',
    delivered: 'success',
    paid: 'success',
    accepted: 'success',
    approved: 'success',
    settled: 'success',
    fulfilled: 'success',

    // Warning statuses
    pending: 'warning',
    pending_confirmation: 'warning',
    processing: 'warning',
    negotiating: 'warning',
    at_risk: 'warning',
    on_hold: 'warning',
    reviewing: 'warning',
    partially_paid: 'warning',

    // Error statuses
    failed: 'error',
    cancelled: 'error',
    rejected: 'error',
    overdue: 'error',
    critical: 'error',
    delayed: 'error',
    disputed: 'error',
    expired: 'error',

    // Info statuses
    shipped: 'info',
    confirmed: 'info',
    quoted: 'info',
    submitted: 'info',

    // Neutral statuses
    draft: 'neutral',
    new: 'neutral',
  };

  return categories[status.toLowerCase()] || 'neutral';
}

// ============================================================================
// ADDRESS FORMATTING
// ============================================================================

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export function formatAddressSingleLine(address: Address | null | undefined): string {
  if (!address) return '-';

  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
}

export function formatAddressMultiLine(address: Address | null | undefined): string {
  if (!address) return '-';

  const lines = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean);

  return lines.join('\n');
}

// ============================================================================
// PHONE FORMATTING
// ============================================================================

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Format Saudi numbers
  if (cleaned.startsWith('+966') || cleaned.startsWith('966')) {
    const digits = cleaned.replace(/^\+?966/, '');
    if (digits.length === 9) {
      return `+966 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
  }

  // Format US numbers
  if (cleaned.startsWith('+1') || (cleaned.length === 10 && !cleaned.startsWith('+'))) {
    const digits = cleaned.replace(/^\+?1/, '');
    if (digits.length === 10) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  }

  return phone;
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

export function truncate(text: string | null | undefined, maxLength: number = 50): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function capitalize(text: string | null | undefined): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function titleCase(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// FILE SIZE FORMATTING
// ============================================================================

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '-';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// ============================================================================
// DURATION FORMATTING
// ============================================================================

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '-';

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function formatLeadTime(days: number | null | undefined): string {
  if (days === null || days === undefined) return '-';

  if (days === 0) return 'Same day';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }

  const months = Math.floor(days / 30);
  return months === 1 ? '1 month' : `${months} months`;
}

// ============================================================================
// SCORING FORMATTING
// ============================================================================

export function formatScore(score: number | null | undefined, maxScore: number = 100): string {
  if (score === null || score === undefined) return '-';
  return `${score.toFixed(1)}/${maxScore}`;
}

export function formatRating(rating: number | null | undefined, maxRating: number = 5): string {
  if (rating === null || rating === undefined) return '-';
  return `${rating.toFixed(1)}/${maxRating}`;
}

export function getScoreCategory(score: number): 'excellent' | 'good' | 'average' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'poor';
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export function sanitizeForCSV(value: string | null | undefined): string {
  if (!value) return '';

  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  const escaped = value.replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

export function sanitizeForExcel(value: string | null | undefined): string {
  if (!value) return '';

  // Remove characters that could cause Excel formula injection
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

export function generateFileName(
  type: string,
  identifier: string,
  extension: string,
  date: Date = new Date()
): string {
  const dateStr = formatDateISO(date);
  const sanitizedId = identifier.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${type}_${sanitizedId}_${dateStr}.${extension}`;
}
