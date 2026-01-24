/**
 * Security Middleware
 * Comprehensive security hardening for the API
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// ============================================================================
// CSRF Protection
// ============================================================================

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * CSRF protection middleware
 * Skips for GET, HEAD, OPTIONS requests (safe methods)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
    // Skip safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip for API tokens (machine-to-machine)
    if (req.headers['x-api-key']) {
        return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        logger.warn('CSRF validation failed', {
            ip: req.ip,
            path: req.path,
            hasCookie: !!cookieToken,
            hasHeader: !!headerToken,
        });
        res.status(403).json({ error: 'Invalid CSRF token' });
        return;
    }

    next();
}

/**
 * Set CSRF cookie on response
 */
export function setCsrfCookie(res: Response): string {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    return token;
}

// ============================================================================
// Input Validation Helpers
// ============================================================================

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
    uuid: z.string().uuid(),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(255).regex(/^[^<>'"`;]*$/), // No script injection chars
    url: z.string().url().max(2048),
    positiveInt: z.number().int().positive(),
    pagination: z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
    }),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    dateRange: z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
    }),
};

/**
 * Validate request body middleware factory
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Validation error',
                    details: error.issues.map((issue: z.ZodIssue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}

/**
 * Validate query params middleware factory
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as any;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Invalid query parameters',
                    details: error.issues.map((issue: z.ZodIssue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}

/**
 * Validate URL params middleware factory
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.params = schema.parse(req.params) as any;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Invalid URL parameters',
                    details: error.issues.map((issue: z.ZodIssue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}

// ============================================================================
// Rate Limiting (Enhanced)
// ============================================================================

interface RateLimitConfig {
    windowMs: number;
    max: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    message?: string;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Enhanced rate limiter with per-endpoint limits
 */
export function rateLimit(config: RateLimitConfig) {
    const {
        windowMs,
        max,
        keyGenerator = (req) => req.ip || 'unknown',
        skipSuccessfulRequests = false,
        message = 'Too many requests, please try again later',
    } = config;

    // Cleanup old entries periodically
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of rateLimitStore.entries()) {
            if (value.resetAt < now) {
                rateLimitStore.delete(key);
            }
        }
    }, 60000); // Cleanup every minute

    return (req: Request, res: Response, next: NextFunction): void => {
        const key = keyGenerator(req);
        const now = Date.now();

        let entry = rateLimitStore.get(key);

        if (!entry || entry.resetAt < now) {
            entry = { count: 0, resetAt: now + windowMs };
            rateLimitStore.set(key, entry);
        }

        entry.count++;

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

        if (entry.count > max) {
            logger.warn('Rate limit exceeded', { key, count: entry.count, max });
            res.status(429).json({ error: message });
            return;
        }

        // Optionally skip counting successful requests
        if (skipSuccessfulRequests) {
            res.on('finish', () => {
                if (res.statusCode < 400 && entry) {
                    entry.count--;
                }
            });
        }

        next();
    };
}

// Preset rate limiters
export const rateLimiters = {
    // Strict: 10 requests per minute (for sensitive operations)
    strict: rateLimit({ windowMs: 60 * 1000, max: 10 }),

    // Standard: 60 requests per minute
    standard: rateLimit({ windowMs: 60 * 1000, max: 60 }),

    // Relaxed: 200 requests per minute (for read operations)
    relaxed: rateLimit({ windowMs: 60 * 1000, max: 200 }),

    // Auth: 5 attempts per 15 minutes
    auth: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many authentication attempts',
    }),

    // Upload: 10 uploads per hour
    upload: rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: 'Upload limit reached',
    }),
};

// ============================================================================
// Security Headers
// ============================================================================

/**
 * Add security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS protection (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=()'
    );

    next();
}

// ============================================================================
// Request Sanitization
// ============================================================================

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/`/g, '&#x60;');
}

/**
 * Deep sanitize an object
 */
export function sanitizeObject<T>(obj: T): T {
    if (typeof obj === 'string') {
        return sanitizeString(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject) as unknown as T;
    }

    if (obj && typeof obj === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[sanitizeString(key)] = sanitizeObject(value);
        }
        return sanitized as T;
    }

    return obj;
}

/**
 * Request sanitization middleware
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
}

// ============================================================================
// IP Blocking
// ============================================================================

const blockedIPs = new Set<string>();
const suspiciousIPs = new Map<string, { count: number; firstSeen: number }>();

/**
 * Block an IP address
 */
export function blockIP(ip: string): void {
    blockedIPs.add(ip);
    logger.warn('IP blocked', { ip });
}

/**
 * Unblock an IP address
 */
export function unblockIP(ip: string): void {
    blockedIPs.delete(ip);
    suspiciousIPs.delete(ip);
}

/**
 * IP blocking middleware
 */
export function ipBlocker(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip || 'unknown';

    if (blockedIPs.has(ip)) {
        logger.warn('Blocked IP attempted access', { ip, path: req.path });
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    next();
}

/**
 * Track suspicious activity and auto-block
 */
export function trackSuspiciousActivity(req: Request, reason: string): void {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    let entry = suspiciousIPs.get(ip);
    if (!entry || now - entry.firstSeen > 60 * 60 * 1000) {
        entry = { count: 0, firstSeen: now };
        suspiciousIPs.set(ip, entry);
    }

    entry.count++;

    logger.warn('Suspicious activity', { ip, reason, count: entry.count });

    // Auto-block after 10 suspicious events in an hour
    if (entry.count >= 10) {
        blockIP(ip);
    }
}

export default {
    csrfProtection,
    setCsrfCookie,
    generateCsrfToken,
    validateBody,
    validateQuery,
    validateParams,
    ValidationSchemas,
    rateLimit,
    rateLimiters,
    securityHeaders,
    sanitizeRequest,
    sanitizeObject,
    sanitizeString,
    ipBlocker,
    blockIP,
    unblockIP,
    trackSuspiciousActivity,
};
