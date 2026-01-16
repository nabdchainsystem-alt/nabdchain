import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    const [isImmersive, setIsImmersive] = useState(false);
    const [activePage, setActivePage] = useState('board');

    const value: NavigationContextType = {
        isImmersive,
        activePage,
        setActivePage
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = (): NavigationContextType => {
    const context = useContext(NavigationContext);
    if (!context) {
        return {
            isImmersive: false,
            activePage: 'board',
            setActivePage: () => {}
        };
    }
    return context;
};
