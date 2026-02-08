/**
 * Integration tests for Portal Auth Routes
 *
 * Tests signup, login, refresh, check-email, and CSRF token
 * through the Express router with mocked services.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../testApp';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Bypass rate limiters in tests
vi.mock('express-rate-limit', () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../../services/portalAuthService', () => ({
  portalAuthService: {
    createBuyerAccount: vi.fn(),
    createSellerAccount: vi.fn(),
    login: vi.fn(),
    getUserForTokenRefresh: vi.fn(),
    getOnboardingState: vi.fn(),
    saveOnboardingStep: vi.fn(),
    submitForReview: vi.fn(),
  },
}));

vi.mock('../../../auth/portalToken', () => ({
  refreshAccessToken: vi.fn(),
}));

vi.mock('../../../middleware/portalAdminMiddleware', () => ({
  requirePortalAuth: () => (req: any, _res: any, next: any) => {
    req.portalUser = { id: 'portal-user-1', email: 'test@test.com', name: 'Test', portalRole: 'seller', portalStatus: 'active' };
    req.portalAuth = { exp: Math.floor(Date.now() / 1000) + 3600 };
    next();
  },
  requirePortalUser: () => (_req: any, _res: any, next: any) => next(),
  PortalAuthRequest: {},
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    sellerProfile: { findUnique: vi.fn() },
    buyerProfile: { findUnique: vi.fn() },
  },
}));

vi.mock('../../../middleware/security', () => ({
  setCsrfCookie: vi.fn().mockReturnValue('mock-csrf-token'),
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import portalAuthRouter from '../../../routes/portalAuthRoutes';
import { portalAuthService } from '../../../services/portalAuthService';
import { refreshAccessToken } from '../../../auth/portalToken';
import { prisma } from '../../../lib/prisma';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const app = createTestApp(portalAuthRouter, '/api/auth/portal');

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Buyer Signup
// =============================================================================

describe('POST /api/auth/portal/buyer/signup', () => {
  const validBuyer = {
    fullName: 'Ali Hassan',
    email: 'ali@company.com',
    password: 'Str0ng!Pass',
    companyName: 'Hassan Trading',
  };

  it('creates a buyer account', async () => {
    (portalAuthService.createBuyerAccount as any).mockResolvedValue({
      success: true,
      user: { id: 'buyer-1', email: validBuyer.email },
    });

    const res = await request(app)
      .post('/api/auth/portal/buyer/signup')
      .send(validBuyer);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(portalAuthService.createBuyerAccount).toHaveBeenCalledWith(
      expect.objectContaining({ email: validBuyer.email, companyName: 'Hassan Trading' })
    );
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/portal/buyer/signup')
      .send({ fullName: 'Ali' }); // missing email, password, companyName

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_FIELDS');
  });

  it('returns 400 when service returns failure', async () => {
    (portalAuthService.createBuyerAccount as any).mockResolvedValue({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
    });

    const res = await request(app)
      .post('/api/auth/portal/buyer/signup')
      .send(validBuyer);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 500 on unexpected error', async () => {
    (portalAuthService.createBuyerAccount as any).mockRejectedValue(new Error('DB crash'));

    const res = await request(app)
      .post('/api/auth/portal/buyer/signup')
      .send(validBuyer);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('SERVER_ERROR');
  });
});

// =============================================================================
// Seller Signup
// =============================================================================

describe('POST /api/auth/portal/seller/signup', () => {
  const validSeller = {
    fullName: 'Omar Khalid',
    email: 'omar@parts.com',
    password: 'Str0ng!Pass',
    displayName: 'Omar Parts Co',
  };

  it('creates a seller account', async () => {
    (portalAuthService.createSellerAccount as any).mockResolvedValue({
      success: true,
      user: { id: 'seller-1', email: validSeller.email },
    });

    const res = await request(app)
      .post('/api/auth/portal/seller/signup')
      .send(validSeller);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 for missing displayName', async () => {
    const res = await request(app)
      .post('/api/auth/portal/seller/signup')
      .send({ fullName: 'Omar', email: 'omar@test.com', password: 'pass' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_FIELDS');
  });
});

// =============================================================================
// Login
// =============================================================================

describe('POST /api/auth/portal/login', () => {
  const validLogin = {
    email: 'ali@company.com',
    password: 'Str0ng!Pass',
    portalType: 'buyer',
  };

  it('logs in successfully', async () => {
    (portalAuthService.login as any).mockResolvedValue({
      success: true,
      accessToken: 'at-123',
      refreshToken: 'rt-456',
    });

    const res = await request(app)
      .post('/api/auth/portal/login')
      .send(validLogin);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBe('at-123');
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/portal/login')
      .send({ email: 'ali@company.com' }); // missing password, portalType

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_FIELDS');
  });

  it('returns 400 for invalid portalType', async () => {
    const res = await request(app)
      .post('/api/auth/portal/login')
      .send({ ...validLogin, portalType: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PORTAL_TYPE');
  });

  it('returns 401 for bad credentials', async () => {
    (portalAuthService.login as any).mockResolvedValue({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Wrong password' },
    });

    const res = await request(app)
      .post('/api/auth/portal/login')
      .send(validLogin);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================================
// Token Refresh
// =============================================================================

describe('POST /api/auth/portal/refresh', () => {
  it('refreshes a token', async () => {
    (refreshAccessToken as any).mockResolvedValue({
      success: true,
      accessToken: 'new-at-789',
    });

    const res = await request(app)
      .post('/api/auth/portal/refresh')
      .send({ refreshToken: 'rt-456' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('new-at-789');
  });

  it('returns 400 when refresh token missing', async () => {
    const res = await request(app)
      .post('/api/auth/portal/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
  });

  it('returns 401 for expired refresh token', async () => {
    (refreshAccessToken as any).mockResolvedValue({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Refresh token expired' },
    });

    const res = await request(app)
      .post('/api/auth/portal/refresh')
      .send({ refreshToken: 'old-rt' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================================
// Check Email
// =============================================================================

describe('GET /api/auth/portal/check-email', () => {
  it('returns available when email not taken', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/auth/portal/check-email')
      .query({ email: 'new@company.com' });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
  });

  it('returns not available when email exists', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user-1' });

    const res = await request(app)
      .get('/api/auth/portal/check-email')
      .query({ email: 'taken@company.com' });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });

  it('returns 400 when email not provided', async () => {
    const res = await request(app).get('/api/auth/portal/check-email');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_EMAIL');
  });
});

// =============================================================================
// CSRF Token
// =============================================================================

describe('GET /api/auth/portal/csrf-token', () => {
  it('returns a CSRF token', async () => {
    const res = await request(app).get('/api/auth/portal/csrf-token');

    expect(res.status).toBe(200);
    expect(res.body.csrfToken).toBe('mock-csrf-token');
  });
});

// =============================================================================
// Protected Routes (with mocked portal auth middleware)
// =============================================================================

describe('GET /api/auth/portal/me', () => {
  it('returns current user info for seller', async () => {
    (prisma.sellerProfile.findUnique as any).mockResolvedValue({
      id: 'sp-1', displayName: 'Test Store', slug: 'test-store', status: 'active',
    });

    const res = await request(app).get('/api/auth/portal/me');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.seller.displayName).toBe('Test Store');
  });
});

describe('GET /api/auth/portal/seller/onboarding', () => {
  it('returns onboarding state', async () => {
    const state = { currentStep: 3, completedSteps: [1, 2] };
    (portalAuthService.getOnboardingState as any).mockResolvedValue(state);

    const res = await request(app).get('/api/auth/portal/seller/onboarding');

    expect(res.status).toBe(200);
    expect(res.body.data.currentStep).toBe(3);
  });

  it('returns 404 when no seller profile', async () => {
    (portalAuthService.getOnboardingState as any).mockResolvedValue(null);

    const res = await request(app).get('/api/auth/portal/seller/onboarding');

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/auth/portal/seller/onboarding/step/:stepId', () => {
  it('saves onboarding step data', async () => {
    (portalAuthService.saveOnboardingStep as any).mockResolvedValue({
      success: true, completedSteps: [1, 2], currentStep: 3,
    });

    const res = await request(app)
      .put('/api/auth/portal/seller/onboarding/step/2')
      .send({ businessName: 'My Store' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.completedSteps).toEqual([1, 2]);
  });

  it('returns 400 for invalid step ID', async () => {
    const res = await request(app)
      .put('/api/auth/portal/seller/onboarding/step/99')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STEP');
  });
});

describe('POST /api/auth/portal/seller/onboarding/submit', () => {
  it('submits onboarding for review', async () => {
    (portalAuthService.submitForReview as any).mockResolvedValue({ success: true });

    const res = await request(app).post('/api/auth/portal/seller/onboarding/submit');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.redirectTo).toBe('/portal/seller/dashboard');
  });

  it('returns 400 when not all steps completed', async () => {
    (portalAuthService.submitForReview as any).mockResolvedValue({
      success: false, error: 'Not all steps completed',
    });

    const res = await request(app).post('/api/auth/portal/seller/onboarding/submit');

    expect(res.status).toBe(400);
  });
});
