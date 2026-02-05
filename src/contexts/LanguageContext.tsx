import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useAppContext } from './AppContext';
import { getTranslation, type Language, type TranslationMap } from '../locales';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    // Get language from AppContext to keep them in sync
    const { language: appLanguage, toggleLanguage } = useAppContext();
    const language = appLanguage as Language;

    // setLanguage toggles the language via AppContext
    const setLanguage = useCallback((lang: Language) => {
        if (lang !== language) {
            toggleLanguage();
        }
    }, [language, toggleLanguage]);

    // Use getTranslation with safe fallback for missing keys
    const t = useCallback((key: string): string => getTranslation(language, key), [language]);

    // Note: Document direction is already handled by AppContext, no need to duplicate here

    const value = useMemo<LanguageContextType>(() => ({
        language,
        setLanguage,
        t,
        dir: language === 'ar' ? 'rtl' : 'ltr'
    }), [language, setLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        return {
            language: 'en',
            setLanguage: () => { },
            t: (k: string) => k,
            dir: 'ltr'
        };
    }
    return context;
};

// Re-export types for convenience
export type { Language, TranslationMap };
