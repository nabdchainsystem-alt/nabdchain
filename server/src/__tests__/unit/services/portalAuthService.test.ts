/**
 * Portal Auth Service — Unit Tests
 *
 * Tests cover: validation helpers, buyer/seller signup, login flows,
 * token refresh, and error handling. Prisma and token generation are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../../setup';

// vi.mock must be in the test file for proper hoisting
vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../../auth/portalToken', () => ({
  generateTokenPair: vi.fn(() => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 43200,
  })),
}));

import {
  portalAuthService,
  validateEmail,
  validatePassword,
  validateCompanyName,
  validateFullName,
} from '../../../services/portalAuthService';

import { createMockUser, createMockBuyerProfile, createMockSellerProfile } from '../../factories';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Pure validation functions (no Prisma)
// =============================================================================

describe('Validation helpers', () => {
  describe('validateEmail', () => {
    it('accepts valid email', () => {
      expect(validateEmail('user@example.com')).toEqual({ valid: true });
    });

    it('rejects empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error!.code).toBe('INVALID_EMAIL');
    });

    it('rejects email without @', () => {
      const result = validateEmail('invalid');
      expect(result.valid).toBe(false);
    });

    it('rejects email without domain', () => {
      const result = validateEmail('user@');
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('accepts strong password', () => {
      expect(validatePassword('Str0ng!Pass')).toEqual({ valid: true });
    });

    it('rejects short password', () => {
      const result = validatePassword('Ab1!');
      expect(result.valid).toBe(false);
      expect(result.error!.code).toBe('WEAK_PASSWORD');
    });

    it('rejects password without uppercase', () => {
      const result = validatePassword('str0ng!pass');
      expect(result.valid).toBe(false);
    });

    it('rejects password without lowercase', () => {
      const result = validatePassword('STR0NG!PASS');
      expect(result.valid).toBe(false);
    });

    it('rejects password without number', () => {
      const result = validatePassword('Strong!Pass');
      expect(result.valid).toBe(false);
    });

    it('rejects password without special char', () => {
      const result = validatePassword('Str0ngPass1');
      expect(result.valid).toBe(false);
    });

    it('rejects empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCompanyName', () => {
    it('accepts valid company name', () => {
      expect(validateCompanyName('Test Corp')).toEqual({ valid: true });
    });

    it('rejects too short company name', () => {
      const result = validateCompanyName('A');
      expect(result.valid).toBe(false);
      expect(result.error!.code).toBe('INVALID_COMPANY');
    });

    it('rejects too long company name', () => {
      const result = validateCompanyName('X'.repeat(101));
      expect(result.valid).toBe(false);
    });

    it('rejects empty company name', () => {
      const result = validateCompanyName('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFullName', () => {
    it('accepts valid name', () => {
      expect(validateFullName('John Doe')).toEqual({ valid: true });
    });

    it('rejects too short name', () => {
      const result = validateFullName('A');
      expect(result.valid).toBe(false);
      expect(result.error!.code).toBe('INVALID_NAME');
    });

    it('rejects empty name', () => {
      const result = validateFullName('');
      expect(result.valid).toBe(false);
    });
  });
});

// =============================================================================
// Service methods (Prisma mocked)
// =============================================================================

describe('portalAuthService', () => {
  // ---------------------------------------------------------------------------
  // createBuyerAccount
  // ---------------------------------------------------------------------------

  describe('createBuyerAccount', () => {
    it('creates buyer account successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // email does not exist

      const user = createMockUser({ portalRole: 'buyer' });
      const buyerProfile = createMockBuyerProfile({ userId: user.id });

      // $transaction mock calls the function with prismaMock as tx
      prismaMock.user.create.mockResolvedValue(user);
      prismaMock.buyerProfile.create.mockResolvedValue(buyerProfile);

      const result = await portalAuthService.createBuyerAccount({
        fullName: 'Test Buyer',
        email: 'buyer@test.com',
        password: 'Str0ng!Pass',
        companyName: 'Test Corp',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.portalRole).toBe('buyer');
      expect(result.buyer).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.redirectTo).toBe('/portal/buyer/dashboard');
    });

    it('rejects duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser());

      const result = await portalAuthService.createBuyerAccount({
        fullName: 'Test Buyer',
        email: 'buyer@test.com',
        password: 'Str0ng!Pass',
        companyName: 'Test Corp',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('EMAIL_EXISTS');
    });

    it('rejects invalid email', async () => {
      const result = await portalAuthService.createBuyerAccount({
        fullName: 'Test Buyer',
        email: 'invalid',
        password: 'Str0ng!Pass',
        companyName: 'Test Corp',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('INVALID_EMAIL');
    });

    it('rejects weak password', async () => {
      const result = await portalAuthService.createBuyerAccount({
        fullName: 'Test Buyer',
        email: 'buyer@test.com',
        password: 'weak',
        companyName: 'Test Corp',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('WEAK_PASSWORD');
    });

    it('rejects invalid full name', async () => {
      const result = await portalAuthService.createBuyerAccount({
        fullName: 'A',
        email: 'buyer@test.com',
        password: 'Str0ng!Pass',
        companyName: 'Test Corp',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('INVALID_NAME');
    });

    it('rejects invalid company name', async () => {
      const result = await portalAuthService.createBuyerAccount({
        fullName: 'Test Buyer',
        email: 'buyer@test.com',
        password: 'Str0ng!Pass',
        companyName: 'A',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('INVALID_COMPANY');
    });
  });

  // ---------------------------------------------------------------------------
  // createSellerAccount
  // ---------------------------------------------------------------------------

  describe('createSellerAccount', () => {
    it('creates seller account successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.sellerProfile.findUnique.mockResolvedValue(null); // slug is unique

      const user = createMockUser({ portalRole: 'seller' });
      const sellerProfile = createMockSellerProfile({ userId: user.id });

      prismaMock.user.create.mockResolvedValue(user);
      prismaMock.sellerProfile.create.mockResolvedValue(sellerProfile);

      const result = await portalAuthService.createSellerAccount({
        fullName: 'Test Seller',
        email: 'seller@test.com',
        password: 'Str0ng!Pass',
        displayName: 'My Store',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.portalRole).toBe('seller');
      expect(result.seller).toBeDefined();
      expect(result.redirectTo).toBe('/portal/seller/onboarding');
    });

    it('rejects duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser());

      const result = await portalAuthService.createSellerAccount({
        fullName: 'Test Seller',
        email: 'seller@test.com',
        password: 'Str0ng!Pass',
        displayName: 'My Store',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('EMAIL_EXISTS');
    });
  });

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------

  describe('login', () => {
    it('rejects login when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await portalAuthService.login({
        email: 'unknown@test.com',
        password: 'Str0ng!Pass',
        portalType: 'buyer',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects login when user has no password hash', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser({ passwordHash: null }));

      const result = await portalAuthService.login({
        email: 'user@test.com',
        password: 'Str0ng!Pass',
        portalType: 'buyer',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects login when portal role does not match', async () => {
      // We need to create a user with a valid v2 password hash
      // Since hashPassword is internal, we simulate with a pre-hashed v2 password
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(32).toString('hex');
      const hash = crypto.pbkdf2Sync('Str0ng!Pass', salt, 100000, 64, 'sha512').toString('hex');
      const passwordHash = `v2:${salt}:${hash}`;

      const user = createMockUser({
        portalRole: 'seller',
        passwordHash,
        portalStatus: 'active',
      });
      prismaMock.user.findUnique.mockResolvedValue(user);

      const result = await portalAuthService.login({
        email: 'user@test.com',
        password: 'Str0ng!Pass',
        portalType: 'buyer',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('WRONG_PORTAL');
    });

    it('rejects login for suspended account', async () => {
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(32).toString('hex');
      const hash = crypto.pbkdf2Sync('Str0ng!Pass', salt, 100000, 64, 'sha512').toString('hex');
      const passwordHash = `v2:${salt}:${hash}`;

      const user = createMockUser({
        portalRole: 'buyer',
        passwordHash,
        portalStatus: 'suspended',
      });
      prismaMock.user.findUnique.mockResolvedValue(user);

      const result = await portalAuthService.login({
        email: 'user@test.com',
        password: 'Str0ng!Pass',
        portalType: 'buyer',
      });

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  // ---------------------------------------------------------------------------
  // getBuyerProfile
  // ---------------------------------------------------------------------------

  describe('getBuyerProfile', () => {
    it('returns buyer profile for user', async () => {
      const profile = createMockBuyerProfile();
      prismaMock.buyerProfile.findUnique.mockResolvedValue(profile);

      const result = await portalAuthService.getBuyerProfile('usr-1');

      expect(result).toEqual(profile);
      expect(prismaMock.buyerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'usr-1' },
      });
    });

    it('returns null when no profile exists', async () => {
      prismaMock.buyerProfile.findUnique.mockResolvedValue(null);

      const result = await portalAuthService.getBuyerProfile('unknown');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getUserForTokenRefresh
  // ---------------------------------------------------------------------------

  describe('getUserForTokenRefresh', () => {
    it('returns token payload for active buyer', async () => {
      const user = {
        id: 'usr-1',
        email: 'buyer@test.com',
        portalRole: 'buyer',
        portalStatus: 'active',
        buyerProfile: { id: 'bp-1' },
      };
      prismaMock.user.findUnique.mockResolvedValue(user);

      const result = await portalAuthService.getUserForTokenRefresh('usr-1');

      expect(result).not.toBeNull();
      expect(result!.userId).toBe('usr-1');
      expect(result!.portalRole).toBe('buyer');
      expect(result!.buyerId).toBe('bp-1');
    });

    it('returns token payload for active seller', async () => {
      const user = {
        id: 'usr-2',
        email: 'seller@test.com',
        portalRole: 'seller',
        portalStatus: 'active',
        buyerProfile: null,
      };
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.sellerProfile.findUnique.mockResolvedValue({ id: 'sp-1' });

      const result = await portalAuthService.getUserForTokenRefresh('usr-2');

      expect(result).not.toBeNull();
      expect(result!.portalRole).toBe('seller');
      expect(result!.sellerId).toBe('sp-1');
    });

    it('returns null for suspended user', async () => {
      const user = {
        id: 'usr-3',
        email: 'suspended@test.com',
        portalRole: 'buyer',
        portalStatus: 'suspended',
        buyerProfile: null,
      };
      prismaMock.user.findUnique.mockResolvedValue(user);

      const result = await portalAuthService.getUserForTokenRefresh('usr-3');

      expect(result).toBeNull();
    });

    it('returns null for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await portalAuthService.getUserForTokenRefresh('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null for user without portal role', async () => {
      const user = {
        id: 'usr-4',
        email: 'norole@test.com',
        portalRole: null,
        portalStatus: null,
        buyerProfile: null,
      };
      prismaMock.user.findUnique.mockResolvedValue(user);

      const result = await portalAuthService.getUserForTokenRefresh('usr-4');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // submitForReview
  // ---------------------------------------------------------------------------

  describe('submitForReview', () => {
    it('returns error when seller profile not found', async () => {
      prismaMock.sellerProfile.findUnique.mockResolvedValue(null);

      const result = await portalAuthService.submitForReview('unknown');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Seller profile not found');
    });

    it('returns error when company info is missing', async () => {
      const profile = createMockSellerProfile({ company: null });
      prismaMock.sellerProfile.findUnique.mockResolvedValue(profile);

      const result = await portalAuthService.submitForReview('usr-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Company information is required');
    });

    it('returns error when address is missing', async () => {
      const profile = createMockSellerProfile({
        company: { legalName: 'Corp' },
        address: null,
      });
      prismaMock.sellerProfile.findUnique.mockResolvedValue(profile);

      const result = await portalAuthService.submitForReview('usr-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Business address is required');
    });

    it('returns error when contact is missing', async () => {
      const profile = createMockSellerProfile({
        company: { legalName: 'Corp' },
        address: { city: 'Riyadh' },
        contact: null,
      });
      prismaMock.sellerProfile.findUnique.mockResolvedValue(profile);

      const result = await portalAuthService.submitForReview('usr-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Contact information is required');
    });

    it('returns error when bank info is missing', async () => {
      const profile = createMockSellerProfile({
        company: { legalName: 'Corp' },
        address: { city: 'Riyadh' },
        contact: { businessEmail: 'biz@test.com' },
        bank: null,
      });
      prismaMock.sellerProfile.findUnique.mockResolvedValue(profile);

      const result = await portalAuthService.submitForReview('usr-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Banking information is required');
    });

    it('submits for review when all info is present', async () => {
      const profile = createMockSellerProfile({
        company: { legalName: 'Corp' },
        address: { city: 'Riyadh' },
        contact: { businessEmail: 'biz@test.com' },
        bank: { iban: 'SA1234567890' },
      });
      prismaMock.sellerProfile.findUnique.mockResolvedValue(profile);
      prismaMock.sellerProfile.update.mockResolvedValue({ ...profile, status: 'pending_review' });

      const result = await portalAuthService.submitForReview('usr-1');

      expect(result.success).toBe(true);
      expect(prismaMock.sellerProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'pending_review',
            profileComplete: true,
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // calculateCompletedSteps
  // ---------------------------------------------------------------------------

  describe('calculateCompletedSteps', () => {
    it('returns empty array for empty profile', () => {
      const steps = portalAuthService.calculateCompletedSteps({});
      expect(steps).toEqual([]);
    });

    it('returns step 1 when company info is complete', () => {
      const steps = portalAuthService.calculateCompletedSteps({
        company: { legalName: 'Corp', crNumber: '123' },
      });
      expect(steps).toContain(1);
    });

    it('returns multiple completed steps', () => {
      const steps = portalAuthService.calculateCompletedSteps({
        company: { legalName: 'Corp', crNumber: '123' },
        address: { city: 'Riyadh', street: 'Main St' },
        contact: { businessEmail: 'biz@test.com', phoneNumber: '123456' },
        bank: { iban: 'SA123' },
        documents: [{ id: 'doc-1' }],
        shortDescription: 'Test store',
        slug: 'test-store',
      });
      expect(steps).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
});
