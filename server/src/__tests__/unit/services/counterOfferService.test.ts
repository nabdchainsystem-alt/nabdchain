/**
 * Counter-Offer Service — Unit Tests
 *
 * Tests cover: createCounterOffer, acceptCounterOffer, rejectCounterOffer,
 * getCounterOffers, getCounterOffer, getSellerPendingCounterOffers,
 * expireCounterOffers.
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

import {
  createCounterOffer,
  acceptCounterOffer,
  rejectCounterOffer,
  getCounterOffers,
  getCounterOffer,
  getSellerPendingCounterOffers,
  expireCounterOffers,
} from '../../../services/counterOfferService';

beforeEach(() => {
  resetMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockQuote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quote-1',
    quoteNumber: 'QT-2026-0001',
    rfqId: 'rfq-1',
    sellerId: 'seller-1',
    buyerId: 'buyer-1',
    unitPrice: 100,
    quantity: 10,
    totalPrice: 1000,
    currency: 'SAR',
    discount: null,
    discountPercent: null,
    deliveryDays: 7,
    deliveryTerms: null,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notes: null,
    status: 'sent',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    rfq: { id: 'rfq-1', rfqNumber: 'RFQ-2026-0001' },
    ...overrides,
  };
}

function createMockCounterOffer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'co-1',
    quoteId: 'quote-1',
    buyerId: 'buyer-1',
    proposedPrice: 800,
    proposedQuantity: null,
    proposedDeliveryDays: null,
    message: null,
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sellerResponse: null,
    respondedBy: null,
    respondedAt: null,
    revisedQuoteId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    quote: createMockQuote(),
    ...overrides,
  };
}

// =============================================================================
// createCounterOffer
// =============================================================================

describe('createCounterOffer', () => {
  const validInput = {
    quoteId: 'quote-1',
    buyerId: 'buyer-1',
    proposedPrice: 800,
  };

  it('creates a counter-offer successfully', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());
    prismaMock.counterOffer.findFirst.mockResolvedValue(null); // no existing pending
    const created = createMockCounterOffer();
    prismaMock.counterOffer.create.mockResolvedValue(created);
    prismaMock.counterOfferEvent.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await createCounterOffer(validInput);

    expect(result.success).toBe(true);
    expect(result.counterOffer).toBeDefined();
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await createCounterOffer(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });

  it('returns error when buyer does not own quote', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote({ buyerId: 'other-buyer' }));

    const result = await createCounterOffer(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when quote is in draft status', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote({ status: 'draft' }));

    const result = await createCounterOffer(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot counter-offer');
  });

  it('allows counter-offer on revised quote', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote({ status: 'revised' }));
    prismaMock.counterOffer.findFirst.mockResolvedValue(null);
    prismaMock.counterOffer.create.mockResolvedValue(createMockCounterOffer());
    prismaMock.counterOfferEvent.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await createCounterOffer(validInput);

    expect(result.success).toBe(true);
  });

  it('returns error when quote has expired', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(
      createMockQuote({ validUntil: new Date('2020-01-01') })
    );

    const result = await createCounterOffer(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('expired quote');
  });

  it('returns error when pending counter-offer exists', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());
    prismaMock.counterOffer.findFirst.mockResolvedValue(createMockCounterOffer());

    const result = await createCounterOffer(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('pending counter-offer');
  });

  it('returns error when proposed price is zero', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());
    prismaMock.counterOffer.findFirst.mockResolvedValue(null);

    const result = await createCounterOffer({ ...validInput, proposedPrice: 0 });

    expect(result.success).toBe(false);
    expect(result.error).toContain('greater than 0');
  });

  it('returns error when proposed price is negative', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());
    prismaMock.counterOffer.findFirst.mockResolvedValue(null);

    const result = await createCounterOffer({ ...validInput, proposedPrice: -100 });

    expect(result.success).toBe(false);
    expect(result.error).toContain('greater than 0');
  });
});

// =============================================================================
// acceptCounterOffer
// =============================================================================

describe('acceptCounterOffer', () => {
  it('accepts a counter-offer and creates revised quote', async () => {
    const co = createMockCounterOffer();
    prismaMock.counterOffer.findUnique.mockResolvedValue(co);
    // Transaction mocks - uses prismaMock directly
    prismaMock.counterOffer.update
      .mockResolvedValueOnce({ ...co, status: 'accepted' }) // accept
      .mockResolvedValueOnce({}); // link revised quote
    prismaMock.quote.update.mockResolvedValue({
      ...co.quote,
      version: 2,
      status: 'revised',
      totalPrice: 800,
      unitPrice: 80,
    });
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.counterOfferEvent.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await acceptCounterOffer('co-1', 'seller-1', 'Agreed');

    expect(result.success).toBe(true);
    expect(result.counterOffer).toBeDefined();
    expect(result.revisedQuote).toBeDefined();
  });

  it('returns error when counter-offer not found', async () => {
    prismaMock.counterOffer.findUnique.mockResolvedValue(null);

    const result = await acceptCounterOffer('nonexistent', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Counter-offer not found');
  });

  it('returns error when seller does not own the quote', async () => {
    const co = createMockCounterOffer({
      quote: createMockQuote({ sellerId: 'other-seller' }),
    });
    prismaMock.counterOffer.findUnique.mockResolvedValue(co);

    const result = await acceptCounterOffer('co-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when counter-offer is not pending', async () => {
    const co = createMockCounterOffer({ status: 'rejected' });
    prismaMock.counterOffer.findUnique.mockResolvedValue(co);

    const result = await acceptCounterOffer('co-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot respond');
  });

  it('auto-expires and returns error when counter-offer is expired', async () => {
    const co = createMockCounterOffer({ expiresAt: new Date('2020-01-01') });
    prismaMock.counterOffer.findUnique.mockResolvedValue(co);
    prismaMock.counterOffer.update.mockResolvedValue({});

    const result = await acceptCounterOffer('co-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Counter-offer has expired');
    expect(prismaMock.counterOffer.update).toHaveBeenCalledWith({
      where: { id: 'co-1' },
      data: { status: 'expired' },
    });
  });
});

// =============================================================================
// rejectCounterOffer
// =============================================================================

describe('rejectCounterOffer', () => {
  it('rejects a counter-offer successfully', async () => {
    const co = createMockCounterOffer();
    prismaMock.counterOffer.findUnique.mockResolvedValue(co);
    prismaMock.counterOffer.update.mockResolvedValue({ ...co, status: 'rejected' });
    prismaMock.counterOfferEvent.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await rejectCounterOffer('co-1', 'seller-1', 'Price too low');

    expect(result.success).toBe(true);
    expect(result.counterOffer).toBeDefined();
  });

  it('returns error when counter-offer not found', async () => {
    prismaMock.counterOffer.findUnique.mockResolvedValue(null);

    const result = await rejectCounterOffer('nonexistent', 'seller-1', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Counter-offer not found');
  });

  it('returns error when seller does not own the quote', async () => {
    const co = createMockCounterOffer({
      quote: createMockQuote({ sellerId: 'other-seller' }),
    });
    prismaMock.counterOffer.findUnique.mockResolvedValue(co);

    const result = await rejectCounterOffer('co-1', 'seller-1', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when counter-offer is not pending', async () => {
    const co = createMockCounterOffer({ status: 'accepted' });
    prismaMock.counterOffer.findUnique.mockResolvedValue(co);

    const result = await rejectCounterOffer('co-1', 'seller-1', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot respond');
  });
});

// =============================================================================
// getCounterOffers
// =============================================================================

describe('getCounterOffers', () => {
  it('returns counter-offers for authorized seller', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());
    prismaMock.counterOffer.findMany.mockResolvedValue([createMockCounterOffer()]);

    const result = await getCounterOffers('quote-1', 'seller-1');

    expect(result.success).toBe(true);
    expect(result.counterOffers).toHaveLength(1);
  });

  it('returns counter-offers for authorized buyer', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());
    prismaMock.counterOffer.findMany.mockResolvedValue([]);

    const result = await getCounterOffers('quote-1', 'buyer-1');

    expect(result.success).toBe(true);
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await getCounterOffers('nonexistent', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });

  it('returns error for unauthorized user', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());

    const result = await getCounterOffers('quote-1', 'stranger');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});

// =============================================================================
// getCounterOffer (single)
// =============================================================================

describe('getCounterOffer', () => {
  it('returns counter-offer for buyer', async () => {
    prismaMock.counterOffer.findUnique.mockResolvedValue(createMockCounterOffer());

    const result = await getCounterOffer('co-1', 'buyer-1');

    expect(result.success).toBe(true);
    expect(result.counterOffer).toBeDefined();
  });

  it('returns counter-offer for seller', async () => {
    prismaMock.counterOffer.findUnique.mockResolvedValue(createMockCounterOffer());

    const result = await getCounterOffer('co-1', 'seller-1');

    expect(result.success).toBe(true);
  });

  it('returns error when not found', async () => {
    prismaMock.counterOffer.findUnique.mockResolvedValue(null);

    const result = await getCounterOffer('nonexistent', 'buyer-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Counter-offer not found');
  });

  it('returns error for unauthorized user', async () => {
    prismaMock.counterOffer.findUnique.mockResolvedValue(createMockCounterOffer());

    const result = await getCounterOffer('co-1', 'stranger');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});

// =============================================================================
// getSellerPendingCounterOffers
// =============================================================================

describe('getSellerPendingCounterOffers', () => {
  it('returns pending counter-offers for seller', async () => {
    const offers = [createMockCounterOffer()];
    prismaMock.counterOffer.findMany.mockResolvedValue(offers);

    const result = await getSellerPendingCounterOffers('seller-1');

    expect(result.success).toBe(true);
    expect(result.counterOffers).toHaveLength(1);
    expect(result.count).toBe(1);
  });

  it('returns empty when no pending counter-offers', async () => {
    prismaMock.counterOffer.findMany.mockResolvedValue([]);

    const result = await getSellerPendingCounterOffers('seller-1');

    expect(result.success).toBe(true);
    expect(result.counterOffers).toHaveLength(0);
    expect(result.count).toBe(0);
  });
});

// =============================================================================
// expireCounterOffers
// =============================================================================

describe('expireCounterOffers', () => {
  it('expires counter-offers past their expiration date', async () => {
    const expired = [
      createMockCounterOffer({ id: 'co-1', expiresAt: new Date('2020-01-01') }),
      createMockCounterOffer({ id: 'co-2', expiresAt: new Date('2020-06-01') }),
    ];
    prismaMock.counterOffer.findMany.mockResolvedValue(expired);
    prismaMock.counterOffer.update.mockResolvedValue({});
    prismaMock.counterOfferEvent.create.mockResolvedValue({});

    const result = await expireCounterOffers();

    expect(result.success).toBe(true);
    expect(result.expiredCount).toBe(2);
    expect(prismaMock.counterOffer.update).toHaveBeenCalledTimes(2);
  });

  it('returns 0 when no counter-offers to expire', async () => {
    prismaMock.counterOffer.findMany.mockResolvedValue([]);

    const result = await expireCounterOffers();

    expect(result.success).toBe(true);
    expect(result.expiredCount).toBe(0);
  });
});
