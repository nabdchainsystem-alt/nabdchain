import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

const clerkAuth = ClerkExpressRequireAuth({});

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // Debug Logging
    // Debug Logging
    // if (authHeader && !authHeader.startsWith('Bearer sk_')) {
    //    console.log(`[AuthMiddleware] Received Header: ${authHeader}`);
    // }

    // Check for Custom Developer Tokens
    if (authHeader) {
        if (authHeader.includes('master-token')) {
            (req as any).auth = { userId: 'user_master_local_admin', sessionId: 'mock-session-master' };
            console.log('Auth: Mock Master User authenticated');
            return next();
        }
        if (authHeader.includes('dev-token')) {
            (req as any).auth = { userId: 'user_developer_admin', sessionId: 'mock-session-dev' };
            console.log('Auth: Mock Developer User authenticated');
            return next();
        }
        if (authHeader.includes('google-token')) {
            (req as any).auth = { userId: 'user_google_simulated', sessionId: 'mock-session-google' };
            console.log('Auth: Mock Google User authenticated');
            return next();
        }
    }

    // Default to Clerk for everything else
    try {
        return clerkAuth(req, res, next);
    } catch (err) {
        console.error('[AuthMiddleware] Clerk Auth Error:', err);
        res.status(401).json({ error: 'Unauthenticated' });
    }
};
