/**
 * Seller Payout Service — Unit Tests
 *
 * Tests cover: payout number generation, eligibility calculations, payout
 * lifecycle (create, approve, process, settle, fail, hold), settings
 * management, queries, and error handling. Prisma is fully mocked.
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

import { sellerPayoutService } from '../../../services/sellerPayoutService';
import { createMockPayout } from '../../factories';

beforeEach(() => {
  resetMocks();
});

// =============================================================================
// Service methods (Prisma mocked)
// =============================================================================

describe('sellerPayoutService', () => {
  // ---------------------------------------------------------------------------
  // generatePayoutNumber
  // ---------------------------------------------------------------------------

  describe('generatePayoutNumber', () => {
    it('generates first payout number for the year', async () => {
      prismaMock.sellerPayout.findFirst.mockResolvedValue(null);

      const num = await sellerPayoutService.generatePayoutNumber();

      const year = new Date().getFullYear();
      expect(num).toBe(`PAY-OUT-${year}-0001`);
    });

    it('increments from the last payout number', async () => {
      const year = new Date().getFullYear();
      prismaMock.sellerPayout.findFirst.mockResolvedValue({
        payoutNumber: `PAY-OUT-${year}-0042`,
      });

      const num = await sellerPayoutService.generatePayoutNumber();

      expect(num).toBe(`PAY-OUT-${year}-0043`);
    });
  });

  // ---------------------------------------------------------------------------
  // approvePayout
  // ---------------------------------------------------------------------------

  describe('approvePayout', () => {
    it('approves a pending payout', async () => {
      const payout = createMockPayout({ id: 'p-1', status: 'pending' });
      const updated = { ...payout, status: 'processing' };
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);
      prismaMock.sellerPayout.update.mockResolvedValue(updated);
      prismaMock.payoutEvent.create.mockResolvedValue({});

      const result = await sellerPayoutService.approvePayout('p-1', 'admin-1');

      expect(result.success).toBe(true);
      expect(result.payout!.status).toBe('processing');
    });

    it('rejects when payout not found', async () => {
      prismaMock.sellerPayout.findUnique.mockResolvedValue(null);

      const result = await sellerPayoutService.approvePayout('nonexistent', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payout not found');
    });

    it('rejects when payout is not pending', async () => {
      const payout = createMockPayout({ status: 'processing' });
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);

      const result = await sellerPayoutService.approvePayout(payout.id, 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot approve payout');
    });
  });

  // ---------------------------------------------------------------------------
  // processPayout
  // ---------------------------------------------------------------------------

  describe('processPayout', () => {
    it('processes an on_hold payout', async () => {
      const payout = createMockPayout({ id: 'p-1', status: 'on_hold' });
      const updated = { ...payout, status: 'processing' };
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);
      prismaMock.sellerPayout.update.mockResolvedValue(updated);
      prismaMock.payoutEvent.create.mockResolvedValue({});

      const result = await sellerPayoutService.processPayout('p-1', 'admin-1');

      expect(result.success).toBe(true);
    });

    it('rejects invalid transition', async () => {
      const payout = createMockPayout({ status: 'settled' });
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);

      const result = await sellerPayoutService.processPayout(payout.id, 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot process payout');
    });
  });

  // ---------------------------------------------------------------------------
  // settlePayout
  // ---------------------------------------------------------------------------

  describe('settlePayout', () => {
    it('settles a processing payout', async () => {
      const payout = createMockPayout({ id: 'p-1', status: 'processing' });
      const updated = { ...payout, status: 'settled', bankReference: 'BR-123' };
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);
      prismaMock.sellerPayout.update.mockResolvedValue(updated);
      prismaMock.payoutEvent.create.mockResolvedValue({});

      const result = await sellerPayoutService.settlePayout('p-1', 'BR-123', 'admin-1');

      expect(result.success).toBe(true);
      expect(result.payout!.bankReference).toBe('BR-123');
    });

    it('rejects settling a pending payout', async () => {
      const payout = createMockPayout({ status: 'pending' });
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);

      const result = await sellerPayoutService.settlePayout(payout.id, 'BR-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot settle payout');
    });

    it('rejects when payout not found', async () => {
      prismaMock.sellerPayout.findUnique.mockResolvedValue(null);

      const result = await sellerPayoutService.settlePayout('nonexistent', 'BR-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payout not found');
    });
  });

  // ---------------------------------------------------------------------------
  // failPayout
  // ---------------------------------------------------------------------------

  describe('failPayout', () => {
    it('marks a pending payout as failed', async () => {
      const payout = createMockPayout({ id: 'p-1', status: 'pending' });
      const updated = { ...payout, status: 'failed', failureReason: 'Bank rejected' };
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);
      prismaMock.sellerPayout.update.mockResolvedValue(updated);
      prismaMock.payoutEvent.create.mockResolvedValue({});

      const result = await sellerPayoutService.failPayout('p-1', 'Bank rejected', 'admin-1');

      expect(result.success).toBe(true);
      expect(result.payout!.status).toBe('failed');
    });

    it('rejects failing a settled payout', async () => {
      const payout = createMockPayout({ status: 'settled' });
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);

      const result = await sellerPayoutService.failPayout(payout.id, 'reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot fail a settled payout');
    });
  });

  // ---------------------------------------------------------------------------
  // holdPayout
  // ---------------------------------------------------------------------------

  describe('holdPayout', () => {
    it('puts a pending payout on hold', async () => {
      const payout = createMockPayout({ id: 'p-1', status: 'pending' });
      const updated = { ...payout, status: 'on_hold', holdReason: 'Dispute open' };
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);
      prismaMock.sellerPayout.update.mockResolvedValue(updated);
      prismaMock.payoutEvent.create.mockResolvedValue({});

      const result = await sellerPayoutService.holdPayout('p-1', 'Dispute open', undefined, 'admin-1');

      expect(result.success).toBe(true);
      expect(result.payout!.status).toBe('on_hold');
    });

    it('rejects holding a settled payout', async () => {
      const payout = createMockPayout({ status: 'settled' });
      prismaMock.sellerPayout.findUnique.mockResolvedValue(payout);

      const result = await sellerPayoutService.holdPayout(payout.id, 'reason');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot hold a settled payout');
    });
  });

  // ---------------------------------------------------------------------------
  // getSellerPayouts
  // ---------------------------------------------------------------------------

  describe('getSellerPayouts', () => {
    it('returns paginated payouts for seller', async () => {
      const payouts = [createMockPayout()];
      prismaMock.sellerPayout.findMany.mockResolvedValue(payouts);
      prismaMock.sellerPayout.count.mockResolvedValue(1);

      const result = await sellerPayoutService.getSellerPayouts('seller-1');

      expect(result.payouts).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('applies status filter', async () => {
      prismaMock.sellerPayout.findMany.mockResolvedValue([]);
      prismaMock.sellerPayout.count.mockResolvedValue(0);

      await sellerPayoutService.getSellerPayouts('seller-1', { status: 'settled' });

      const call = prismaMock.sellerPayout.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('settled');
    });

    it('applies date range filter', async () => {
      prismaMock.sellerPayout.findMany.mockResolvedValue([]);
      prismaMock.sellerPayout.count.mockResolvedValue(0);

      await sellerPayoutService.getSellerPayouts('seller-1', {
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });

      const call = prismaMock.sellerPayout.findMany.mock.calls[0][0];
      expect(call.where.createdAt.gte).toBeInstanceOf(Date);
      expect(call.where.createdAt.lte).toBeInstanceOf(Date);
    });
  });

  // ---------------------------------------------------------------------------
  // getPayoutDetails
  // ---------------------------------------------------------------------------

  describe('getPayoutDetails', () => {
    it('returns payout with line items and events', async () => {
      const payout = { ...createMockPayout(), lineItems: [], events: [] };
      prismaMock.sellerPayout.findFirst.mockResolvedValue(payout);

      const result = await sellerPayoutService.getPayoutDetails('p-1', 'seller-1');

      expect(result).not.toBeNull();
      expect(prismaMock.sellerPayout.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p-1', sellerId: 'seller-1' },
        }),
      );
    });

    it('returns null when payout not found', async () => {
      prismaMock.sellerPayout.findFirst.mockResolvedValue(null);

      const result = await sellerPayoutService.getPayoutDetails('nonexistent', 'seller-1');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getPayoutStats
  // ---------------------------------------------------------------------------

  describe('getPayoutStats', () => {
    it('aggregates payout statistics', async () => {
      prismaMock.sellerPayout.groupBy.mockResolvedValue([
        { status: 'settled', _sum: { netAmount: 10000 }, _count: { id: 5 } },
        { status: 'pending', _sum: { netAmount: 2000 }, _count: { id: 2 } },
        { status: 'processing', _sum: { netAmount: 1000 }, _count: { id: 1 } },
      ]);

      // Mock calculateEligiblePayouts dependency chain
      prismaMock.sellerPayoutSettings.findUnique.mockResolvedValue(null);
      prismaMock.sellerPayoutSettings.create.mockResolvedValue({
        sellerId: 'seller-1',
        payoutFrequency: 'weekly',
        minPayoutAmount: 100,
        holdPeriodDays: 7,
        autoPayoutEnabled: false,
      });
      prismaMock.payoutLineItem.findMany.mockResolvedValue([]);
      prismaMock.marketplaceInvoice.findMany.mockResolvedValue([]);

      const stats = await sellerPayoutService.getPayoutStats('seller-1');

      expect(stats.totalPaid).toBe(10000);
      expect(stats.pendingAmount).toBe(3000);
      expect(stats.payoutCount.settled).toBe(5);
      expect(stats.payoutCount.pending).toBe(2);
      expect(stats.payoutCount.processing).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getPendingPayouts
  // ---------------------------------------------------------------------------

  describe('getPendingPayouts', () => {
    it('returns all pending payouts', async () => {
      const payouts = [createMockPayout({ status: 'pending' })];
      prismaMock.sellerPayout.findMany.mockResolvedValue(payouts);

      const result = await sellerPayoutService.getPendingPayouts();

      expect(result).toHaveLength(1);
      expect(prismaMock.sellerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending' },
          orderBy: { createdAt: 'asc' },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getPayoutsByStatus
  // ---------------------------------------------------------------------------

  describe('getPayoutsByStatus', () => {
    it('returns payouts filtered by status', async () => {
      prismaMock.sellerPayout.findMany.mockResolvedValue([]);

      await sellerPayoutService.getPayoutsByStatus('settled');

      expect(prismaMock.sellerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'settled' },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getPayoutSettings / updatePayoutSettings
  // ---------------------------------------------------------------------------

  describe('getPayoutSettings', () => {
    it('returns existing settings', async () => {
      const settings = {
        sellerId: 'seller-1',
        payoutFrequency: 'weekly',
        minPayoutAmount: 100,
        holdPeriodDays: 7,
        autoPayoutEnabled: false,
      };
      prismaMock.sellerPayoutSettings.findUnique.mockResolvedValue(settings);

      const result = await sellerPayoutService.getPayoutSettings('seller-1');

      expect(result.payoutFrequency).toBe('weekly');
    });

    it('creates default settings when none exist', async () => {
      prismaMock.sellerPayoutSettings.findUnique.mockResolvedValue(null);
      const defaultSettings = {
        sellerId: 'seller-1',
        payoutFrequency: 'weekly',
        minPayoutAmount: 100,
        disputeHoldEnabled: true,
        holdPeriodDays: 7,
        autoPayoutEnabled: false,
      };
      prismaMock.sellerPayoutSettings.create.mockResolvedValue(defaultSettings);

      const result = await sellerPayoutService.getPayoutSettings('seller-1');

      expect(result.payoutFrequency).toBe('weekly');
      expect(prismaMock.sellerPayoutSettings.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePayoutSettings', () => {
    it('updates payout settings', async () => {
      const existing = {
        sellerId: 'seller-1',
        payoutFrequency: 'weekly',
        minPayoutAmount: 100,
        holdPeriodDays: 7,
        autoPayoutEnabled: false,
      };
      prismaMock.sellerPayoutSettings.findUnique.mockResolvedValue(existing);
      prismaMock.sellerPayoutSettings.update.mockResolvedValue({
        ...existing,
        minPayoutAmount: 200,
        autoPayoutEnabled: true,
      });

      const result = await sellerPayoutService.updatePayoutSettings('seller-1', {
        minPayoutAmount: 200,
        autoPayoutEnabled: true,
      });

      expect(result.minPayoutAmount).toBe(200);
      expect(result.autoPayoutEnabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getPayoutHistory
  // ---------------------------------------------------------------------------

  describe('getPayoutHistory', () => {
    it('returns events for seller payout', async () => {
      prismaMock.sellerPayout.findFirst.mockResolvedValue(createMockPayout());
      prismaMock.payoutEvent.findMany.mockResolvedValue([
        { id: 'e-1', eventType: 'PAYOUT_CREATED', createdAt: new Date() },
      ]);

      const result = await sellerPayoutService.getPayoutHistory('p-1', 'seller-1');

      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe('PAYOUT_CREATED');
    });

    it('returns empty array when payout not found', async () => {
      prismaMock.sellerPayout.findFirst.mockResolvedValue(null);

      const result = await sellerPayoutService.getPayoutHistory('nonexistent', 'seller-1');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // createPayout (integration of multiple sub-operations)
  // ---------------------------------------------------------------------------

  describe('createPayout', () => {
    it('rejects when seller has no verified bank account', async () => {
      prismaMock.sellerBank.findFirst.mockResolvedValue(null);

      const result = await sellerPayoutService.createPayout({
        sellerId: 'seller-1',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-07'),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Seller must have a verified bank account');
    });

    it('rejects when no eligible invoices', async () => {
      prismaMock.sellerBank.findFirst.mockResolvedValue({
        sellerId: 'seller-1',
        iban: 'SA1234',
        bankName: 'Al Rajhi',
        accountHolderName: 'Test',
        verificationStatus: 'approved',
      });

      // Mock getPayoutSettings chain
      prismaMock.sellerPayoutSettings.findUnique.mockResolvedValue({
        sellerId: 'seller-1',
        holdPeriodDays: 7,
        minPayoutAmount: 100,
      });
      prismaMock.payoutLineItem.findMany.mockResolvedValue([]);
      prismaMock.marketplaceInvoice.findMany.mockResolvedValue([]);

      const result = await sellerPayoutService.createPayout({
        sellerId: 'seller-1',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-07'),
      });

      expect(result.success).toBe(false);
    });
  });
});
