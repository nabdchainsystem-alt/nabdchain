/**
 * Test app factory for integration tests.
 *
 * Creates a minimal Express app with auth mocked out,
 * suitable for supertest-based route testing.
 */
import express from 'express';
import cookieParser from 'cookie-parser';

/**
 * Creates a test app that mounts the given router at the specified path.
 * Auth is bypassed: every request gets `req.auth = { userId, sessionId }`.
 */
export function createTestApp(
  router: express.Router,
  mountPath: string,
  options: {
    userId?: string;
    sessionId?: string;
    portalAuth?: { userId: string; portalRole: string; sellerId?: string; buyerId?: string };
  } = {}
) {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Inject auth on every request (bypasses Clerk + portal JWT)
  app.use((req: any, _res, next) => {
    req.auth = {
      userId: options.userId ?? 'test-user-id',
      sessionId: options.sessionId ?? 'test-session-id',
    };
    if (options.portalAuth) {
      req.portalAuth = options.portalAuth;
    }
    next();
  });

  app.use(mountPath, router);

  return app;
}

/** Standard test user IDs */
export const TEST_SELLER_ID = 'test-seller-id';
export const TEST_BUYER_ID = 'test-buyer-id';
export const TEST_ADMIN_ID = 'test-admin-id';
