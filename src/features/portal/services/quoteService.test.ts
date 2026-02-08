import { describe, it, expect, vi, beforeEach } from 'vitest';
import { quoteService } from './quoteService';

// Mock dependencies
vi.mock('../../../config/api', () => ({
  API_URL: 'http://localhost:3001/api',
  API_BASE_URL: 'http://localhost:3001',
}));

vi.mock('../../../utils/logger', () => ({
  portalApiLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const TOKEN = 'test-bearer-token';

function mockFetchOk(data: unknown) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status: number, body: Record<string, unknown> = {}) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

function mockFetch404() {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: () => Promise.resolve({}),
  });
}

describe('quoteService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  // ---------------------------------------------------------------------------
  // Create Draft
  // ---------------------------------------------------------------------------

  describe('createDraft', () => {
    it('posts to /api/items/quotes with quote data', async () => {
      const data = { rfqId: 'rfq-1', unitPrice: 25, quantity: 100, validityDays: 30 };
      const quote = { id: 'q-1', status: 'draft', ...data };
      mockFetchOk(quote);

      const result = await quoteService.createDraft(TOKEN, data as never);
      expect(result).toEqual(quote);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/quotes');
      expect(opts.method).toBe('POST');
      expect(opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
      expect(JSON.parse(opts.body)).toEqual(data);
    });

    it('throws error from server response', async () => {
      mockFetchError(400, { error: 'RFQ not in UNDER_REVIEW status' });
      await expect(quoteService.createDraft(TOKEN, {} as never)).rejects.toThrow('RFQ not in UNDER_REVIEW status');
    });

    it('throws generic error on parse failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('parse fail')),
      });
      await expect(quoteService.createDraft(TOKEN, {} as never)).rejects.toThrow('Failed to create quote');
    });
  });

  // ---------------------------------------------------------------------------
  // Get Quotes
  // ---------------------------------------------------------------------------

  describe('getQuotes', () => {
    it('fetches quotes with default (no filter)', async () => {
      const response = { quotes: [], pagination: { page: 1, total: 0 } };
      mockFetchOk(response);
      const result = await quoteService.getQuotes(TOKEN);
      expect(result).toEqual(response);

      const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('/api/items/quotes');
    });

    it('appends filter params', async () => {
      mockFetchOk({ quotes: [] });
      await quoteService.getQuotes(TOKEN, { status: 'sent' as never, page: 2, limit: 10 });

      const url: string = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(url).toContain('status=sent');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });

    it('throws on error', async () => {
      mockFetchError(500);
      await expect(quoteService.getQuotes(TOKEN)).rejects.toThrow('Failed to fetch quotes');
    });
  });

  // ---------------------------------------------------------------------------
  // Get Single Quote
  // ---------------------------------------------------------------------------

  describe('getQuote', () => {
    it('returns quote on success', async () => {
      const quote = { id: 'q-1', status: 'draft' };
      mockFetchOk(quote);
      const result = await quoteService.getQuote(TOKEN, 'q-1');
      expect(result).toEqual(quote);
    });

    it('returns null on 404', async () => {
      mockFetch404();
      const result = await quoteService.getQuote(TOKEN, 'missing');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Get Quotes by RFQ
  // ---------------------------------------------------------------------------

  describe('getQuotesByRFQ', () => {
    it('calls /api/items/quotes/rfq/:rfqId', async () => {
      const quotes = [{ id: 'q-1' }, { id: 'q-2' }];
      mockFetchOk(quotes);
      const result = await quoteService.getQuotesByRFQ(TOKEN, 'rfq-42');

      expect(result).toEqual(quotes);
      const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/quotes/rfq/rfq-42');
    });

    it('returns empty array on 404', async () => {
      mockFetch404();
      const result = await quoteService.getQuotesByRFQ(TOKEN, 'no-rfq');
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Update Quote
  // ---------------------------------------------------------------------------

  describe('updateQuote', () => {
    it('sends PUT with update data', async () => {
      const updateData = { unitPrice: 30, notes: 'Revised' };
      mockFetchOk({ id: 'q-1', unitPrice: 30 });
      const result = await quoteService.updateQuote(TOKEN, 'q-1', updateData as never);

      expect(result).toEqual({ id: 'q-1', unitPrice: 30 });
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/quotes/q-1');
      expect(opts.method).toBe('PUT');
      expect(JSON.parse(opts.body)).toEqual(updateData);
    });

    it('returns null on 404', async () => {
      mockFetch404();
      const result = await quoteService.updateQuote(TOKEN, 'missing', {} as never);
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Send Quote
  // ---------------------------------------------------------------------------

  describe('sendQuote', () => {
    it('posts to /send endpoint', async () => {
      const quote = { id: 'q-1', status: 'sent' };
      mockFetchOk(quote);
      const result = await quoteService.sendQuote(TOKEN, 'q-1');

      expect(result).toEqual(quote);
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/quotes/q-1/send');
      expect(opts.method).toBe('POST');
    });

    it('returns null on 404', async () => {
      mockFetch404();
      const result = await quoteService.sendQuote(TOKEN, 'missing');
      expect(result).toBeNull();
    });

    it('throws on other errors', async () => {
      mockFetchError(409, { error: 'Quote already sent' });
      await expect(quoteService.sendQuote(TOKEN, 'q-1')).rejects.toThrow('Quote already sent');
    });
  });

  // ---------------------------------------------------------------------------
  // Versions & History
  // ---------------------------------------------------------------------------

  describe('getQuoteVersions', () => {
    it('fetches version history', async () => {
      const versions = [{ version: 1 }, { version: 2 }];
      mockFetchOk(versions);
      const result = await quoteService.getQuoteVersions(TOKEN, 'q-1');
      expect(result).toEqual(versions);
    });

    it('returns empty array on 404', async () => {
      mockFetch404();
      const result = await quoteService.getQuoteVersions(TOKEN, 'missing');
      expect(result).toEqual([]);
    });
  });

  describe('getQuoteHistory', () => {
    it('fetches event history', async () => {
      const events = [{ event: 'created' }, { event: 'sent' }];
      mockFetchOk(events);
      const result = await quoteService.getQuoteHistory(TOKEN, 'q-1');
      expect(result).toEqual(events);
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Draft
  // ---------------------------------------------------------------------------

  describe('deleteDraft', () => {
    it('sends DELETE and returns true on success', async () => {
      mockFetchOk({});
      const result = await quoteService.deleteDraft(TOKEN, 'q-1');
      expect(result).toBe(true);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/quotes/q-1');
      expect(opts.method).toBe('DELETE');
    });

    it('returns false on 404', async () => {
      mockFetch404();
      const result = await quoteService.deleteDraft(TOKEN, 'missing');
      expect(result).toBe(false);
    });

    it('throws on other errors', async () => {
      mockFetchError(403, { error: 'Cannot delete sent quote' });
      await expect(quoteService.deleteDraft(TOKEN, 'q-1')).rejects.toThrow('Cannot delete sent quote');
    });
  });

  // ---------------------------------------------------------------------------
  // Attachments
  // ---------------------------------------------------------------------------

  describe('getAttachments', () => {
    it('fetches attachments for a quote', async () => {
      const attachments = [{ id: 'att-1', name: 'spec.pdf' }];
      mockFetchOk(attachments);
      const result = await quoteService.getAttachments(TOKEN, 'q-1');

      expect(result).toEqual(attachments);
      const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/quotes/q-1/attachments');
    });

    it('returns empty array on 404', async () => {
      mockFetch404();
      const result = await quoteService.getAttachments(TOKEN, 'missing');
      expect(result).toEqual([]);
    });
  });

  describe('removeAttachment', () => {
    it('sends DELETE for specific attachment', async () => {
      mockFetchOk({});
      const result = await quoteService.removeAttachment(TOKEN, 'q-1', 'att-1');
      expect(result).toBe(true);

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/items/quotes/q-1/attachments/att-1');
      expect(opts.method).toBe('DELETE');
    });

    it('returns false on 404', async () => {
      mockFetch404();
      const result = await quoteService.removeAttachment(TOKEN, 'q-1', 'att-999');
      expect(result).toBe(false);
    });
  });
});
