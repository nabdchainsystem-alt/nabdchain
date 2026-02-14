import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock portalApiClient before importing the service
vi.mock('./portalApiClient', () => ({
  portalApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getAccessToken: vi.fn(() => 'mock-token'),
    baseUrl: 'http://localhost:3001',
  },
}));

vi.mock('../../../utils/logger', () => ({
  portalApiLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { quoteService } from './quoteService';
import { portalApiClient } from './portalApiClient';

describe('quoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Create Draft
  // ---------------------------------------------------------------------------

  describe('createDraft', () => {
    it('posts to /api/items/quotes with quote data', async () => {
      const data = { rfqId: 'rfq-1', unitPrice: 25, quantity: 100, validityDays: 30 };
      const quote = { id: 'q-1', status: 'draft', ...data };
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(quote);

      const result = await quoteService.createDraft(data as never);
      expect(result).toEqual(quote);

      expect(portalApiClient.post).toHaveBeenCalledWith('/api/items/quotes', data);
    });

    it('throws error from server response', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('RFQ not in UNDER_REVIEW status'),
      );
      await expect(quoteService.createDraft({} as never)).rejects.toThrow('RFQ not in UNDER_REVIEW status');
    });

    it('throws generic error on failure', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to create quote'));
      await expect(quoteService.createDraft({} as never)).rejects.toThrow('Failed to create quote');
    });
  });

  // ---------------------------------------------------------------------------
  // Get Quotes
  // ---------------------------------------------------------------------------

  describe('getQuotes', () => {
    it('fetches quotes with default (no filter)', async () => {
      const response = { quotes: [], pagination: { page: 1, total: 0 } };
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response);
      const result = await quoteService.getQuotes();
      expect(result).toEqual(response);

      expect(portalApiClient.get).toHaveBeenCalledWith('/api/items/quotes');
    });

    it('appends filter params', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ quotes: [] });
      await quoteService.getQuotes({ status: 'sent' as never, page: 2, limit: 10 });

      const calledWith = (portalApiClient.get as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledWith).toContain('status=sent');
      expect(calledWith).toContain('page=2');
      expect(calledWith).toContain('limit=10');
    });

    it('throws on error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to fetch quotes'));
      await expect(quoteService.getQuotes()).rejects.toThrow('Failed to fetch quotes');
    });
  });

  // ---------------------------------------------------------------------------
  // Get Single Quote
  // ---------------------------------------------------------------------------

  describe('getQuote', () => {
    it('returns quote on success', async () => {
      const quote = { id: 'q-1', status: 'draft' };
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(quote);
      const result = await quoteService.getQuote('q-1');
      expect(result).toEqual(quote);
    });

    it('returns null on error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await quoteService.getQuote('missing');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Get Quotes by RFQ
  // ---------------------------------------------------------------------------

  describe('getQuotesByRFQ', () => {
    it('calls /api/items/quotes/rfq/:rfqId', async () => {
      const quotes = [{ id: 'q-1' }, { id: 'q-2' }];
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(quotes);
      const result = await quoteService.getQuotesByRFQ('rfq-42');

      expect(result).toEqual(quotes);
      expect(portalApiClient.get).toHaveBeenCalledWith('/api/items/quotes/rfq/rfq-42');
    });

    it('returns empty array on error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await quoteService.getQuotesByRFQ('no-rfq');
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Update Quote
  // ---------------------------------------------------------------------------

  describe('updateQuote', () => {
    it('sends PUT with update data', async () => {
      const updateData = { unitPrice: 30, notes: 'Revised' };
      (portalApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'q-1', unitPrice: 30 });
      const result = await quoteService.updateQuote('q-1', updateData as never);

      expect(result).toEqual({ id: 'q-1', unitPrice: 30 });
      expect(portalApiClient.put).toHaveBeenCalledWith('/api/items/quotes/q-1', updateData);
    });

    it('returns null on error', async () => {
      (portalApiClient.put as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await quoteService.updateQuote('missing', {} as never);
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Send Quote
  // ---------------------------------------------------------------------------

  describe('sendQuote', () => {
    it('posts to /send endpoint', async () => {
      const quote = { id: 'q-1', status: 'sent' };
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce(quote);
      const result = await quoteService.sendQuote('q-1');

      expect(result).toEqual(quote);
      expect(portalApiClient.post).toHaveBeenCalledWith('/api/items/quotes/q-1/send');
    });

    it('returns null on error', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await quoteService.sendQuote('missing');
      expect(result).toBeNull();
    });

    it('returns null on any error (including conflict)', async () => {
      (portalApiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Quote already sent'));
      const result = await quoteService.sendQuote('q-1');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Versions & History
  // ---------------------------------------------------------------------------

  describe('getQuoteVersions', () => {
    it('fetches version history', async () => {
      const versions = [{ version: 1 }, { version: 2 }];
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(versions);
      const result = await quoteService.getQuoteVersions('q-1');
      expect(result).toEqual(versions);
    });

    it('returns empty array on error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await quoteService.getQuoteVersions('missing');
      expect(result).toEqual([]);
    });
  });

  describe('getQuoteHistory', () => {
    it('fetches event history', async () => {
      const events = [{ event: 'created' }, { event: 'sent' }];
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(events);
      const result = await quoteService.getQuoteHistory('q-1');
      expect(result).toEqual(events);
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Draft
  // ---------------------------------------------------------------------------

  describe('deleteDraft', () => {
    it('sends DELETE and returns true on success', async () => {
      (portalApiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});
      const result = await quoteService.deleteDraft('q-1');
      expect(result).toBe(true);

      expect(portalApiClient.delete).toHaveBeenCalledWith('/api/items/quotes/q-1');
    });

    it('returns false on error', async () => {
      (portalApiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await quoteService.deleteDraft('missing');
      expect(result).toBe(false);
    });

    it('returns false on any error (including forbidden)', async () => {
      (portalApiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Cannot delete sent quote'));
      const result = await quoteService.deleteDraft('q-1');
      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Attachments
  // ---------------------------------------------------------------------------

  describe('getAttachments', () => {
    it('fetches attachments for a quote', async () => {
      const attachments = [{ id: 'att-1', name: 'spec.pdf' }];
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(attachments);
      const result = await quoteService.getAttachments('q-1');

      expect(result).toEqual(attachments);
      expect(portalApiClient.get).toHaveBeenCalledWith('/api/items/quotes/q-1/attachments');
    });

    it('returns empty array on error', async () => {
      (portalApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await quoteService.getAttachments('missing');
      expect(result).toEqual([]);
    });
  });

  describe('removeAttachment', () => {
    it('sends DELETE for specific attachment', async () => {
      (portalApiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});
      const result = await quoteService.removeAttachment('q-1', 'att-1');
      expect(result).toBe(true);

      expect(portalApiClient.delete).toHaveBeenCalledWith('/api/items/quotes/q-1/attachments/att-1');
    });

    it('returns false on error', async () => {
      (portalApiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));
      const result = await quoteService.removeAttachment('q-1', 'att-999');
      expect(result).toBe(false);
    });
  });
});
