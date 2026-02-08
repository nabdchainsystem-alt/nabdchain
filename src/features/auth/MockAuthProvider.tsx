import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

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
    const portalType = localStorage.getItem('portal_type');
    const portalUserId = localStorage.getItem('portal_user_id');

    if (token === 'master-token') {
      loginAsMaster();
    } else if (token === 'dev-token') {
      loginAsDev();
    } else if (token === 'google-token') {
      loginAsGoogle();
    } else if (token === 'sam-token') {
      loginAsSam();
    } else if (token === 'buyer-portal-token') {
      loginAsBuyer();
    } else if (token === 'seller-portal-token') {
      loginAsSeller();
    } else if (token && portalType && portalUserId) {
      // Handle real API tokens - user logged in via portal API
      if (portalType === 'buyer') {
        loginAsBuyerWithApiToken(portalUserId);
      } else if (portalType === 'seller') {
        loginAsSellerWithApiToken(portalUserId);
      }
    }
  }, []);

  const loginAsMaster = useCallback(() => {
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
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff`,
    });
    localStorage.setItem('mock_auth_token', 'master-token');
  }, []);

  const loginAsDev = useCallback(() => {
    setIsSignedIn(true);
    setUserData({
      id: 'user_developer_admin',
      fullName: 'Developer Admin',
      firstName: 'Developer',
      lastName: 'Admin',
      primaryEmailAddress: { emailAddress: 'master@nabdchain.com' },
      imageUrl: 'https://ui-avatars.com/api/?name=Developer+Admin&background=000&color=fff',
    });
    localStorage.setItem('mock_auth_token', 'dev-token');
  }, []);

  const loginAsGoogle = useCallback(() => {
    setIsSignedIn(true);
    // Simulate a realistic Google user found in the system
    setUserData({
      id: 'user_google_simulated',
      fullName: 'Google User',
      firstName: 'Google',
      lastName: 'User',
      primaryEmailAddress: { emailAddress: 'user@gmail.com' },
      imageUrl: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff',
    });
    localStorage.setItem('mock_auth_token', 'google-token');
  }, []);

  const loginAsSam = useCallback(() => {
    setIsSignedIn(true);
    setUserData({
      id: 'user_sam_master',
      fullName: 'Sam',
      firstName: 'Sam',
      lastName: '',
      primaryEmailAddress: { emailAddress: 'sam@nabdchain.com' },
      imageUrl: 'https://ui-avatars.com/api/?name=Sam&background=6366F1&color=fff',
    });
    localStorage.setItem('mock_auth_token', 'sam-token');
  }, []);

  const loginAsBuyer = useCallback(() => {
    setIsSignedIn(true);
    setUserData({
      id: 'user_portal_buyer',
      fullName: 'Portal Buyer',
      firstName: 'Portal',
      lastName: 'Buyer',
      primaryEmailAddress: { emailAddress: 'buy@nabdchain.com' },
      imageUrl: 'https://ui-avatars.com/api/?name=Portal+Buyer&background=3B82F6&color=fff',
    });
    localStorage.setItem('mock_auth_token', 'buyer-portal-token');
  }, []);

  const loginAsSeller = useCallback(() => {
    setIsSignedIn(true);
    setUserData({
      id: 'user_portal_seller',
      fullName: 'Portal Seller',
      firstName: 'Portal',
      lastName: 'Seller',
      primaryEmailAddress: { emailAddress: 'sell@nabdchain.com' },
      imageUrl: 'https://ui-avatars.com/api/?name=Portal+Seller&background=10B981&color=fff',
    });
    localStorage.setItem('mock_auth_token', 'seller-portal-token');
  }, []);

  const loginAsBuyerWithApiToken = useCallback((userId: string) => {
    setIsSignedIn(true);
    const email = localStorage.getItem('portal_user_email') || 'buyer@portal.com';
    const fullName = localStorage.getItem('portal_user_name') || 'Portal Buyer';
    setUserData({
      id: userId,
      fullName,
      firstName: fullName.split(' ')[0] || 'Portal',
      lastName: fullName.split(' ').slice(1).join(' ') || 'Buyer',
      primaryEmailAddress: { emailAddress: email },
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3B82F6&color=fff`,
    });
  }, []);

  const loginAsSellerWithApiToken = useCallback((userId: string) => {
    setIsSignedIn(true);
    const email = localStorage.getItem('portal_user_email') || 'seller@portal.com';
    const fullName = localStorage.getItem('portal_user_name') || 'Portal Seller';
    setUserData({
      id: userId,
      fullName,
      firstName: fullName.split(' ')[0] || 'Portal',
      lastName: fullName.split(' ').slice(1).join(' ') || 'Seller',
      primaryEmailAddress: { emailAddress: email },
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=10B981&color=fff`,
    });
  }, []);

  const signOut = useCallback(async () => {
    // Clear ALL user-related data from localStorage
    const keysToRemove = [
      'mock_auth_token',
      'nabd_dev_mode',
      'mock_user_name',
      'app-user-display-name',
      'app-active-workspace',
      'app-active-board',
      'app-active-view',
      'app-workspaces',
      'app-boards',
      'app-recently-visited',
      'app-page-visibility',
      'app-deleted-boards',
      'app-unsynced-boards',
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Clear any board-specific data (room-table-*, board-*)
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (key.startsWith('room-') || key.startsWith('board-')) {
        localStorage.removeItem(key);
      }
    });

    // Update state
    setIsSignedIn(false);
    setUserData(null);

    // Redirect on app subdomain
    const hostname = window.location.hostname;
    if (hostname === 'app.nabdchain.com') {
      setTimeout(() => {
        window.location.href = 'https://nabdchain.com';
      }, 0);
    } else {
      // Localhost - go to home
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);

  const getToken = useCallback(async () => {
    // For portal users, return the actual JWT token
    const portalToken = localStorage.getItem('portal_access_token');
    if (portalToken) {
      return portalToken;
    }
    // Fallback to mock token for non-portal users
    return localStorage.getItem('mock_auth_token');
  }, []);

  // Memoize the update function
  const updateUser = useCallback(async (params: { firstName?: string; lastName?: string }) => {
    setUserData((prev) => {
      if (!prev) return null;
      const newFirstName = params.firstName ?? prev.firstName;
      const newLastName = params.lastName ?? prev.lastName;
      const newFullName = [newFirstName, newLastName].filter(Boolean).join(' ');

      // Persist name changes to localStorage
      localStorage.setItem(
        'mock_user_name',
        JSON.stringify({
          firstName: newFirstName,
          lastName: newLastName,
          fullName: newFullName,
        }),
      );

      return {
        ...prev,
        firstName: newFirstName,
        lastName: newLastName,
        fullName: newFullName,
      };
    });
  }, []);

  // Construct user object with memoized update method
  const user: MockUser | null = useMemo(() => {
    if (!userData) return null;
    return {
      ...userData,
      update: updateUser,
    };
  }, [userData, updateUser]);

  const value = useMemo(
    () => ({
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
      loginAsSam,
    }),
    [isSignedIn, user, getToken, signOut, loginAsMaster, loginAsGoogle, loginAsSam],
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
};

export const useMockAuthContext = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuthContext must be used within a MockAuthProvider');
  }
  return context;
};
