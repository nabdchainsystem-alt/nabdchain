/**
 * Service Worker Registration and Management
 * Handles SW lifecycle, updates, and communication
 */

import { swLogger } from './logger';

interface ServiceWorkerConfig {
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onOffline?: () => void;
    onOnline?: () => void;
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        swLogger.info('Service workers not supported');
        return null;
    }

    // Only register in production or if explicitly enabled
    const isDev = import.meta.env.DEV;
    if (isDev && !import.meta.env.VITE_ENABLE_SW_DEV) {
        swLogger.debug('Skipping SW in development');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });

        swRegistration = registration;
        swLogger.info('Service Worker registered', { scope: registration.scope });

        // Check for updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available
                    swLogger.info('New content available');
                    config.onUpdate?.(registration);
                } else if (newWorker.state === 'installed') {
                    // Content is cached for offline use
                    swLogger.info('Content cached for offline');
                    config.onSuccess?.(registration);
                }
            });
        });

        // Handle online/offline events
        window.addEventListener('online', () => {
            swLogger.info('App is online');
            config.onOnline?.();
        });

        window.addEventListener('offline', () => {
            swLogger.info('App is offline');
            config.onOffline?.();
        });

        return registration;
    } catch (error) {
        swLogger.error('Registration failed', error);
        return null;
    }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const result = await registration.unregister();
        swLogger.info('Unregistered', { result });
        return result;
    } catch (error) {
        swLogger.error('Unregister failed', error);
        return false;
    }
}

/**
 * Skip waiting and activate new service worker immediately
 */
export function skipWaiting(): void {
    if (swRegistration?.waiting) {
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
}

/**
 * Request the service worker to cache specific URLs
 */
export function cacheUrls(urls: string[]): void {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_URLS',
            urls,
        });
    }
}

/**
 * Clear all service worker caches
 */
export function clearCache(): void {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
}

/**
 * Check if the app is running offline
 */
export function isOffline(): boolean {
    return !navigator.onLine;
}

/**
 * Check if service worker is supported and registered
 */
export function isServiceWorkerActive(): boolean {
    return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
}

/**
 * Get the current service worker registration
 */
export function getRegistration(): ServiceWorkerRegistration | null {
    return swRegistration;
}

// Export a hook-friendly API
export const serviceWorker = {
    register: registerServiceWorker,
    unregister: unregisterServiceWorker,
    skipWaiting,
    cacheUrls,
    clearCache,
    isOffline,
    isActive: isServiceWorkerActive,
    getRegistration,
};

export default serviceWorker;
