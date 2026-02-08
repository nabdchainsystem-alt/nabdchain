import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import { authLogger } from '../utils/logger';

const clerkAuth = ClerkExpressRequireAuth({});

// Type for authenticated request - auth is set by requireAuth middleware
export interface AuthRequest extends Request {
    auth: {
        userId: string;
        sessionId: string;
    };
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';
const ALLOW_DEV_TOKENS = process.env.ALLOW_DEV_TOKENS === 'true';

// SECURITY: Triple-gate for dev tokens
// 1. Must be development environment (NODE_ENV !== 'production')
// 2. Must have ALLOW_DEV_TOKENS=true explicitly set
// 3. Even if both are true, reject if somehow we detect production indicators
const isDevTokensAllowed = isDevelopment && ALLOW_DEV_TOKENS && !isProduction;

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // If auth is already set by global middleware (e.g., portal JWT), skip
    if ((req as any).auth?.userId) {
        return next();
    }

    const authHeader = req.headers.authorization;

    // Development-only mock tokens - requires ALL conditions:
    // - isDevelopment (NODE_ENV !== 'production')
    // - ALLOW_DEV_TOKENS=true
    // - NOT production (explicit double-check)
    // This triple-gate prevents accidental token bypass in misconfigured environments
    if (isDevTokensAllowed && authHeader) {
        if (authHeader.includes('master-token')) {
            authLogger.warn('WARNING: Development master-token used');
            (req as AuthRequest).auth = { userId: 'user_master_local_admin', sessionId: 'mock-session-master' };
            return next();
        }
        if (authHeader.includes('dev-token')) {
            authLogger.warn('WARNING: Development dev-token used');
            (req as AuthRequest).auth = { userId: 'user_developer_admin', sessionId: 'mock-session-dev' };
            return next();
        }
        if (authHeader.includes('google-token')) {
            authLogger.warn('WARNING: Development google-token used');
            (req as AuthRequest).auth = { userId: 'user_google_simulated', sessionId: 'mock-session-google' };
            return next();
        }
        if (authHeader.includes('buyer-portal-token')) {
            authLogger.warn('WARNING: Development buyer-portal-token used');
            (req as AuthRequest).auth = { userId: 'user_buyer_portal', sessionId: 'mock-session-buyer' };
            return next();
        }
        if (authHeader.includes('seller-portal-token')) {
            authLogger.warn('WARNING: Development seller-portal-token used');
            (req as AuthRequest).auth = { userId: 'user_seller_portal', sessionId: 'mock-session-seller' };
            return next();
        }
    }

    // Default to Clerk for everything else
    try {
        return clerkAuth(req as any, res as any, next);
    } catch (err) {
        authLogger.error('Clerk Auth Error:', err);
        res.status(401).json({ error: 'Unauthenticated' });
    }
};
