import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import { authLogger } from '../utils/logger';

const clerkAuth = ClerkExpressRequireAuth({});

// Type for authenticated request
export interface AuthRequest extends Request {
    auth: {
        userId: string;
        sessionId: string;
    };
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const ALLOW_DEV_TOKENS = process.env.ALLOW_DEV_TOKENS === 'true';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // Development-only mock tokens - requires BOTH isDevelopment AND ALLOW_DEV_TOKENS
    // This double-gate prevents accidental token bypass in misconfigured environments
    if (isDevelopment && ALLOW_DEV_TOKENS && authHeader) {
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
