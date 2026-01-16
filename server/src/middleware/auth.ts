import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

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
            console.warn('[AuthMiddleware] WARNING: Development master-token used');
            (req as AuthRequest).auth = { userId: 'user_master_local_admin', sessionId: 'mock-session-master' };
            return next();
        }
        if (authHeader.includes('dev-token')) {
            console.warn('[AuthMiddleware] WARNING: Development dev-token used');
            (req as AuthRequest).auth = { userId: 'user_developer_admin', sessionId: 'mock-session-dev' };
            return next();
        }
        if (authHeader.includes('google-token')) {
            console.warn('[AuthMiddleware] WARNING: Development google-token used');
            (req as AuthRequest).auth = { userId: 'user_google_simulated', sessionId: 'mock-session-google' };
            return next();
        }
    }

    // Default to Clerk for everything else
    try {
        return clerkAuth(req as any, res as any, next);
    } catch (err) {
        console.error('[AuthMiddleware] Clerk Auth Error:', err);
        res.status(401).json({ error: 'Unauthenticated' });
    }
};
