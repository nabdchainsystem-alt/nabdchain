import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

interface NavigationContextType {
  isImmersive: boolean;
  activePage: string;
  setActivePage: (page: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [isImmersive, _setIsImmersive] = useState(false);
  const [activePage, setActivePageState] = useState('board');

  const setActivePage = useCallback((page: string) => {
    setActivePageState(page);
  }, []);

  const value = useMemo<NavigationContextType>(
    () => ({
      isImmersive,
      activePage,
      setActivePage,
    }),
    [isImmersive, activePage, setActivePage],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    return {
      isImmersive: false,
      activePage: 'board',
      setActivePage: () => {},
    };
  }
  return context;
};
