/**
 * Prefetch and Preload Utilities
 * Predict user navigation and preload data/routes for instant transitions
 */

// Track prefetched URLs to avoid duplicate requests
const prefetchedUrls = new Set<string>();
const preloadedData = new Map<string, { data: unknown; timestamp: number }>();
const PRELOAD_CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Prefetch a route's JavaScript chunk
 * Use when user hovers over a navigation link
 */
export function prefetchRoute(routePath: string): void {
    // Map route paths to their chunk names
    const routeChunkMap: Record<string, () => Promise<unknown>> = {
        '/dashboard': () => import('../features/dashboard/Dashboard'),
        '/inbox': () => import('../features/inbox/InboxView'),
        '/vault': () => import('../features/vault/VaultView'),
        '/teams': () => import('../features/teams/TeamsPage'),
        '/settings': () => import('../features/settings/SettingsPage'),
        '/talk': () => import('../features/talk/TalkPage'),
    };

    const loader = routeChunkMap[routePath];
    if (loader && !prefetchedUrls.has(routePath)) {
        prefetchedUrls.add(routePath);
        // Use requestIdleCallback to not block main thread
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => {
                loader().catch(() => {
                    // Ignore prefetch errors
                    prefetchedUrls.delete(routePath);
                });
            });
        } else {
            setTimeout(() => {
                loader().catch(() => prefetchedUrls.delete(routePath));
            }, 100);
        }
    }
}

/**
 * Preload API data
 * Fetches data in advance so it's ready when the user navigates
 */
export async function preloadData<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; force?: boolean } = {}
): Promise<T> {
    const { ttl = PRELOAD_CACHE_TTL, force = false } = options;

    // Check cache
    if (!force) {
        const cached = preloadedData.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data as T;
        }
    }

    // Fetch and cache
    const data = await fetcher();
    preloadedData.set(key, { data, timestamp: Date.now() });
    return data;
}

/**
 * Get preloaded data if available
 */
export function getPreloadedData<T>(key: string): T | null {
    const cached = preloadedData.get(key);
    if (cached && Date.now() - cached.timestamp < PRELOAD_CACHE_TTL) {
        return cached.data as T;
    }
    return null;
}

/**
 * Clear preloaded data cache
 */
export function clearPreloadedData(key?: string): void {
    if (key) {
        preloadedData.delete(key);
    } else {
        preloadedData.clear();
    }
}

/**
 * Prefetch a URL (for images, fonts, etc.)
 */
export function prefetchUrl(url: string, as?: 'image' | 'font' | 'script' | 'style'): void {
    if (prefetchedUrls.has(url)) return;
    prefetchedUrls.add(url);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    if (as) link.as = as;
    document.head.appendChild(link);
}

/**
 * Preload a URL (higher priority than prefetch)
 */
export function preloadUrl(url: string, as: 'image' | 'font' | 'script' | 'style'): void {
    if (prefetchedUrls.has(`preload:${url}`)) return;
    prefetchedUrls.add(`preload:${url}`);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    if (as === 'font') {
        link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
}

/**
 * Preconnect to a domain (for API servers, CDNs)
 */
export function preconnect(origin: string): void {
    if (prefetchedUrls.has(`preconnect:${origin}`)) return;
    prefetchedUrls.add(`preconnect:${origin}`);

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Also add dns-prefetch as fallback
    const dnsLink = document.createElement('link');
    dnsLink.rel = 'dns-prefetch';
    dnsLink.href = origin;
    document.head.appendChild(dnsLink);
}

/**
 * Setup intelligent prefetching based on user behavior
 */
export function setupIntelligentPrefetch(): () => void {
    let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleMouseEnter = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const link = target.closest('a[href], [data-prefetch]');

        if (!link) return;

        const href = link.getAttribute('href') || link.getAttribute('data-prefetch');
        if (!href || href.startsWith('http') || href.startsWith('#')) return;

        // Wait 100ms before prefetching (in case user is just passing over)
        hoverTimeout = setTimeout(() => {
            prefetchRoute(href);
        }, 100);
    };

    const handleMouseLeave = () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
    };

    // Add listeners for hover-based prefetching
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    // Prefetch visible links using IntersectionObserver
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const link = entry.target as HTMLAnchorElement;
                    const href = link.getAttribute('href');
                    if (href && !href.startsWith('http') && !href.startsWith('#')) {
                        // Use requestIdleCallback to prefetch when browser is idle
                        if ('requestIdleCallback' in window) {
                            (window as any).requestIdleCallback(() => prefetchRoute(href));
                        }
                    }
                    observer.unobserve(link);
                }
            });
        },
        { rootMargin: '100px' }
    );

    // Observe all navigation links
    document.querySelectorAll('a[href^="/"]').forEach((link) => {
        observer.observe(link);
    });

    // Cleanup function
    return () => {
        document.removeEventListener('mouseenter', handleMouseEnter, true);
        document.removeEventListener('mouseleave', handleMouseLeave, true);
        observer.disconnect();
    };
}

/**
 * Preload critical data on app start
 */
export async function preloadCriticalData(
    token: string | null,
    fetchers: {
        workspaces?: () => Promise<unknown>;
        boards?: () => Promise<unknown>;
        user?: () => Promise<unknown>;
    }
): Promise<void> {
    if (!token) return;

    const promises: Promise<unknown>[] = [];

    if (fetchers.workspaces) {
        promises.push(
            preloadData('workspaces', fetchers.workspaces).catch(() => null)
        );
    }

    if (fetchers.boards) {
        promises.push(
            preloadData('boards', fetchers.boards).catch(() => null)
        );
    }

    if (fetchers.user) {
        promises.push(
            preloadData('user', fetchers.user).catch(() => null)
        );
    }

    await Promise.all(promises);
}

export const prefetcher = {
    route: prefetchRoute,
    data: preloadData,
    getData: getPreloadedData,
    clearData: clearPreloadedData,
    url: prefetchUrl,
    preloadUrl,
    preconnect,
    setupIntelligent: setupIntelligentPrefetch,
    preloadCritical: preloadCriticalData,
};

export default prefetcher;
