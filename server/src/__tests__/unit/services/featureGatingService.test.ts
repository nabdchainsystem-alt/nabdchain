/**
 * Feature Gating Service — Unit Tests
 *
 * Tests cover: checkAccess for all seller statuses and actions,
 * getSellerContext, assertAccess, getFeatureAccess, and logGatingDenial.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  featureGatingService,
  FeatureGatingError,
} from '../../../services/featureGatingService';
import type { SellerGatingContext, GatedAction } from '../../../services/featureGatingService';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Helper to create gating contexts
// =============================================================================

function makeContext(overrides: Partial<SellerGatingContext> = {}): SellerGatingContext {
  return {
    userId: 'usr-1',
    sellerId: 'seller-1',
    status: 'approved',
    canPublish: true,
    profileComplete: true,
    companyVerified: true,
    bankVerified: true,
    documentsVerified: true,
    ...overrides,
  };
}

// =============================================================================
// checkAccess — pure logic, no Prisma
// =============================================================================

describe('featureGatingService.checkAccess', () => {
  describe('approved seller', () => {
    const ctx = makeContext({ status: 'approved', canPublish: true, bankVerified: true });

    it('allows view_portal', () => {
      expect(featureGatingService.checkAccess(ctx, 'view_portal')).toEqual({ allowed: true });
    });

    it('allows create_draft', () => {
      expect(featureGatingService.checkAccess(ctx, 'create_draft')).toEqual({ allowed: true });
    });

    it('allows publish_listing', () => {
      expect(featureGatingService.checkAccess(ctx, 'publish_listing')).toEqual({ allowed: true });
    });

    it('allows send_quote', () => {
      expect(featureGatingService.checkAccess(ctx, 'send_quote')).toEqual({ allowed: true });
    });

    it('allows accept_order', () => {
      expect(featureGatingService.checkAccess(ctx, 'accept_order')).toEqual({ allowed: true });
    });

    it('allows receive_payout when bankVerified', () => {
      expect(featureGatingService.checkAccess(ctx, 'receive_payout')).toEqual({ allowed: true });
    });
  });

  describe('approved seller without bank verification', () => {
    const ctx = makeContext({ status: 'approved', bankVerified: false });

    it('denies receive_payout', () => {
      const result = featureGatingService.checkAccess(ctx, 'receive_payout');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('BANK_NOT_VERIFIED');
    });
  });

  describe('approved seller without canPublish', () => {
    const ctx = makeContext({ status: 'approved', canPublish: false });

    it('denies publish_listing', () => {
      const result = featureGatingService.checkAccess(ctx, 'publish_listing');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('VERIFICATION_REQUIRED');
    });
  });

  describe('incomplete seller', () => {
    const ctx = makeContext({ status: 'incomplete' });

    it('allows view_portal', () => {
      expect(featureGatingService.checkAccess(ctx, 'view_portal').allowed).toBe(true);
    });

    it('denies create_draft with redirect', () => {
      const result = featureGatingService.checkAccess(ctx, 'create_draft');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('PROFILE_INCOMPLETE');
      expect(result.redirectTo).toBe('/portal/seller/onboarding');
    });

    it('denies publish_listing', () => {
      const result = featureGatingService.checkAccess(ctx, 'publish_listing');
      expect(result.allowed).toBe(false);
    });

    it('denies send_quote', () => {
      expect(featureGatingService.checkAccess(ctx, 'send_quote').allowed).toBe(false);
    });
  });

  describe('pending_review seller', () => {
    const ctx = makeContext({ status: 'pending_review' });

    it('allows view_portal', () => {
      expect(featureGatingService.checkAccess(ctx, 'view_portal').allowed).toBe(true);
    });

    it('allows create_draft', () => {
      expect(featureGatingService.checkAccess(ctx, 'create_draft').allowed).toBe(true);
    });

    it('denies publish_listing with PENDING_VERIFICATION', () => {
      const result = featureGatingService.checkAccess(ctx, 'publish_listing');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('PENDING_VERIFICATION');
    });

    it('denies accept_order', () => {
      const result = featureGatingService.checkAccess(ctx, 'accept_order');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('PENDING_VERIFICATION');
    });
  });

  describe('suspended seller', () => {
    const ctx = makeContext({ status: 'suspended' });

    it('allows view_portal', () => {
      expect(featureGatingService.checkAccess(ctx, 'view_portal').allowed).toBe(true);
    });

    it('denies create_draft with ACCOUNT_SUSPENDED', () => {
      const result = featureGatingService.checkAccess(ctx, 'create_draft');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('ACCOUNT_SUSPENDED');
    });

    it('denies send_invoice', () => {
      const result = featureGatingService.checkAccess(ctx, 'send_invoice');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('ACCOUNT_SUSPENDED');
    });
  });
});

// =============================================================================
// getSellerContext
// =============================================================================

describe('featureGatingService.getSellerContext', () => {
  it('returns context when profile exists', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue({
      id: 'seller-1',
      status: 'approved',
      canPublish: true,
      profileComplete: true,
      companyVerified: true,
      bankVerified: true,
      documentsVerified: true,
    });

    const ctx = await featureGatingService.getSellerContext('usr-1');
    expect(ctx).toEqual({
      userId: 'usr-1',
      sellerId: 'seller-1',
      status: 'approved',
      canPublish: true,
      profileComplete: true,
      companyVerified: true,
      bankVerified: true,
      documentsVerified: true,
    });
  });

  it('returns null when profile does not exist', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue(null);
    const ctx = await featureGatingService.getSellerContext('usr-999');
    expect(ctx).toBeNull();
  });
});

// =============================================================================
// assertAccess
// =============================================================================

describe('featureGatingService.assertAccess', () => {
  it('returns context when access is allowed', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue({
      id: 'seller-1',
      status: 'approved',
      canPublish: true,
      profileComplete: true,
      companyVerified: true,
      bankVerified: true,
      documentsVerified: true,
    });

    const ctx = await featureGatingService.assertAccess('usr-1', 'send_quote');
    expect(ctx.status).toBe('approved');
  });

  it('throws FeatureGatingError when seller not found', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue(null);

    await expect(featureGatingService.assertAccess('usr-999', 'send_quote')).rejects.toThrow(
      FeatureGatingError
    );
  });

  it('throws FeatureGatingError when access denied', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue({
      id: 'seller-1',
      status: 'incomplete',
      canPublish: false,
      profileComplete: false,
      companyVerified: false,
      bankVerified: false,
      documentsVerified: false,
    });

    await expect(featureGatingService.assertAccess('usr-1', 'publish_listing')).rejects.toThrow(
      FeatureGatingError
    );
  });
});

// =============================================================================
// getFeatureAccess
// =============================================================================

describe('featureGatingService.getFeatureAccess', () => {
  it('returns all features for an approved seller', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue({
      id: 'seller-1',
      status: 'approved',
      canPublish: true,
      profileComplete: true,
      companyVerified: true,
      bankVerified: true,
      documentsVerified: true,
    });

    const result = await featureGatingService.getFeatureAccess('usr-1');
    expect(result.status).toBe('approved');
    expect(result.features.view_portal.allowed).toBe(true);
    expect(result.features.publish_listing.allowed).toBe(true);
    expect(result.features.receive_payout.allowed).toBe(true);
  });

  it('returns all denied when seller not found', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue(null);

    const result = await featureGatingService.getFeatureAccess('usr-999');
    expect(result.status).toBe('incomplete');
    const actions: GatedAction[] = ['view_portal', 'create_draft', 'publish_listing', 'send_quote'];
    for (const action of actions) {
      expect(result.features[action].allowed).toBe(false);
      expect(result.features[action].reasonCode).toBe('SELLER_NOT_FOUND');
    }
  });
});

// =============================================================================
// logGatingDenial
// =============================================================================

describe('featureGatingService.logGatingDenial', () => {
  it('creates audit log entry when seller exists', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue({
      id: 'seller-1',
      status: 'incomplete',
      canPublish: false,
      profileComplete: false,
      companyVerified: false,
      bankVerified: false,
      documentsVerified: false,
    });
    prismaMock.sellerAuditLog.create.mockResolvedValue({ id: 'log-1' });

    await featureGatingService.logGatingDenial('usr-1', 'publish_listing', 'Not verified');

    expect(prismaMock.sellerAuditLog.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.sellerAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sellerId: 'seller-1',
          action: 'GATING_DENIED:publish_listing',
          entityType: 'feature_gating',
        }),
      })
    );
  });

  it('does not throw when seller not found', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue(null);
    await expect(
      featureGatingService.logGatingDenial('usr-999', 'send_quote', 'No seller')
    ).resolves.not.toThrow();
  });

  it('does not throw when DB write fails', async () => {
    prismaMock.sellerProfile.findUnique.mockResolvedValue({
      id: 'seller-1',
      status: 'approved',
      canPublish: true,
      profileComplete: true,
      companyVerified: true,
      bankVerified: true,
      documentsVerified: true,
    });
    prismaMock.sellerAuditLog.create.mockRejectedValue(new Error('DB error'));

    await expect(
      featureGatingService.logGatingDenial('usr-1', 'send_quote', 'denied')
    ).resolves.not.toThrow();
  });
});

// =============================================================================
// FeatureGatingError class
// =============================================================================

describe('FeatureGatingError', () => {
  it('has correct name, code, and message', () => {
    const err = new FeatureGatingError('Not allowed', 'NOT_VERIFIED');
    expect(err.name).toBe('FeatureGatingError');
    expect(err.code).toBe('NOT_VERIFIED');
    expect(err.message).toBe('Not allowed');
    expect(err.redirectTo).toBeUndefined();
  });

  it('includes redirectTo when provided', () => {
    const err = new FeatureGatingError('Go to onboarding', 'PROFILE_INCOMPLETE', '/onboarding');
    expect(err.redirectTo).toBe('/onboarding');
  });
});
