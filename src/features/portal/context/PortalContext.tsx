import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { getThemeStyles, ThemeStyles, Theme, Language } from '../../../theme/portalColors';
import { getTranslation, hasTranslation } from '../../../locales';
import { translations } from './translations';

type Direction = 'ltr' | 'rtl';

interface PortalContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  direction: Direction;
  t: (key: string) => string;
  styles: ThemeStyles;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

interface PortalProviderProps {
  children: ReactNode;
}

export const PortalProvider: React.FC<PortalProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('portal-language');
    return (saved as Language) || 'en';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('portal-theme');
    return (saved as Theme) || 'light';
  });

  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    const saved = localStorage.getItem('portal-sidebar-collapsed');
    return saved === 'true';
  });

  const [sidebarWidth, setSidebarWidthState] = useState<number>(() => {
    const saved = localStorage.getItem('portal-sidebar-width');
    return saved ? parseInt(saved, 10) : 224;
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem('portal-sidebar-collapsed', String(collapsed));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const newValue = !prev;
      localStorage.setItem('portal-sidebar-collapsed', String(newValue));
      return newValue;
    });
  }, []);

  const setSidebarWidth = useCallback((width: number) => {
    setSidebarWidthState(width);
    localStorage.setItem('portal-sidebar-width', String(width));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('portal-language', lang);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('portal-theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('portal-theme', newTheme);
      return newTheme;
    });
  }, []);

  // Use main translation system with portal-local fallback
  const t = useCallback(
    (key: string): string => {
      // First check main translation system (src/locales/en.json)
      if (hasTranslation(language, key)) {
        return getTranslation(language, key);
      }
      // Fallback to portal-local translations, then to main system's readable fallback
      return translations[language]?.[key] || getTranslation(language, key);
    },
    [language],
  );

  // Compute styles based on theme and language using smart theme getter
  const styles: ThemeStyles = useMemo(() => {
    return getThemeStyles(theme, language);
  }, [theme, language]);

  // Apply direction and theme to document
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [direction, language, theme]);

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      toggleTheme,
      direction,
      t,
      styles,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
      sidebarWidth,
      setSidebarWidth,
    }),
    [
      language,
      setLanguage,
      theme,
      setTheme,
      toggleTheme,
      direction,
      t,
      styles,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
      sidebarWidth,
      setSidebarWidth,
    ],
  );

  return <PortalContext.Provider value={contextValue}>{children}</PortalContext.Provider>;
};

export const usePortal = (): PortalContextType => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};

export default PortalContext;
