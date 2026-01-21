/**
 * Shared formatting utilities
 * These functions are used across multiple components for consistent formatting
 */

/**
 * Format a timestamp or date string as a relative time string (e.g., "5m ago", "2h ago")
 * @param input - Unix timestamp (number) or ISO date string
 * @returns Formatted relative time string
 */
export const formatTimeAgo = (input: number | string, language: 'en' | 'ar' = 'en'): string => {
    const timestamp = typeof input === 'string' ? new Date(input).getTime() : input;
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);

    if (language === 'ar') {
        if (mins < 1) return 'الآن';
        if (mins < 60) return `منذ ${mins} د`;

        const hours = Math.floor(mins / 60);
        if (hours < 24) return `منذ ${hours} س`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `منذ ${days} ي`;

        const weeks = Math.floor(days / 7);
        if (days < 30) return `منذ ${weeks} أسابيع`;

        const months = Math.floor(days / 30);
        return `منذ ${months} أشهر`;
    }

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;

    const months = Math.floor(days / 30);
    return `${months}mo ago`;
};

/**
 * Extract person name from various formats (string, object, or array)
 * Used for displaying assignee names consistently across the app
 * @param person - Can be string, object with name/label, or array of people
 * @returns Formatted name string
 */
export const getPersonName = (person: unknown): string => {
    if (!person) return '';

    if (typeof person === 'string') return person;

    // Handle array of people (from 'people' column)
    if (Array.isArray(person)) {
        return person.map(p => {
            if (typeof p === 'string') return p;
            if (p && typeof p === 'object') {
                return (p as { name?: string; label?: string }).name ||
                    (p as { name?: string; label?: string }).label || '';
            }
            return '';
        }).filter(Boolean).join(', ');
    }

    // Handle object with name or label property
    if (typeof person === 'object' && person !== null) {
        const obj = person as { name?: string; label?: string };
        if (obj.name || obj.label) {
            return obj.name || obj.label || '';
        }
    }

    return '';
};

/**
 * Format a date string for display
 * @param dateStr - ISO date string or Date object
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
    dateStr: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
): string => {
    if (!dateStr) return '';

    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        return date.toLocaleDateString(undefined, options);
    } catch {
        return '';
    }
};

/**
 * Format a number with locale-specific formatting
 * @param value - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
    return value.toLocaleString();
};

/**
 * Format a number as currency
 * @param value - Amount to format
 * @param _currencyCode - ISO currency code (unused, kept for API compatibility)
 * @param currencySymbol - Symbol to display (e.g. $, ﷼)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, _currencyCode: string = 'USD', currencySymbol: string = '$'): string => {
    // Use the explicit symbol provided rather than relying on Intl.NumberFormat
    // which may use different symbols depending on browser locale
    const formattedNumber = value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return `${currencySymbol} ${formattedNumber}`;
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
};
