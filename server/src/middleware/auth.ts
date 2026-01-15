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

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // Development-only mock tokens - NEVER works in production
    if (isDevelopment && authHeader) {
        if (authHeader.includes('master-token')) {
            (req as any).auth = { userId: 'user_master_local_admin', sessionId: 'mock-session-master' };
            return next();
        }
        if (authHeader.includes('dev-token')) {
            (req as any).auth = { userId: 'user_developer_admin', sessionId: 'mock-session-dev' };
            return next();
        }
        if (authHeader.includes('google-token')) {
            (req as any).auth = { userId: 'user_google_simulated', sessionId: 'mock-session-google' };
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
