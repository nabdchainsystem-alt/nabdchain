/**
 * Locale loader
 * Provides type-safe access to translations
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

export const getTranslation = (language: Language, key: string): string => {
    return translations[language]?.[key] || key;
};

export default translations;
