import React, { createContext, useContext, useState, useEffect } from 'react';

// Types mimicking Clerk's return types roughly
interface MockUser {
    id: string;
    fullName: string;
    primaryEmailAddress: { emailAddress: string };
    imageUrl: string;
}

interface MockAuthContextType {
    isLoaded: boolean;
    isSignedIn: boolean;
    userId: string | null;
    sessionId: string | null;
    getToken: () => Promise<string | null>;
    signOut: () => Promise<void>;
    user: MockUser | null;
    signIn: () => void; // Helper for our mock login
}

const MockAuthContext = createContext<MockAuthContextType | null>(null);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [user, setUser] = useState<MockUser | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('mock_auth_token');
        if (token === 'master-token') {
            loginAsMaster();
        }
    }, []);

    const loginAsMaster = () => {
        setIsSignedIn(true);
        setUser({
            id: 'user_master_local_admin',
            fullName: 'Master Admin',
            primaryEmailAddress: { emailAddress: 'master@nabd.com' },
            imageUrl: 'https://ui-avatars.com/api/?name=Master+Admin&background=0D8ABC&color=fff'
        });
        localStorage.setItem('mock_auth_token', 'master-token');
    };

    const signOut = async () => {
        setIsSignedIn(false);
        setUser(null);
        localStorage.removeItem('mock_auth_token');
    };

    const getToken = async () => {
        return isSignedIn ? 'mock-jwt-token' : null;
    };

    const value = {
        isLoaded: true,
        isSignedIn,
        userId: user?.id || null,
        sessionId: isSignedIn ? 'mock-session-id' : null,
        getToken,
        signOut,
        user,
        signIn: loginAsMaster
    };

    return (
        <MockAuthContext.Provider value={value}>
            {children}
        </MockAuthContext.Provider>
    );
};

export const useMockAuthContext = () => {
    const context = useContext(MockAuthContext);
    if (!context) {
        throw new Error('useMockAuthContext must be used within a MockAuthProvider');
    }
    return context;
};
