import React from 'react';
import {
    ClerkProvider,
    SignedIn as ClerkSignedIn,
    SignedOut as ClerkSignedOut,
    useAuth as useClerkAuth,
    useUser as useClerkUser,
    RedirectToSignIn as ClerkRedirectToSignIn,
    useClerk as useClerkOriginal,
    useSignUp as useClerkSignUp,
    SignIn as ClerkSignIn,
    SignUp as ClerkSignUp
} from '@clerk/clerk-react';
import { MockAuthProvider, useMockAuthContext } from './features/auth/MockAuthProvider.tsx';

// Toggle this or control via ENV
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (USE_MOCK_AUTH) {
        return <MockAuthProvider>{children}</MockAuthProvider>;
    }

    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey) {
        throw new Error("Missing Publishable Key");
    }

    return (
        <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
            {children}
        </ClerkProvider>
    );
};

export const useAuth = () => {
    if (USE_MOCK_AUTH) {
        const { isLoaded, isSignedIn, userId, sessionId, getToken, signOut } = useMockAuthContext();
        return { isLoaded, isSignedIn, userId, sessionId, getToken, signOut };
    }
    return useClerkAuth();
};

export const useUser = () => {
    if (USE_MOCK_AUTH) {
        const { isLoaded, isSignedIn, user } = useMockAuthContext();
        return { isLoaded, isSignedIn, user };
    }
    return useClerkUser();
};

export const useClerk = () => {
    if (USE_MOCK_AUTH) {
        const { signOut } = useMockAuthContext();
        return { signOut, openSignIn: () => { } };
    }
    return useClerkOriginal();
};

export const useSignUp = () => {
    if (USE_MOCK_AUTH) {
        return {
            isLoaded: true,
            signUp: {
                create: async () => { },
                prepareEmailAddressVerification: async () => { },
                attemptEmailAddressVerification: async () => ({ status: 'complete', createdSessionId: 'mock-session' })
            },
            setActive: async () => { }
        };
    }
    return useClerkSignUp();
};

export const SignedIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (USE_MOCK_AUTH) {
        const { isSignedIn } = useMockAuthContext();
        return isSignedIn ? <>{children}</> : null;
    }
    return <ClerkSignedIn>{children}</ClerkSignedIn>;
};

export const SignedOut: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (USE_MOCK_AUTH) {
        const { isSignedIn } = useMockAuthContext();
        return !isSignedIn ? <>{children}</> : null;
    }
    return <ClerkSignedOut>{children}</ClerkSignedOut>;
};

// SignIn Component
export const SignIn: React.FC<any> = (props) => {
    if (USE_MOCK_AUTH) {
        return <MockSignIn />;
    }
    return <ClerkSignIn {...props} />;
};

// SignUp Component
export const SignUp: React.FC<any> = (props) => {
    if (USE_MOCK_AUTH) {
        return (
            <div className="p-8 text-center border rounded bg-white">
                <h2 className="text-xl font-bold mb-4">Sign Up</h2>
                <p>Sign Up is disabled in Mock Mode.</p>
                <p className="text-sm text-gray-500 mt-2">Use the pre-configured Master Account.</p>
            </div>
        );
    }
    return <ClerkSignUp {...props} />;
};

export const RedirectToSignIn: React.FC = () => {
    if (USE_MOCK_AUTH) {
        return null;
    }
    return <ClerkRedirectToSignIn />;
}

// Mock SignIn Component for local dev
export const MockSignIn: React.FC = () => {
    const { signIn } = useMockAuthContext();
    return (
        <div className="flex flex-col items-center gap-4 p-8 border rounded-lg shadow-md bg-white w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800">Sign in to NabdChain</h2>
            <div className="text-sm text-gray-500 mb-4">Development Environment</div>

            <div className="w-full bg-yellow-50 border border-yellow-200 rounded p-3 mb-2">
                <p className="text-xs text-yellow-800 font-semibold mb-1">Dev Account:</p>
                <p className="text-sm text-gray-800">master@nabd.com</p>
            </div>

            <button
                onClick={signIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium bg-white"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
            </button>

            <div className="relative w-full py-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
            </div>

            <button
                onClick={signIn}
                className="w-full px-4 py-3 bg-[#333333] text-white font-medium rounded hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
                <span>Continue Development</span>
                <span className="text-xs opacity-75">→</span>
            </button>
        </div>
    );
};
