import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../auth-adapter';
import { useAppContext } from '../contexts/AppContext';
import { userService } from '../services/userService';
import { serviceLogger } from '../utils/logger';

/**
 * Hook to sync user preferences (display name, etc.) with the server.
 * This bridges the gap between AppContext (which stores preferences)
 * and the authentication system (which provides the token).
 *
 * Usage: Call this hook once in a component that has access to both contexts.
 */
export function useUserPreferences() {
    const { getToken, isSignedIn, userId } = useAuth();
    const { userDisplayName, updateUserDisplayName } = useAppContext();
    const initialFetchDone = useRef(false);
    const lastSavedName = useRef<string | null>(null);

    // Fetch user preferences from server on sign-in
    useEffect(() => {
        if (!isSignedIn || initialFetchDone.current) return;

        const fetchUserProfile = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const profile = await userService.getProfile(token);

                // If server has a name, use it (server is source of truth)
                if (profile.name) {
                    updateUserDisplayName(profile.name);
                    lastSavedName.current = profile.name;
                } else if (userDisplayName && userDisplayName !== 'Alex') {
                    // If server has no name but we have a local one, push it to server
                    await userService.updateProfile(token, { name: userDisplayName });
                    lastSavedName.current = userDisplayName;
                }

                initialFetchDone.current = true;
            } catch (error) {
                serviceLogger.error('[useUserPreferences] Failed to fetch profile:', error);
                // Still mark as done to prevent retry loops
                initialFetchDone.current = true;
            }
        };

        fetchUserProfile();
    }, [isSignedIn, getToken, updateUserDisplayName, userDisplayName]);

    // Sync display name changes to server (debounced)
    const syncNameToServer = useCallback(async (name: string) => {
        if (!isSignedIn || name === lastSavedName.current) return;

        try {
            const token = await getToken();
            if (!token) return;

            await userService.updateProfile(token, { name });
            lastSavedName.current = name;
        } catch (error) {
            serviceLogger.error('[useUserPreferences] Failed to sync name:', error);
        }
    }, [isSignedIn, getToken]);

    // Watch for display name changes and sync to server
    useEffect(() => {
        if (!initialFetchDone.current || !isSignedIn) return;
        if (userDisplayName === lastSavedName.current) return;

        // Debounce the sync to avoid too many API calls
        const timeout = setTimeout(() => {
            syncNameToServer(userDisplayName);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [userDisplayName, syncNameToServer, isSignedIn]);

    // Reset state on sign out
    useEffect(() => {
        if (!isSignedIn) {
            initialFetchDone.current = false;
            lastSavedName.current = null;
        }
    }, [isSignedIn]);

    return {
        syncNameToServer
    };
}
