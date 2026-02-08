/**
 * Quote Service — Unit Tests
 *
 * Tests cover: generateQuoteNumber, createDraft, updateQuote, sendQuote,
 * getQuote, getQuotesByRFQ, getSellerQuotes, expireQuotes, deleteDraft,
 * getQuoteVersions, getQuoteHistory.
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
  createDraft,
  updateQuote,
  sendQuote,
  getQuote,
  getQuotesByRFQ,
  getSellerQuotes,
  expireQuotes,
  deleteDraft,
  getQuoteVersions,
  getQuoteHistory,
} from '../../../services/quoteService';

beforeEach(() => {
  resetMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRFQ(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rfq-1',
    rfqNumber: 'RFQ-2026-0001',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    itemId: 'item-1',
    status: 'under_review',
    deliveryLocation: 'Riyadh',
    ...overrides,
  };
}

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
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    notes: null,
    internalNotes: null,
    version: 1,
    isLatest: true,
    status: 'draft',
    sentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    rfq: createMockRFQ(),
    ...overrides,
  };
}

// =============================================================================
// createDraft
// =============================================================================

describe('createDraft', () => {
  const validInput = {
    rfqId: 'rfq-1',
    sellerId: 'seller-1',
    buyerId: 'buyer-1',
    unitPrice: 100,
    quantity: 10,
    deliveryDays: 7,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  it('creates a draft quote successfully', async () => {
    const rfq = createMockRFQ();
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);
    prismaMock.quote.findFirst.mockResolvedValueOnce(null); // no existing draft
    prismaMock.quote.findFirst.mockResolvedValueOnce(null); // generateQuoteNumber: no last quote
    const createdQuote = createMockQuote();
    prismaMock.quote.create.mockResolvedValue(createdQuote);
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await createDraft(validInput);

    expect(result.success).toBe(true);
    expect(result.quote).toBeDefined();
    expect(prismaMock.quote.create).toHaveBeenCalledOnce();
  });

  it('returns error when RFQ not found', async () => {
    prismaMock.itemRFQ.findUnique.mockResolvedValue(null);

    const result = await createDraft(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('RFQ not found');
  });

  it('returns error when RFQ is in blocked status', async () => {
    const rfq = createMockRFQ({ status: 'accepted' });
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);

    const result = await createDraft(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot create quote');
  });

  it('returns error for rejected RFQ', async () => {
    const rfq = createMockRFQ({ status: 'rejected' });
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);

    const result = await createDraft(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('rejected');
  });

  it('returns error when seller does not own RFQ', async () => {
    const rfq = createMockRFQ({ sellerId: 'other-seller' });
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);

    const result = await createDraft(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized: You do not own this RFQ');
  });

  it('returns error when draft already exists', async () => {
    const rfq = createMockRFQ();
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);
    prismaMock.quote.findFirst.mockResolvedValueOnce(createMockQuote()); // existing draft

    const result = await createDraft(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('draft quote already exists');
  });

  it('generates sequential quote numbers', async () => {
    const rfq = createMockRFQ();
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);
    prismaMock.quote.findFirst
      .mockResolvedValueOnce(null) // no existing draft
      .mockResolvedValueOnce({ quoteNumber: `QT-${new Date().getFullYear()}-0005` }); // last quote
    prismaMock.quote.create.mockResolvedValue(createMockQuote());
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    await createDraft(validInput);

    const createCall = prismaMock.quote.create.mock.calls[0][0];
    expect(createCall.data.quoteNumber).toBe(`QT-${new Date().getFullYear()}-0006`);
  });

  it('calculates totalPrice correctly with discount', async () => {
    const rfq = createMockRFQ();
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);
    prismaMock.quote.findFirst.mockResolvedValue(null);
    prismaMock.quote.create.mockResolvedValue(createMockQuote());
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    await createDraft({ ...validInput, discount: 50 });

    const createCall = prismaMock.quote.create.mock.calls[0][0];
    // unitPrice * quantity - discount = 100 * 10 - 50 = 950
    expect(createCall.data.totalPrice).toBe(950);
  });

  it('allows marketplace RFQ without sellerId', async () => {
    const rfq = createMockRFQ({ sellerId: null }); // marketplace RFQ
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);
    prismaMock.quote.findFirst.mockResolvedValue(null);
    prismaMock.quote.create.mockResolvedValue(createMockQuote());
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await createDraft(validInput);

    expect(result.success).toBe(true);
  });
});

// =============================================================================
// updateQuote
// =============================================================================

describe('updateQuote', () => {
  it('updates a draft quote directly', async () => {
    const existingQuote = createMockQuote({ status: 'draft', version: 1 });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);
    const updatedQuote = createMockQuote({ version: 2, unitPrice: 120 });
    prismaMock.quote.update.mockResolvedValue(updatedQuote);
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await updateQuote('quote-1', 'seller-1', { unitPrice: 120 });

    expect(result.success).toBe(true);
    expect(prismaMock.quote.update).toHaveBeenCalledOnce();
  });

  it('creates a revised version when updating sent quote', async () => {
    const existingQuote = createMockQuote({ status: 'sent', version: 1 });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);
    const updatedQuote = createMockQuote({ status: 'revised', version: 2 });
    prismaMock.quote.update.mockResolvedValue(updatedQuote);
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await updateQuote('quote-1', 'seller-1', { unitPrice: 90 });

    expect(result.success).toBe(true);
    const updateCall = prismaMock.quote.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('revised');
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await updateQuote('nonexistent', 'seller-1', { unitPrice: 90 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });

  it('returns error when seller does not own quote', async () => {
    const existingQuote = createMockQuote({ sellerId: 'other-seller' });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);

    const result = await updateQuote('quote-1', 'seller-1', { unitPrice: 90 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized: You do not own this quote');
  });

  it('returns error when updating expired quote', async () => {
    const existingQuote = createMockQuote({ status: 'expired' });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);

    const result = await updateQuote('quote-1', 'seller-1', { unitPrice: 90 });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot update quote');
  });

  it('returns error when updating accepted quote', async () => {
    const existingQuote = createMockQuote({ status: 'accepted' });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);

    const result = await updateQuote('quote-1', 'seller-1', { unitPrice: 90 });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot update quote');
  });
});

// =============================================================================
// sendQuote
// =============================================================================

describe('sendQuote', () => {
  it('sends a draft quote successfully', async () => {
    const existingQuote = createMockQuote({ status: 'draft' });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);
    const sentQuote = createMockQuote({ status: 'sent', sentAt: new Date() });
    prismaMock.quote.update.mockResolvedValue(sentQuote);
    prismaMock.itemRFQ.update.mockResolvedValue({});
    prismaMock.itemRFQEvent.create.mockResolvedValue({});
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await sendQuote('quote-1', 'seller-1');

    expect(result.success).toBe(true);
    expect(prismaMock.itemRFQ.update).toHaveBeenCalledOnce();
  });

  it('sends a revised quote successfully', async () => {
    const existingQuote = createMockQuote({ status: 'revised' });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);
    const sentQuote = createMockQuote({ status: 'sent' });
    prismaMock.quote.update.mockResolvedValue(sentQuote);
    prismaMock.itemRFQ.update.mockResolvedValue({});
    prismaMock.itemRFQEvent.create.mockResolvedValue({});
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await sendQuote('quote-1', 'seller-1');

    expect(result.success).toBe(true);
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await sendQuote('nonexistent', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });

  it('returns error when seller does not own quote', async () => {
    const existingQuote = createMockQuote({ sellerId: 'other-seller' });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);

    const result = await sendQuote('quote-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized: You do not own this quote');
  });

  it('returns error when sending already sent quote', async () => {
    const existingQuote = createMockQuote({ status: 'sent' });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);

    const result = await sendQuote('quote-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot send quote');
  });

  it('returns error when sending expired quote', async () => {
    const existingQuote = createMockQuote({
      status: 'draft',
      validUntil: new Date('2020-01-01'), // in the past
    });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);

    const result = await sendQuote('quote-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot send expired quote');
  });

  it('allows sending with sellerIds array', async () => {
    const existingQuote = createMockQuote({ sellerId: 'profile-1' });
    prismaMock.quote.findUnique.mockResolvedValue(existingQuote);
    prismaMock.quote.update.mockResolvedValue(createMockQuote({ status: 'sent' }));
    prismaMock.itemRFQ.update.mockResolvedValue({});
    prismaMock.itemRFQEvent.create.mockResolvedValue({});
    prismaMock.quoteVersion.create.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await sendQuote('quote-1', 'seller-1', ['seller-1', 'profile-1']);

    expect(result.success).toBe(true);
  });
});

// =============================================================================
// getQuote
// =============================================================================

describe('getQuote', () => {
  it('returns quote for authorized seller', async () => {
    const quote = createMockQuote({ versions: [], events: [] });
    prismaMock.quote.findUnique.mockResolvedValue(quote);

    const result = await getQuote('quote-1', 'seller-1');

    expect(result.success).toBe(true);
    expect(result.quote).toBeDefined();
  });

  it('returns quote for authorized buyer', async () => {
    const quote = createMockQuote({ versions: [], events: [] });
    prismaMock.quote.findUnique.mockResolvedValue(quote);

    const result = await getQuote('quote-1', 'buyer-1');

    expect(result.success).toBe(true);
  });

  it('returns error for unauthorized user', async () => {
    const quote = createMockQuote({ versions: [], events: [] });
    prismaMock.quote.findUnique.mockResolvedValue(quote);

    const result = await getQuote('quote-1', 'stranger');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await getQuote('nonexistent', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });
});

// =============================================================================
// getQuotesByRFQ
// =============================================================================

describe('getQuotesByRFQ', () => {
  it('returns quotes for RFQ when user is buyer', async () => {
    const rfq = createMockRFQ();
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);
    prismaMock.quote.findMany.mockResolvedValue([createMockQuote()]);

    const result = await getQuotesByRFQ('rfq-1', 'buyer-1');

    expect(result.success).toBe(true);
    expect(result.quotes).toHaveLength(1);
  });

  it('returns quotes for RFQ when user is seller', async () => {
    const rfq = createMockRFQ();
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);
    prismaMock.quote.findMany.mockResolvedValue([]);

    const result = await getQuotesByRFQ('rfq-1', 'seller-1');

    expect(result.success).toBe(true);
  });

  it('returns error when RFQ not found', async () => {
    prismaMock.itemRFQ.findUnique.mockResolvedValue(null);

    const result = await getQuotesByRFQ('nonexistent', 'buyer-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('RFQ not found');
  });

  it('returns error for unauthorized user', async () => {
    const rfq = createMockRFQ();
    prismaMock.itemRFQ.findUnique.mockResolvedValue(rfq);

    const result = await getQuotesByRFQ('rfq-1', 'stranger');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});

// =============================================================================
// getSellerQuotes
// =============================================================================

describe('getSellerQuotes', () => {
  it('returns paginated quotes for seller', async () => {
    const quotes = [createMockQuote()];
    prismaMock.quote.findMany.mockResolvedValue(quotes);
    prismaMock.quote.count.mockResolvedValue(1);

    const result = await getSellerQuotes('seller-1');

    expect(result.success).toBe(true);
    expect(result.quotes).toHaveLength(1);
    expect(result.pagination).toBeDefined();
    expect(result.pagination?.page).toBe(1);
    expect(result.pagination?.total).toBe(1);
  });

  it('applies status filter', async () => {
    prismaMock.quote.findMany.mockResolvedValue([]);
    prismaMock.quote.count.mockResolvedValue(0);

    await getSellerQuotes('seller-1', { status: 'sent' });

    const findManyCall = prismaMock.quote.findMany.mock.calls[0][0];
    expect(findManyCall.where.status).toBe('sent');
  });

  it('applies pagination params', async () => {
    prismaMock.quote.findMany.mockResolvedValue([]);
    prismaMock.quote.count.mockResolvedValue(50);

    const result = await getSellerQuotes('seller-1', { page: 3, limit: 10 });

    expect(result.pagination?.page).toBe(3);
    expect(result.pagination?.totalPages).toBe(5);
    const findManyCall = prismaMock.quote.findMany.mock.calls[0][0];
    expect(findManyCall.skip).toBe(20);
    expect(findManyCall.take).toBe(10);
  });
});

// =============================================================================
// expireQuotes
// =============================================================================

describe('expireQuotes', () => {
  it('expires quotes past validUntil', async () => {
    const expiredQuotes = [
      createMockQuote({ id: 'q1', status: 'draft', validUntil: new Date('2020-01-01') }),
      createMockQuote({ id: 'q2', status: 'sent', validUntil: new Date('2020-06-01') }),
    ];
    prismaMock.quote.findMany.mockResolvedValue(expiredQuotes);
    prismaMock.quote.update.mockResolvedValue({});
    prismaMock.quoteEvent.create.mockResolvedValue({});

    const result = await expireQuotes();

    expect(result.success).toBe(true);
    expect(result.expiredCount).toBe(2);
    expect(prismaMock.quote.update).toHaveBeenCalledTimes(2);
  });

  it('returns 0 when no quotes to expire', async () => {
    prismaMock.quote.findMany.mockResolvedValue([]);

    const result = await expireQuotes();

    expect(result.success).toBe(true);
    expect(result.expiredCount).toBe(0);
  });
});

// =============================================================================
// deleteDraft
// =============================================================================

describe('deleteDraft', () => {
  it('deletes a draft quote', async () => {
    const quote = createMockQuote({ status: 'draft' });
    prismaMock.quote.findUnique.mockResolvedValue(quote);
    prismaMock.quote.delete.mockResolvedValue(quote);

    const result = await deleteDraft('quote-1', 'seller-1');

    expect(result.success).toBe(true);
    expect(prismaMock.quote.delete).toHaveBeenCalledOnce();
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await deleteDraft('nonexistent', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });

  it('returns error when seller does not own quote', async () => {
    const quote = createMockQuote({ sellerId: 'other-seller' });
    prismaMock.quote.findUnique.mockResolvedValue(quote);

    const result = await deleteDraft('quote-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when deleting non-draft quote', async () => {
    const quote = createMockQuote({ status: 'sent' });
    prismaMock.quote.findUnique.mockResolvedValue(quote);

    const result = await deleteDraft('quote-1', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Only draft quotes can be deleted');
  });
});

// =============================================================================
// getQuoteVersions
// =============================================================================

describe('getQuoteVersions', () => {
  it('returns versions for authorized user', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());
    prismaMock.quoteVersion.findMany.mockResolvedValue([
      { id: 'v1', version: 2 },
      { id: 'v2', version: 1 },
    ]);

    const result = await getQuoteVersions('quote-1', 'seller-1');

    expect(result.success).toBe(true);
    expect(result.versions).toHaveLength(2);
  });

  it('returns error for unauthorized user', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());

    const result = await getQuoteVersions('quote-1', 'stranger');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await getQuoteVersions('nonexistent', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });
});

// =============================================================================
// getQuoteHistory
// =============================================================================

describe('getQuoteHistory', () => {
  it('returns events for authorized user', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());
    prismaMock.quoteEvent.findMany.mockResolvedValue([
      { id: 'e1', eventType: 'QUOTE_CREATED' },
    ]);

    const result = await getQuoteHistory('quote-1', 'buyer-1');

    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(1);
  });

  it('returns error for unauthorized user', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(createMockQuote());

    const result = await getQuoteHistory('quote-1', 'stranger');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('returns error when quote not found', async () => {
    prismaMock.quote.findUnique.mockResolvedValue(null);

    const result = await getQuoteHistory('nonexistent', 'seller-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Quote not found');
  });
});
