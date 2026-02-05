/**
 * Locale loader
 * Provides type-safe access to translations with safe fallbacks
 */
import enTranslations from './en.json';
import arTranslations from './ar.json';

export type Language = 'en' | 'ar';

export interface Translations {
    [key: string]: string;
}

export interface TranslationMap {
    en: Translations;
    ar: Translations;
}

export const translations: TranslationMap = {
    en: enTranslations,
    ar: arTranslations,
};

// Track reported missing keys to avoid duplicate warnings
const reportedMissingKeys = new Set<string>();

/**
 * Converts a translation key to human-readable text
 * Used as fallback when translation is missing
 * Examples:
 *   'buyer.orders.title' -> 'Title'
 *   'seller.workspace.noItems' -> 'No Items'
 *   'addProduct.productName' -> 'Product Name'
 */
const keyToReadable = (key: string): string => {
    // Get the last part of the key (after the last dot)
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];

    // Convert camelCase to Title Case with spaces
    // e.g., 'noOrdersDesc' -> 'No Orders Desc'
    return lastPart
        // Insert space before uppercase letters
        .replace(/([A-Z])/g, ' $1')
        // Replace underscores with spaces
        .replace(/_/g, ' ')
        // Trim and capitalize first letter of each word
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Get a translation with safe fallback
 * - Returns the translated string if found
 * - If not found, returns a human-readable version of the key (never the raw key)
 * - Logs warnings in development mode for missing translations
 */
export const getTranslation = (language: Language, key: string): string => {
    const translation = translations[language]?.[key];

    if (translation) {
        return translation;
    }

    // Log warning for missing translation in development (only once per key)
    if (import.meta.env?.DEV && !reportedMissingKeys.has(key)) {
        reportedMissingKeys.add(key);
        console.warn(`[i18n] Missing translation for key: "${key}" (${language})`);
    }

    // Return human-readable fallback instead of raw key
    return keyToReadable(key);
};

/**
 * Check if a translation key exists
 */
export const hasTranslation = (language: Language, key: string): boolean => {
    return key in translations[language];
};

/**
 * Get all missing translation keys for a given set of keys
 * Useful for validation and auditing
 */
export const getMissingKeys = (language: Language, keys: string[]): string[] => {
    return keys.filter(key => !hasTranslation(language, key));
};

export default translations;
