/**
 * useFirstMount - Track if this is the first time a component is mounting in the session
 *
 * This hook uses sessionStorage to remember if a dashboard has been loaded before.
 * On the first mount, it returns true; on subsequent mounts (even after navigation),
 * it returns false. This prevents loading skeletons from flashing every time
 * the user navigates back to a page.
 */
import { useState, useEffect } from 'react';

// Module-level cache to avoid sessionStorage reads on every render
const loadedDashboards = new Set<string>();

// Initialize from sessionStorage on module load
if (typeof sessionStorage !== 'undefined') {
    try {
        const saved = sessionStorage.getItem('__loaded_dashboards__');
        if (saved) {
            JSON.parse(saved).forEach((id: string) => loadedDashboards.add(id));
        }
    } catch {
        // Ignore parse errors
    }
}

function saveToStorage() {
    if (typeof sessionStorage !== 'undefined') {
        try {
            sessionStorage.setItem('__loaded_dashboards__', JSON.stringify([...loadedDashboards]));
        } catch {
            // Ignore storage errors
        }
    }
}

/**
 * Returns true only on the first mount of a dashboard in this session.
 * Subsequent mounts (navigation, remounts) will return false.
 *
 * @param dashboardId Unique identifier for the dashboard (e.g., 'sales-insights')
 * @returns true if this is the first mount, false otherwise
 */
export function useFirstMount(dashboardId: string): boolean {
    const [isFirstMount] = useState(() => {
        if (loadedDashboards.has(dashboardId)) {
            return false;
        }
        loadedDashboards.add(dashboardId);
        saveToStorage();
        return true;
    });

    return isFirstMount;
}

/**
 * Hook to manage loading state that only shows on first mount.
 *
 * @param dashboardId Unique identifier for the dashboard
 * @param loadingDuration How long to show loading state on first mount (default: 800ms)
 * @returns isLoading state
 */
export function useFirstMountLoading(dashboardId: string, loadingDuration: number = 800): boolean {
    const isFirstMount = useFirstMount(dashboardId);
    const [isLoading, setIsLoading] = useState(isFirstMount);

    useEffect(() => {
        if (isFirstMount && isLoading) {
            const timer = setTimeout(() => setIsLoading(false), loadingDuration);
            return () => clearTimeout(timer);
        }
    }, [isFirstMount, isLoading, loadingDuration]);

    return isLoading;
}

export default useFirstMount;
