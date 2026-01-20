import React, { createContext, useContext, useState, useEffect } from 'react';

// Types mimicking Clerk's return types roughly
interface MockUser {
    id: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    primaryEmailAddress: { emailAddress: string };
    imageUrl: string;
    update: (params: { firstName?: string; lastName?: string }) => Promise<void>;
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
    loginAsSam: () => void;
}

const MockAuthContext = createContext<MockAuthContextType | null>(null);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSignedIn, setIsSignedIn] = useState(false);
    // Store data only, method attached effectively in render
    const [userData, setUserData] = useState<Omit<MockUser, 'update'> | null>(null);

    // Helper to get saved user name from localStorage (persists across refreshes)
    const getSavedUserName = (): { firstName?: string; lastName?: string; fullName?: string } | null => {
        const saved = localStorage.getItem('mock_user_name');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return null;
            }
        }
        return null;
    };

    useEffect(() => {
        const token = localStorage.getItem('mock_auth_token');
        if (token === 'master-token') {
            loginAsMaster();
        } else if (token === 'dev-token') {
            loginAsDev();
        } else if (token === 'google-token') {
            loginAsGoogle();
        } else if (token === 'sam-token') {
            loginAsSam();
        }
    }, []);

    const loginAsMaster = () => {
        setIsSignedIn(true);
        // Check for saved custom name
        const savedName = getSavedUserName();
        const firstName = savedName?.firstName ?? 'Master';
        const lastName = savedName?.lastName ?? 'Admin';
        const fullName = savedName?.fullName ?? [firstName, lastName].filter(Boolean).join(' ');

        setUserData({
            id: 'user_master_local_admin',
            fullName,
            firstName,
            lastName,
            primaryEmailAddress: { emailAddress: 'master@nabd.com' },
            imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff`
        });
        localStorage.setItem('mock_auth_token', 'master-token');
    };

    const loginAsDev = () => {
        setIsSignedIn(true);
        setUserData({
            id: 'user_developer_admin',
            fullName: 'Developer Admin',
            firstName: 'Developer',
            lastName: 'Admin',
            primaryEmailAddress: { emailAddress: 'master@nabdchain.com' },
            imageUrl: 'https://ui-avatars.com/api/?name=Developer+Admin&background=000&color=fff'
        });
        localStorage.setItem('mock_auth_token', 'dev-token');
    };

    const loginAsGoogle = () => {
        setIsSignedIn(true);
        // Simulate a realistic Google user found in the system
        setUserData({
            id: 'user_google_simulated',
            fullName: 'Google User',
            firstName: 'Google',
            lastName: 'User',
            primaryEmailAddress: { emailAddress: 'user@gmail.com' },
            imageUrl: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff'
        });
        localStorage.setItem('mock_auth_token', 'google-token');
    };

    const loginAsSam = () => {
        setIsSignedIn(true);
        setUserData({
            id: 'user_sam_master',
            fullName: 'Sam',
            firstName: 'Sam',
            lastName: '',
            primaryEmailAddress: { emailAddress: 'sam@nabdchain.com' },
            imageUrl: 'https://ui-avatars.com/api/?name=Sam&background=6366F1&color=fff'
        });
        localStorage.setItem('mock_auth_token', 'sam-token');
    };

    const signOut = async () => {
        // Clear token first
        localStorage.removeItem('mock_auth_token');

        // Redirect on app subdomain
        const hostname = window.location.hostname;
        if (hostname === 'app.nabdchain.com') {
            // Use href (Safari-compatible) with setTimeout to ensure it runs
            setTimeout(() => {
                window.location.href = 'https://nabdchain.com';
            }, 0);
            return;
        }

        // Only for localhost - update state
        setIsSignedIn(false);
        setUserData(null);
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const getToken = async () => {
        return localStorage.getItem('mock_auth_token');
    };

    // Construct user object with update method
    const user: MockUser | null = userData ? {
        ...userData,
        update: async (params: { firstName?: string; lastName?: string }) => {
            const newFirstName = params.firstName ?? userData.firstName;
            const newLastName = params.lastName ?? userData.lastName;
            const newFullName = [newFirstName, newLastName].filter(Boolean).join(' ');

            // Persist name changes to localStorage
            localStorage.setItem('mock_user_name', JSON.stringify({
                firstName: newFirstName,
                lastName: newLastName,
                fullName: newFullName
            }));

            setUserData(prev => prev ? ({
                ...prev,
                firstName: newFirstName,
                lastName: newLastName,
                fullName: newFullName
            }) : null);
        }
    } : null;

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
        loginAsMaster,
        loginAsSam
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
