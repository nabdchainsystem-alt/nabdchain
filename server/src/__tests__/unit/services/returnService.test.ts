/**
 * Return Service — Unit Tests
 *
 * Tests cover: createReturn, getReturn, getBuyerReturns, getSellerReturns,
 * getSellerReturnStats, approveReturn, rejectReturn, markReturnShipped,
 * confirmReturnReceived, processRefund, closeReturn, getReturnHistory,
 * getReturnByDispute.
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

import { returnService } from '../../../services/returnService';
import { createMockDispute } from '../../factories';

beforeEach(() => {
  resetMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockReturn(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ret-1',
    returnNumber: 'RET-2026-0001',
    disputeId: 'dispute-1',
    orderId: 'order-1',
    orderNumber: 'ORD-2026-0001',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    returnType: 'full_return',
    returnReason: 'damaged_goods',
    returnItems: JSON.stringify([
      { itemId: 'item-1', itemName: 'Widget', sku: 'W-001', quantity: 5, unitPrice: 100 },
    ]),
    returnAddress: null,
    status: 'requested',
    approvedAt: null,
    approvedBy: null,
    approvalNotes: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    shippedAt: null,
    returnTrackingNumber: null,
    returnCarrier: null,
    receivedAt: null,
    receivedBy: null,
    receivedCondition: null,
    receivedNotes: null,
    refundAmount: null,
    refundStatus: null,
    refundProcessedAt: null,
    closedAt: null,
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  };
}

const mockReturnItems = [
  { itemId: 'item-1', itemName: 'Widget', sku: 'W-001', quantity: 5, unitPrice: 100 },
];

const mockReturnAddress = {
  name: 'Test Seller',
  street1: '123 Main St',
  city: 'Riyadh',
  postalCode: '12345',
  country: 'SA',
};

// =============================================================================
// createReturn
// =============================================================================

describe('createReturn', () => {
  it('creates a return request from dispute', async () => {
    const dispute = createMockDispute();
    prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(null); // no existing return
    prismaMock.marketplaceReturn.findFirst.mockResolvedValue(null); // generateReturnNumber
    const created = createMockReturn();
    prismaMock.marketplaceReturn.create.mockResolvedValue(created);
    prismaMock.marketplaceReturnEvent.create.mockResolvedValue({});

    const result = await returnService.createReturn({
      disputeId: 'dispute-1',
      returnType: 'full_return',
      returnItems: mockReturnItems,
    });

    expect(result.success).toBe(true);
    expect(result.return).toBeDefined();
  });

  it('returns error when dispute not found', async () => {
    prismaMock.marketplaceDispute.findUnique.mockResolvedValue(null);

    const result = await returnService.createReturn({
      disputeId: 'nonexistent',
      returnType: 'full_return',
      returnItems: mockReturnItems,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Dispute not found');
  });

  it('returns error when return already exists for dispute', async () => {
    prismaMock.marketplaceDispute.findUnique.mockResolvedValue(createMockDispute());
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(createMockReturn());

    const result = await returnService.createReturn({
      disputeId: 'dispute-1',
      returnType: 'full_return',
      returnItems: mockReturnItems,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('generates sequential return numbers', async () => {
    const dispute = createMockDispute();
    prismaMock.marketplaceDispute.findUnique.mockResolvedValue(dispute);
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(null);
    prismaMock.marketplaceReturn.findFirst.mockResolvedValue({
      returnNumber: `RET-${new Date().getFullYear()}-0005`,
    });
    prismaMock.marketplaceReturn.create.mockResolvedValue(createMockReturn());
    prismaMock.marketplaceReturnEvent.create.mockResolvedValue({});

    await returnService.createReturn({
      disputeId: 'dispute-1',
      returnType: 'full_return',
      returnItems: mockReturnItems,
    });

    const createCall = prismaMock.marketplaceReturn.create.mock.calls[0][0];
    expect(createCall.data.returnNumber).toBe(`RET-${new Date().getFullYear()}-0006`);
  });
});

// =============================================================================
// getReturn
// =============================================================================

describe('getReturn', () => {
  it('returns return for authorized buyer', async () => {
    const ret = {
      ...createMockReturn(),
      dispute: { id: 'dispute-1', disputeNumber: 'DSP-001', reason: 'damaged', description: 'test' },
      events: [],
    };
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(ret);

    const result = await returnService.getReturn('ret-1', 'buyer-1');

    expect(result).not.toBeNull();
    expect(result.id).toBe('ret-1');
  });

  it('returns null for unauthorized user', async () => {
    const ret = {
      ...createMockReturn(),
      dispute: { id: 'dispute-1', disputeNumber: 'DSP-001', reason: 'damaged', description: 'test' },
      events: [],
    };
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(ret);

    const result = await returnService.getReturn('ret-1', 'stranger');

    expect(result).toBeNull();
  });

  it('returns null when return not found', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(null);

    const result = await returnService.getReturn('nonexistent', 'buyer-1');

    expect(result).toBeNull();
  });
});

// =============================================================================
// approveReturn
// =============================================================================

describe('approveReturn', () => {
  it('approves a requested return', async () => {
    const ret = createMockReturn({ status: 'requested' });
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(ret);
    prismaMock.marketplaceReturn.update.mockResolvedValue({
      ...ret,
      status: 'approved',
      returnAddress: JSON.stringify(mockReturnAddress),
    });
    prismaMock.marketplaceReturnEvent.create.mockResolvedValue({});

    const result = await returnService.approveReturn({
      returnId: 'ret-1',
      sellerId: 'seller-1',
      returnAddress: mockReturnAddress,
      approvalNotes: 'Approved',
    });

    expect(result.success).toBe(true);
  });

  it('returns error when return not found', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(null);

    const result = await returnService.approveReturn({
      returnId: 'nonexistent',
      sellerId: 'seller-1',
      returnAddress: mockReturnAddress,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Return request not found');
  });

  it('returns error when seller does not own return', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ sellerId: 'other-seller' })
    );

    const result = await returnService.approveReturn({
      returnId: 'ret-1',
      sellerId: 'seller-1',
      returnAddress: mockReturnAddress,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when return is not in requested status', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ status: 'approved' })
    );

    const result = await returnService.approveReturn({
      returnId: 'ret-1',
      sellerId: 'seller-1',
      returnAddress: mockReturnAddress,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not in requested status');
  });
});

// =============================================================================
// rejectReturn
// =============================================================================

describe('rejectReturn', () => {
  it('rejects a requested return', async () => {
    const ret = createMockReturn({ status: 'requested' });
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(ret);
    prismaMock.marketplaceReturn.update.mockResolvedValue({ ...ret, status: 'rejected' });
    prismaMock.marketplaceReturnEvent.create.mockResolvedValue({});

    const result = await returnService.rejectReturn('ret-1', 'seller-1', 'Items were fine');

    expect(result.success).toBe(true);
  });

  it('returns error when return not found', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(null);

    const result = await returnService.rejectReturn('nonexistent', 'seller-1', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Return request not found');
  });

  it('returns error when seller does not own return', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ sellerId: 'other-seller' })
    );

    const result = await returnService.rejectReturn('ret-1', 'seller-1', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when return is not in requested status', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ status: 'in_transit' })
    );

    const result = await returnService.rejectReturn('ret-1', 'seller-1', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not in requested status');
  });
});

// =============================================================================
// markReturnShipped
// =============================================================================

describe('markReturnShipped', () => {
  it('marks an approved return as shipped', async () => {
    const ret = createMockReturn({ status: 'approved' });
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(ret);
    prismaMock.marketplaceReturn.update.mockResolvedValue({ ...ret, status: 'in_transit' });
    prismaMock.marketplaceReturnEvent.create.mockResolvedValue({});

    const result = await returnService.markReturnShipped({
      returnId: 'ret-1',
      buyerId: 'buyer-1',
      trackingNumber: 'TRK-RET-001',
      carrier: 'Aramex',
    });

    expect(result.success).toBe(true);
  });

  it('returns error when buyer does not own return', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ buyerId: 'other-buyer' })
    );

    const result = await returnService.markReturnShipped({
      returnId: 'ret-1',
      buyerId: 'buyer-1',
      trackingNumber: 'TRK-001',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when return is not approved', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ status: 'requested' })
    );

    const result = await returnService.markReturnShipped({
      returnId: 'ret-1',
      buyerId: 'buyer-1',
      trackingNumber: 'TRK-001',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('approved before shipping');
  });
});

// =============================================================================
// confirmReturnReceived
// =============================================================================

describe('confirmReturnReceived', () => {
  it('confirms receipt of an in-transit return', async () => {
    const ret = createMockReturn({ status: 'in_transit' });
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(ret);
    prismaMock.marketplaceReturn.update.mockResolvedValue({ ...ret, status: 'received' });
    prismaMock.marketplaceReturnEvent.create.mockResolvedValue({});

    const result = await returnService.confirmReturnReceived({
      returnId: 'ret-1',
      sellerId: 'seller-1',
      condition: 'as_expected',
      notes: 'All items received',
    });

    expect(result.success).toBe(true);
  });

  it('returns error when return is not in transit', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ status: 'approved' })
    );

    const result = await returnService.confirmReturnReceived({
      returnId: 'ret-1',
      sellerId: 'seller-1',
      condition: 'as_expected',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not in transit');
  });
});

// =============================================================================
// processRefund
// =============================================================================

describe('processRefund', () => {
  it('processes refund for a received return', async () => {
    const ret = createMockReturn({ status: 'received' });
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(ret);
    prismaMock.marketplaceReturn.update.mockResolvedValue({ ...ret, status: 'refund_processed' });
    prismaMock.marketplaceReturnEvent.create.mockResolvedValue({});

    const result = await returnService.processRefund('ret-1', 'seller-1', 500);

    expect(result.success).toBe(true);
  });

  it('returns error when return is not received', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ status: 'in_transit' })
    );

    const result = await returnService.processRefund('ret-1', 'seller-1', 500);

    expect(result.success).toBe(false);
    expect(result.error).toContain('received before processing refund');
  });

  it('returns error when seller does not own return', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ status: 'received', sellerId: 'other-seller' })
    );

    const result = await returnService.processRefund('ret-1', 'seller-1', 500);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});

// =============================================================================
// closeReturn
// =============================================================================

describe('closeReturn', () => {
  it('closes a refund-processed return', async () => {
    const ret = createMockReturn({ status: 'refund_processed' });
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(ret);
    prismaMock.marketplaceReturn.update.mockResolvedValue({ ...ret, status: 'closed' });
    prismaMock.marketplaceReturnEvent.create.mockResolvedValue({});

    const result = await returnService.closeReturn('ret-1', 'seller-1');

    expect(result.success).toBe(true);
  });

  it('returns error when closing from invalid status', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ status: 'requested' })
    );

    const result = await returnService.closeReturn('ret-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot close return');
  });

  it('returns error for unauthorized user', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(
      createMockReturn({ status: 'refund_processed' })
    );

    const result = await returnService.closeReturn('ret-1', 'stranger');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});

// =============================================================================
// getBuyerReturns
// =============================================================================

describe('getBuyerReturns', () => {
  it('returns paginated returns for buyer', async () => {
    const returns = [createMockReturn()];
    prismaMock.marketplaceReturn.findMany.mockResolvedValue(returns);
    prismaMock.marketplaceReturn.count.mockResolvedValue(1);

    const result = await returnService.getBuyerReturns('buyer-1');

    expect(result.returns).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
  });

  it('applies status filter', async () => {
    prismaMock.marketplaceReturn.findMany.mockResolvedValue([]);
    prismaMock.marketplaceReturn.count.mockResolvedValue(0);

    await returnService.getBuyerReturns('buyer-1', { status: 'approved' });

    const call = prismaMock.marketplaceReturn.findMany.mock.calls[0][0];
    expect(call.where.status).toBe('approved');
  });
});

// =============================================================================
// getSellerReturns
// =============================================================================

describe('getSellerReturns', () => {
  it('returns paginated returns for seller', async () => {
    prismaMock.marketplaceReturn.findMany.mockResolvedValue([createMockReturn()]);
    prismaMock.marketplaceReturn.count.mockResolvedValue(1);

    const result = await returnService.getSellerReturns('seller-1');

    expect(result.returns).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

// =============================================================================
// getSellerReturnStats
// =============================================================================

describe('getSellerReturnStats', () => {
  it('returns stats grouped by status', async () => {
    prismaMock.marketplaceReturn.groupBy.mockResolvedValue([
      { status: 'requested', _count: 3 },
      { status: 'approved', _count: 2 },
      { status: 'in_transit', _count: 1 },
    ]);

    const result = await returnService.getSellerReturnStats('seller-1');

    expect(result.total).toBe(6);
    expect(result.requested).toBe(3);
    expect(result.approved).toBe(2);
    expect(result.inTransit).toBe(1);
    expect(result.received).toBe(0);
  });
});

// =============================================================================
// getReturnHistory
// =============================================================================

describe('getReturnHistory', () => {
  it('returns events for authorized user', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue({
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
    });
    prismaMock.marketplaceReturnEvent.findMany.mockResolvedValue([
      { id: 'e1', eventType: 'RETURN_REQUESTED', metadata: null },
    ]);

    const result = await returnService.getReturnHistory('ret-1', 'buyer-1');

    expect(result).toHaveLength(1);
  });

  it('returns empty array for unauthorized user', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue({
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
    });

    const result = await returnService.getReturnHistory('ret-1', 'stranger');

    expect(result).toHaveLength(0);
  });

  it('returns empty array when return not found', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(null);

    const result = await returnService.getReturnHistory('nonexistent', 'buyer-1');

    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// getReturnByDispute
// =============================================================================

describe('getReturnByDispute', () => {
  it('returns return for dispute', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(createMockReturn());

    const result = await returnService.getReturnByDispute('dispute-1', 'buyer-1');

    expect(result).not.toBeNull();
    expect(result.returnNumber).toBe('RET-2026-0001');
  });

  it('returns null for unauthorized user', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(createMockReturn());

    const result = await returnService.getReturnByDispute('dispute-1', 'stranger');

    expect(result).toBeNull();
  });

  it('returns null when no return for dispute', async () => {
    prismaMock.marketplaceReturn.findUnique.mockResolvedValue(null);

    const result = await returnService.getReturnByDispute('nonexistent', 'buyer-1');

    expect(result).toBeNull();
  });
});
