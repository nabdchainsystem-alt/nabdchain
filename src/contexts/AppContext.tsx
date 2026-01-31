import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { COUNTRIES, DEFAULT_COUNTRY_CODE, CountryConfig, CurrencyConfig } from '../config/currency';
import { translations, type Language } from '../locales';

type Theme = 'light' | 'dark';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  userDisplayName: string;
  updateUserDisplayName: (name: string) => void;
  country: CountryConfig;
  updateCountry: (countryCode: string) => void;
  currency: CurrencyConfig;
  globalTags: string[];
  addGlobalTag: (tag: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app-language') as Language) || 'en';
  });
  const [userDisplayName, setUserDisplayName] = useState<string>(() => {
    return localStorage.getItem('app-user-display-name') || 'Alex';
  });

  const [country, setCountry] = useState<CountryConfig>(() => {
    const savedCode = localStorage.getItem('app-country-code');
    return COUNTRIES[savedCode || DEFAULT_COUNTRY_CODE] || COUNTRIES[DEFAULT_COUNTRY_CODE];
  });

  const [globalTags, setGlobalTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('app-global-tags');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // Update HTML class for Tailwind Dark Mode
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Persist theme preference
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Update HTML direction for RTL
    const root = window.document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
    localStorage.setItem('app-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-user-display-name', userDisplayName);
  }, [userDisplayName]);

  useEffect(() => {
    localStorage.setItem('app-global-tags', JSON.stringify(globalTags));
  }, [globalTags]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  }, []);

  const t = useCallback((key: string) => {
    return translations[language]?.[key] || key;
  }, [language]);

  const updateUserDisplayName = useCallback((name: string) => {
    setUserDisplayName(name);
  }, []);

  const updateCountry = useCallback((countryCode: string) => {
    if (COUNTRIES[countryCode]) {
      setCountry(COUNTRIES[countryCode]);
      localStorage.setItem('app-country-code', countryCode);
    }
  }, []);

  const addGlobalTag = useCallback((tag: string) => {
    setGlobalTags(prev => {
      if (prev.includes(tag)) return prev;
      return [...prev, tag];
    });
  }, []);

  // Memoize currency to prevent unnecessary re-renders
  const currency = useMemo(() => ({
    ...country.currency,
    // Use English symbol when in English mode if available
    symbol: language === 'en' && country.currency.symbolEn
      ? country.currency.symbolEn
      : country.currency.symbol
  }), [country.currency, language]);

  // Memoize the entire context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
    language,
    toggleLanguage,
    t,
    dir: language === 'ar' ? 'rtl' : 'ltr',
    userDisplayName,
    updateUserDisplayName,
    country,
    updateCountry,
    currency,
    globalTags,
    addGlobalTag
  }), [theme, toggleTheme, language, toggleLanguage, t, userDisplayName, updateUserDisplayName, country, updateCountry, currency, globalTags, addGlobalTag]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
