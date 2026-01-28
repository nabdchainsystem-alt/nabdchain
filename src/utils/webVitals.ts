/**
 * Web Vitals & Real User Monitoring
 * Track Core Web Vitals and performance metrics
 */

// Types for web vitals
interface PerformanceMetric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
    navigationType: string;
}

type MetricCallback = (metric: PerformanceMetric) => void;

// Thresholds for Core Web Vitals (in ms, except CLS which is unitless)
const THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
};

function getRating(
    name: keyof typeof THRESHOLDS,
    value: number
): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[name];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
}

// Generate unique ID
let idCounter = 0;
function generateId(): string {
    return `v${++idCounter}-${Date.now().toString(36)}`;
}

// Get navigation type
function getNavigationType(): string {
    if (performance.getEntriesByType) {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navEntry) return navEntry.type;
    }
    return 'navigate';
}

// Store for metrics
const metricsStore: Map<string, PerformanceMetric> = new Map();
const callbacks: MetricCallback[] = [];

function reportMetric(metric: PerformanceMetric): void {
    metricsStore.set(metric.name, metric);
    callbacks.forEach((cb) => cb(metric));
}

/**
 * Largest Contentful Paint (LCP)
 */
export function observeLCP(callback?: MetricCallback): void {
    if (!('PerformanceObserver' in window)) return;

    let lastValue = 0;

    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };

        if (lastEntry) {
            const value = lastEntry.startTime;
            const delta = value - lastValue;
            lastValue = value;

            const metric: PerformanceMetric = {
                name: 'LCP',
                value,
                rating: getRating('LCP', value),
                delta,
                id: generateId(),
                navigationType: getNavigationType(),
            };

            reportMetric(metric);
            callback?.(metric);
        }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    // Stop observing after page becomes hidden
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            observer.disconnect();
        }
    }, { once: true });
}

/**
 * First Input Delay (FID)
 */
export function observeFID(callback?: MetricCallback): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as PerformanceEventTiming;

        if (firstEntry) {
            const value = firstEntry.processingStart - firstEntry.startTime;

            const metric: PerformanceMetric = {
                name: 'FID',
                value,
                rating: getRating('FID', value),
                delta: value,
                id: generateId(),
                navigationType: getNavigationType(),
            };

            reportMetric(metric);
            callback?.(metric);
            observer.disconnect();
        }
    });

    observer.observe({ type: 'first-input', buffered: true });
}

/**
 * Cumulative Layout Shift (CLS)
 */
export function observeCLS(callback?: MetricCallback): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            // Only count layout shifts without recent user input
            if (!entry.hadRecentInput) {
                const firstSessionEntry = sessionEntries[0] as PerformanceEntry & { startTime: number } | undefined;
                const lastSessionEntry = sessionEntries[sessionEntries.length - 1] as PerformanceEntry & { startTime: number } | undefined;

                // If the entry is within 1s of the previous entry and 5s of the first entry
                if (
                    sessionValue &&
                    entry.startTime - (lastSessionEntry?.startTime ?? 0) < 1000 &&
                    entry.startTime - (firstSessionEntry?.startTime ?? 0) < 5000
                ) {
                    sessionValue += entry.value;
                    sessionEntries.push(entry);
                } else {
                    sessionValue = entry.value;
                    sessionEntries = [entry];
                }

                if (sessionValue > clsValue) {
                    clsValue = sessionValue;

                    const metric: PerformanceMetric = {
                        name: 'CLS',
                        value: clsValue,
                        rating: getRating('CLS', clsValue),
                        delta: entry.value,
                        id: generateId(),
                        navigationType: getNavigationType(),
                    };

                    reportMetric(metric);
                    callback?.(metric);
                }
            }
        }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            observer.disconnect();
        }
    }, { once: true });
}

/**
 * First Contentful Paint (FCP)
 */
export function observeFCP(callback?: MetricCallback): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint') as PerformanceEntry & { startTime: number } | undefined;

        if (fcpEntry) {
            const value = fcpEntry.startTime;

            const metric: PerformanceMetric = {
                name: 'FCP',
                value,
                rating: getRating('FCP', value),
                delta: value,
                id: generateId(),
                navigationType: getNavigationType(),
            };

            reportMetric(metric);
            callback?.(metric);
            observer.disconnect();
        }
    });

    observer.observe({ type: 'paint', buffered: true });
}

/**
 * Time to First Byte (TTFB)
 */
export function observeTTFB(callback?: MetricCallback): void {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navEntry) {
        const value = navEntry.responseStart - navEntry.requestStart;

        const metric: PerformanceMetric = {
            name: 'TTFB',
            value,
            rating: getRating('TTFB', value),
            delta: value,
            id: generateId(),
            navigationType: getNavigationType(),
        };

        reportMetric(metric);
        callback?.(metric);
    }
}

/**
 * Interaction to Next Paint (INP)
 */
export function observeINP(callback?: MetricCallback): void {
    if (!('PerformanceObserver' in window)) return;

    const interactions: number[] = [];

    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEventTiming & { interactionId?: number })[]) {
            if (entry.interactionId) {
                const duration = entry.duration;
                interactions.push(duration);

                // Calculate INP as 98th percentile
                interactions.sort((a, b) => a - b);
                const index = Math.floor(interactions.length * 0.98) - 1;
                const inp = interactions[Math.max(0, index)];

                const metric: PerformanceMetric = {
                    name: 'INP',
                    value: inp,
                    rating: getRating('INP', inp),
                    delta: duration,
                    id: generateId(),
                    navigationType: getNavigationType(),
                };

                reportMetric(metric);
                callback?.(metric);
            }
        }
    });

    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            observer.disconnect();
        }
    }, { once: true });
}

/**
 * Initialize all Core Web Vitals observers
 */
export function initWebVitals(callback?: MetricCallback): void {
    if (callback) {
        callbacks.push(callback);
    }

    // Start observing all metrics
    observeLCP();
    observeFID();
    observeCLS();
    observeFCP();
    observeTTFB();
    observeINP();
}

/**
 * Get all collected metrics
 */
export function getMetrics(): Map<string, PerformanceMetric> {
    return new Map(metricsStore);
}

/**
 * Get a summary of all metrics
 */
export function getMetricsSummary(): Record<string, { value: number; rating: string }> {
    const summary: Record<string, { value: number; rating: string }> = {};
    metricsStore.forEach((metric, name) => {
        summary[name] = { value: metric.value, rating: metric.rating };
    });
    return summary;
}

/**
 * Send metrics to analytics endpoint
 */
export function sendToAnalytics(
    endpoint: string,
    additionalData?: Record<string, unknown>
): void {
    const metrics = getMetricsSummary();

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
        const data = JSON.stringify({
            metrics,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            ...additionalData,
        });
        navigator.sendBeacon(endpoint, data);
    } else {
        // Fallback to fetch
        fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                metrics,
                url: window.location.href,
                timestamp: Date.now(),
                ...additionalData,
            }),
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
        }).catch(() => {
            // Ignore errors
        });
    }
}

/**
 * Log metrics to console (for development)
 */
export function logMetrics(): void {
    console.group('📊 Web Vitals');
    metricsStore.forEach((metric) => {
        const color =
            metric.rating === 'good'
                ? 'color: green'
                : metric.rating === 'needs-improvement'
                    ? 'color: orange'
                    : 'color: red';

        console.log(
            `%c${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
            color
        );
    });
    console.groupEnd();
}

export const webVitals = {
    init: initWebVitals,
    observeLCP,
    observeFID,
    observeCLS,
    observeFCP,
    observeTTFB,
    observeINP,
    getMetrics,
    getSummary: getMetricsSummary,
    sendToAnalytics,
    logMetrics,
};

export default webVitals;
