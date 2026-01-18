import React, { createContext, useContext, useState, ReactNode, SetStateAction, Dispatch } from 'react';

interface UIContextType {
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: Dispatch<SetStateAction<boolean>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
    children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
        const saved = localStorage.getItem('app-sidebar-collapsed');
        return saved ? saved === 'true' : false;
    });

    React.useEffect(() => {
        localStorage.setItem('app-sidebar-collapsed', isSidebarCollapsed ? 'true' : 'false');
    }, [isSidebarCollapsed]);

    const value: UIContextType = {
        isSidebarCollapsed,
        setIsSidebarCollapsed
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

const noopSetter: Dispatch<SetStateAction<boolean>> = () => {};

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (!context) {
        return {
            isSidebarCollapsed: false,
            setIsSidebarCollapsed: noopSetter
        };
    }
    return context;
};
