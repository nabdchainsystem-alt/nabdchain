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
    signIn: () => void; // Default helper
    loginAsGoogle: () => void;
    loginAsMaster: () => void;
}

const MockAuthContext = createContext<MockAuthContextType | null>(null);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [user, setUser] = useState<MockUser | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('mock_auth_token');
        if (token === 'master-token') {
            loginAsMaster();
        } else if (token === 'dev-token') {
            loginAsDev();
        } else if (token === 'google-token') {
            loginAsGoogle();
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

    const loginAsDev = () => {
        setIsSignedIn(true);
        setUser({
            id: 'user_developer_admin',
            fullName: 'Developer Admin',
            primaryEmailAddress: { emailAddress: 'master@nabdchain.com' },
            imageUrl: 'https://ui-avatars.com/api/?name=Developer+Admin&background=000&color=fff'
        });
        localStorage.setItem('mock_auth_token', 'dev-token');
    };

    const loginAsGoogle = () => {
        setIsSignedIn(true);
        // Simulate a realistic Google user found in the system
        setUser({
            id: 'user_google_simulated',
            fullName: 'Google User',
            primaryEmailAddress: { emailAddress: 'user@gmail.com' },
            imageUrl: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff'
        });
        localStorage.setItem('mock_auth_token', 'google-token');
    };

    const signOut = async () => {
        setIsSignedIn(false);
        setUser(null);
        localStorage.removeItem('mock_auth_token');
    };

    const getToken = async () => {
        return localStorage.getItem('mock_auth_token');
    };

    const value = {
        isLoaded: true,
        isSignedIn,
        userId: user?.id || null,
        sessionId: isSignedIn ? 'mock-session-id' : null,
        getToken,
        signOut,
        user,
        signIn: loginAsMaster,
        loginAsGoogle,
        loginAsMaster
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
