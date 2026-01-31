/**
 * Error Tracking and Monitoring
 * Captures, reports, and handles errors across the application
 */

import { errorLogger } from './logger';

// Error severity levels
export type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

// Error context
export interface ErrorContext {
    userId?: string;
    sessionId?: string;
    url?: string;
    userAgent?: string;
    timestamp?: number;
    extra?: Record<string, unknown>;
}

// Error report
export interface ErrorReport {
    message: string;
    stack?: string;
    severity: ErrorSeverity;
    context: ErrorContext;
    fingerprint?: string;
    tags?: Record<string, string>;
}

// Error handler config
interface ErrorTrackerConfig {
    dsn?: string; // Sentry DSN or other service
    environment: string;
    release?: string;
    sampleRate?: number;
    beforeSend?: (report: ErrorReport) => ErrorReport | null;
    onError?: (report: ErrorReport) => void;
}

// Store for error reports (in-memory buffer)
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER_SIZE = 100;

// Configuration
let config: ErrorTrackerConfig = {
    environment: import.meta.env.MODE || 'development',
    sampleRate: 1.0,
};

// Session ID
const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

/**
 * Initialize error tracking
 */
export function initErrorTracking(userConfig: Partial<ErrorTrackerConfig> = {}): void {
    config = { ...config, ...userConfig };

    // Set up global error handlers
    setupGlobalHandlers();

    errorLogger.info('Initialized', {
        environment: config.environment,
        release: config.release,
    });
}

/**
 * Set up global error handlers
 */
function setupGlobalHandlers(): void {
    // Uncaught errors
    window.addEventListener('error', (event) => {
        captureError(event.error || new Error(event.message), {
            extra: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            },
        });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason));

        captureError(error, {
            extra: { type: 'unhandledrejection' },
        });
    });

    // Console errors (optional)
    const originalConsoleError = console.error;
    console.error = (...args) => {
        // Only capture if first arg is an Error
        if (args[0] instanceof Error) {
            captureError(args[0], { extra: { source: 'console.error' } });
        }
        originalConsoleError.apply(console, args);
    };
}

/**
 * Generate error fingerprint for deduplication
 */
function generateFingerprint(error: Error): string {
    const parts = [
        error.name,
        error.message.slice(0, 100),
        error.stack?.split('\n')[1]?.trim() || '',
    ];
    return parts.join('|');
}

/**
 * Get current error context
 */
function getContext(extra?: Record<string, unknown>): ErrorContext {
    return {
        sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        extra,
    };
}

/**
 * Capture an error
 */
export function captureError(
    error: Error | string,
    options: {
        severity?: ErrorSeverity;
        extra?: Record<string, unknown>;
        tags?: Record<string, string>;
        userId?: string;
    } = {}
): void {
    const {
        severity = 'error',
        extra,
        tags,
        userId,
    } = options;

    // Convert string to Error
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Sample rate check
    if (Math.random() > (config.sampleRate || 1)) {
        return;
    }

    // Create report
    let report: ErrorReport = {
        message: errorObj.message,
        stack: errorObj.stack,
        severity,
        context: {
            ...getContext(extra),
            userId,
        },
        fingerprint: generateFingerprint(errorObj),
        tags,
    };

    // Allow modification before sending
    if (config.beforeSend) {
        const modified = config.beforeSend(report);
        if (!modified) return; // Dropped
        report = modified;
    }

    // Add to buffer
    addToBuffer(report);

    // Call custom handler
    config.onError?.(report);

    // Send to external service if configured
    sendToService(report);

    // Log in development
    if (config.environment === 'development') {
        console.group(`[Error] ${severity.toUpperCase()}: ${errorObj.message}`);
        console.error(errorObj);
        console.log('Context:', report.context);
        console.groupEnd();
    }
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(
    message: string,
    severity: ErrorSeverity = 'info',
    extra?: Record<string, unknown>
): void {
    const report: ErrorReport = {
        message,
        severity,
        context: getContext(extra),
        fingerprint: `message|${message.slice(0, 50)}`,
    };

    addToBuffer(report);
    config.onError?.(report);

    if (config.environment === 'development') {
        console.log(`[${severity.toUpperCase()}] ${message}`, extra);
    }
}

/**
 * Add report to buffer
 */
function addToBuffer(report: ErrorReport): void {
    errorBuffer.push(report);

    // Trim buffer if too large
    if (errorBuffer.length > MAX_BUFFER_SIZE) {
        errorBuffer.splice(0, errorBuffer.length - MAX_BUFFER_SIZE);
    }
}

/**
 * Send error to external service
 */
async function sendToService(report: ErrorReport): Promise<void> {
    if (!config.dsn) return;

    try {
        await fetch(config.dsn, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...report,
                environment: config.environment,
                release: config.release,
            }),
        });
    } catch (e) {
        // Silently fail - don't want error tracking to cause errors
        errorLogger.warn('Failed to send report', e);
    }
}

/**
 * Get error buffer (for debugging)
 */
export function getErrorBuffer(): ErrorReport[] {
    return [...errorBuffer];
}

/**
 * Clear error buffer
 */
export function clearErrorBuffer(): void {
    errorBuffer.length = 0;
}

/**
 * Set user context
 */
export function setUser(userId: string | null): void {
    if (userId) {
        (config as any).userId = userId;
    } else {
        delete (config as any).userId;
    }
}

/**
 * Add breadcrumb for debugging
 */
const breadcrumbs: Array<{ message: string; timestamp: number; data?: Record<string, unknown> }> = [];
const MAX_BREADCRUMBS = 50;

export function addBreadcrumb(
    message: string,
    data?: Record<string, unknown>
): void {
    breadcrumbs.push({
        message,
        timestamp: Date.now(),
        data,
    });

    if (breadcrumbs.length > MAX_BREADCRUMBS) {
        breadcrumbs.shift();
    }
}

/**
 * Get breadcrumbs
 */
export function getBreadcrumbs(): typeof breadcrumbs {
    return [...breadcrumbs];
}

/**
 * Wrap a function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => any>(
    fn: T,
    name?: string
): T {
    return ((...args: Parameters<T>) => {
        try {
            const result = fn(...args);

            // Handle async functions
            if (result instanceof Promise) {
                return result.catch((error) => {
                    captureError(error, {
                        extra: { functionName: name || fn.name },
                    });
                    throw error;
                });
            }

            return result;
        } catch (error) {
            captureError(error as Error, {
                extra: { functionName: name || fn.name },
            });
            throw error;
        }
    }) as T;
}

/**
 * Create an error boundary wrapper for async operations
 */
export async function tryCatch<T>(
    operation: () => Promise<T>,
    fallback: T,
    options?: { silent?: boolean; extra?: Record<string, unknown> }
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (!options?.silent) {
            captureError(error as Error, { extra: options?.extra });
        }
        return fallback;
    }
}

export const errorTracker = {
    init: initErrorTracking,
    captureError,
    captureMessage,
    setUser,
    addBreadcrumb,
    getBreadcrumbs,
    getErrorBuffer,
    clearErrorBuffer,
    withErrorTracking,
    tryCatch,
};

export default errorTracker;
