import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface Translations {
    [key: string]: string;
}

interface TranslationMap {
    en: Translations;
    ar: Translations;
}

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
}

const translations: TranslationMap = {
    en: {},
    ar: {}
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');
    const t = (key: string): string => translations[language]?.[key] || key;

    // Update document direction and language capability
    React.useEffect(() => {
        const dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = language;
    }, [language]);

    const value: LanguageContextType = {
        language,
        setLanguage,
        t,
        dir: language === 'ar' ? 'rtl' : 'ltr'
    };

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
