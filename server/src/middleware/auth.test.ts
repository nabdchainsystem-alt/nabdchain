import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock Clerk before importing auth module
vi.mock('@clerk/clerk-sdk-node', () => ({
  ClerkExpressRequireAuth: () => vi.fn((_req: Request, _res: Response, next: NextFunction) => next()),
  clerkClient: {},
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  authLogger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Set environment before importing
const originalEnv = process.env;

describe('requireAuth middleware', () => {
  let requireAuth: (req: Request, res: Response, next: NextFunction) => void;

  function createMockReq(overrides: Partial<Request> = {}): Request {
    return {
      headers: {},
      ...overrides,
    } as Request;
  }

  function createMockRes(): Response {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    return res;
  }

  describe('with dev tokens disabled', () => {
    beforeEach(async () => {
      vi.resetModules();
      process.env = { ...originalEnv, NODE_ENV: 'production', ALLOW_DEV_TOKENS: 'false' };
      const mod = await import('./auth');
      requireAuth = mod.requireAuth;
    });

    it('does not accept master-token in production', () => {
      const req = createMockReq({ headers: { authorization: 'Bearer master-token' } });
      const res = createMockRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      // Should NOT have set auth to master user — it either calls Clerk or returns 401
      expect((req as any).auth?.userId).not.toBe('user_master_local_admin');
    });

    it('skips if auth is already set', () => {
      const req = createMockReq() as any;
      req.auth = { userId: 'existing-user', sessionId: 'existing-session' };
      const res = createMockRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.auth.userId).toBe('existing-user');
    });
  });

  describe('with dev tokens enabled', () => {
    beforeEach(async () => {
      vi.resetModules();
      process.env = { ...originalEnv, NODE_ENV: 'development', ALLOW_DEV_TOKENS: 'true' };
      const mod = await import('./auth');
      requireAuth = mod.requireAuth;
    });

    it('accepts master-token in development', () => {
      const req = createMockReq({ headers: { authorization: 'Bearer master-token' } });
      const res = createMockRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).auth?.userId).toBe('user_master_local_admin');
    });

    it('accepts dev-token in development', () => {
      const req = createMockReq({ headers: { authorization: 'Bearer dev-token' } });
      const res = createMockRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).auth?.userId).toBe('user_developer_admin');
    });

    it('accepts buyer-portal-token in development', () => {
      const req = createMockReq({ headers: { authorization: 'Bearer buyer-portal-token' } });
      const res = createMockRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).auth?.userId).toBe('user_buyer_portal');
    });

    it('accepts seller-portal-token in development', () => {
      const req = createMockReq({ headers: { authorization: 'Bearer seller-portal-token' } });
      const res = createMockRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).auth?.userId).toBe('user_seller_portal');
    });
  });
});
