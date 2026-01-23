/**
 * Service Worker for NABD Chain
 * Provides offline caching and faster load times
 */

const CACHE_VERSION = 'nabd-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// API routes to cache with network-first strategy
const CACHEABLE_API_ROUTES = [
    '/api/workspaces',
    '/api/boards',
    '/api/user',
];

// Cache duration in milliseconds
const CACHE_DURATION = {
    static: 7 * 24 * 60 * 60 * 1000, // 7 days
    dynamic: 24 * 60 * 60 * 1000,     // 1 day
    api: 5 * 60 * 1000,               // 5 minutes
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => {
                return Promise.all(
                    keys
                        .filter((key) => key.startsWith('nabd-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
                        .map((key) => {
                            console.log('[SW] Removing old cache:', key);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) return;

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets (JS, CSS, images)
    if (isStaticAsset(url.pathname)) {
        event.respondWith(handleStaticRequest(request));
        return;
    }

    // Handle navigation requests (HTML)
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // Default: network first, fallback to cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    const url = new URL(request.url);
    const isCacheable = CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route));

    try {
        const response = await fetch(request);

        if (response.ok && isCacheable) {
            const cache = await caches.open(API_CACHE);
            // Store response with timestamp
            const headers = new Headers(response.headers);
            headers.set('sw-cached-at', Date.now().toString());
            const cachedResponse = new Response(await response.clone().blob(), {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
            await cache.put(request, cachedResponse);
        }

        return response;
    } catch (error) {
        // Network failed, try cache
        const cached = await caches.match(request);
        if (cached) {
            const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0', 10);
            const age = Date.now() - cachedAt;

            // Return cached if not too old
            if (age < CACHE_DURATION.api) {
                console.log('[SW] Serving stale API response:', request.url);
                return cached;
            }
        }

        // Return offline response for API
        return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
    const cached = await caches.match(request);
    if (cached) {
        // Return cached and update in background
        updateCache(request, STATIC_CACHE);
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return offline placeholder for images
        if (request.destination === 'image') {
            return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f3f4f6" width="100" height="100"/></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }
        throw error;
    }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return cached index.html for SPA navigation
        const cached = await caches.match('/index.html');
        if (cached) return cached;
        throw error;
    }
}

// Update cache in background
function updateCache(request, cacheName) {
    fetch(request)
        .then((response) => {
            if (response.ok) {
                caches.open(cacheName).then((cache) => cache.put(request, response));
            }
        })
        .catch(() => { /* ignore */ });
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname);
}

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data?.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        caches.open(DYNAMIC_CACHE).then((cache) => {
            urls.forEach((url) => {
                fetch(url).then((response) => {
                    if (response.ok) cache.put(url, response);
                });
            });
        });
    }

    if (event.data?.type === 'CLEAR_CACHE') {
        caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
        });
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    console.log('[SW] Syncing offline data');

    // Open IndexedDB
    const db = await openDB();
    if (!db) return;

    const actions = await getAllQueuedActions(db);
    console.log(`[SW] Found ${actions.length} queued actions`);

    for (const action of actions) {
        try {
            const response = await fetch(action.url, {
                method: action.type,
                headers: {
                    'Content-Type': 'application/json',
                    ...action.headers,
                },
                body: action.body ? JSON.stringify(action.body) : undefined,
            });

            if (response.ok || (response.status >= 400 && response.status < 500)) {
                await deleteQueuedAction(db, action.id);
                console.log(`[SW] Synced action: ${action.id}`);
            }
        } catch (error) {
            console.log(`[SW] Failed to sync action: ${action.id}`, error);
        }
    }

    db.close();
}

function openDB() {
    return new Promise((resolve) => {
        const request = indexedDB.open('nabd-offline-db', 1);
        request.onerror = () => resolve(null);
        request.onsuccess = () => resolve(request.result);
    });
}

function getAllQueuedActions(db) {
    return new Promise((resolve) => {
        const transaction = db.transaction('offline-queue', 'readonly');
        const store = transaction.objectStore('offline-queue');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
    });
}

function deleteQueuedAction(db, id) {
    return new Promise((resolve) => {
        const transaction = db.transaction('offline-queue', 'readwrite');
        const store = transaction.objectStore('offline-queue');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
    });
}

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: data.data || {},
            actions: data.actions || [],
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'NABD', options)
        );
    } catch (error) {
        console.error('[SW] Push notification error:', error);
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                return self.clients.openWindow(urlToOpen);
            })
    );
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sync-data-periodic') {
        event.waitUntil(syncOfflineData());
    }
});

console.log('[SW] Service Worker loaded v2');
