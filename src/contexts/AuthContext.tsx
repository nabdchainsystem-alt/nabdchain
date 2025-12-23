import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    homeView?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('auth_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, pass: string): Promise<boolean> => {
        setIsLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const normalizedEmail = email.toLowerCase().trim();
        const knownUsers: Record<string, { password: string; profile: User }> = {
            'master@nabd.com': {
                password: '1',
                profile: {
                    id: 'u-master',
                    name: 'Master User',
                    email: 'master@nabd.com',
                    avatar: 'https://ui-avatars.com/api/?name=Master+User&background=00c875&color=fff',
                    role: 'admin',
                    homeView: 'dashboard'
                }
            },
            'sales@smt-nabd.com': {
                password: '123',
                profile: {
                    id: 'u-sales',
                    name: 'Sales Factory Lead',
                    email: 'sales@smt-nabd.com',
                    avatar: 'https://ui-avatars.com/api/?name=Sales+Factory&background=0066ff&color=fff',
                    role: 'supplier_sales',
                    homeView: 'sales_factory'
                }
            }
        };

        const matchedUser = knownUsers[normalizedEmail];

        if (matchedUser && pass === matchedUser.password) {
            const newUser = { ...matchedUser.profile };
            setUser(newUser);
            localStorage.setItem('auth_user', JSON.stringify(newUser));
            if (newUser.homeView) {
                localStorage.setItem('app-active-view', newUser.homeView);
            }
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('auth_user');
        // Optional: Clear other app state if needed
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
