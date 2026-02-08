/**
 * Integration tests for Dispute Routes
 *
 * Tests HTTP request/response cycle through the Express router
 * with mocked service layer. Validates status codes, response shapes,
 * Zod validation, and error handling branches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TEST_SELLER_ID, TEST_BUYER_ID } from '../testApp';

// ---------------------------------------------------------------------------
// Mocks — must be before any import that pulls in the mocked modules
// ---------------------------------------------------------------------------

vi.mock('../../../services/disputeService', () => ({
  disputeService: {
    createDispute: vi.fn(),
    getBuyerDisputes: vi.fn(),
    getBuyerDisputeStats: vi.fn(),
    getDispute: vi.fn(),
    buyerAcceptResolution: vi.fn(),
    buyerRejectResolution: vi.fn(),
    escalateDispute: vi.fn(),
    addEvidence: vi.fn(),
    closeDispute: vi.fn(),
    getSellerDisputes: vi.fn(),
    getSellerDisputeStats: vi.fn(),
    markAsUnderReview: vi.fn(),
    sellerRespond: vi.fn(),
    getDisputeHistory: vi.fn(),
    getDisputeByOrder: vi.fn(),
  },
}));

vi.mock('../../../middleware/idempotencyMiddleware', () => ({
  idempotency: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../../utils/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import disputeRouter from '../../../routes/disputeRoutes';
import { disputeService } from '../../../services/disputeService';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const buyerApp = createTestApp(disputeRouter, '/api/disputes', { userId: TEST_BUYER_ID });
const sellerApp = createTestApp(disputeRouter, '/api/disputes', { userId: TEST_SELLER_ID });

const mockDispute = {
  id: 'dispute-1',
  orderId: 'order-1',
  buyerId: TEST_BUYER_ID,
  sellerId: TEST_SELLER_ID,
  reason: 'damaged_goods',
  status: 'open',
  description: 'Item arrived damaged with dents on the surface',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Buyer Dispute Routes
// =============================================================================

describe('Buyer Dispute Routes', () => {
  describe('POST /api/disputes/buyer', () => {
    const validDispute = {
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'damaged_goods' as const,
      description: 'Item arrived damaged with visible dents on the surface',
    };

    it('creates a dispute with valid data', async () => {
      (disputeService.createDispute as any).mockResolvedValue({
        success: true,
        dispute: { ...mockDispute, id: 'dispute-new' },
      });

      const res = await request(buyerApp)
        .post('/api/disputes/buyer')
        .send(validDispute);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('dispute-new');
      expect(disputeService.createDispute).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: validDispute.orderId,
          reason: 'damaged_goods',
          buyerId: TEST_BUYER_ID,
        })
      );
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(buyerApp)
        .post('/api/disputes/buyer')
        .send({ orderId: '550e8400-e29b-41d4-a716-446655440000' }); // missing reason + description

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 for invalid orderId format', async () => {
      const res = await request(buyerApp)
        .post('/api/disputes/buyer')
        .send({ ...validDispute, orderId: 'not-a-uuid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 for description too short', async () => {
      const res = await request(buyerApp)
        .post('/api/disputes/buyer')
        .send({ ...validDispute, description: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 for invalid reason enum', async () => {
      const res = await request(buyerApp)
        .post('/api/disputes/buyer')
        .send({ ...validDispute, reason: 'invalid_reason' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 when service returns failure', async () => {
      (disputeService.createDispute as any).mockResolvedValue({
        success: false,
        error: 'Order not eligible for dispute',
      });

      const res = await request(buyerApp)
        .post('/api/disputes/buyer')
        .send(validDispute);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Order not eligible for dispute');
    });

    it('returns 500 on service error', async () => {
      (disputeService.createDispute as any).mockRejectedValue(new Error('DB down'));

      const res = await request(buyerApp)
        .post('/api/disputes/buyer')
        .send(validDispute);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to create dispute');
    });
  });

  describe('GET /api/disputes/buyer', () => {
    it('returns buyer disputes', async () => {
      (disputeService.getBuyerDisputes as any).mockResolvedValue([mockDispute]);

      const res = await request(buyerApp).get('/api/disputes/buyer');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockDispute]);
      expect(disputeService.getBuyerDisputes).toHaveBeenCalledWith(
        TEST_BUYER_ID,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });

    it('passes query filters to service', async () => {
      (disputeService.getBuyerDisputes as any).mockResolvedValue([]);

      await request(buyerApp)
        .get('/api/disputes/buyer')
        .query({ status: 'open', reason: 'damaged_goods' });

      expect(disputeService.getBuyerDisputes).toHaveBeenCalledWith(
        TEST_BUYER_ID,
        expect.objectContaining({ status: 'open', reason: 'damaged_goods' })
      );
    });

    it('returns 400 for invalid filter values', async () => {
      const res = await request(buyerApp)
        .get('/api/disputes/buyer')
        .query({ status: 'bogus_status' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid filters');
    });

    it('returns 500 on service error', async () => {
      (disputeService.getBuyerDisputes as any).mockRejectedValue(new Error('DB down'));

      const res = await request(buyerApp).get('/api/disputes/buyer');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch disputes');
    });
  });

  describe('GET /api/disputes/buyer/stats', () => {
    it('returns buyer dispute stats', async () => {
      const stats = { total: 5, open: 2, resolved: 3 };
      (disputeService.getBuyerDisputeStats as any).mockResolvedValue(stats);

      const res = await request(buyerApp).get('/api/disputes/buyer/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stats);
    });

    it('returns 500 on service error', async () => {
      (disputeService.getBuyerDisputeStats as any).mockRejectedValue(new Error('DB down'));

      const res = await request(buyerApp).get('/api/disputes/buyer/stats');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch dispute statistics');
    });
  });

  describe('GET /api/disputes/buyer/:id', () => {
    it('returns a single dispute', async () => {
      (disputeService.getDispute as any).mockResolvedValue(mockDispute);

      const res = await request(buyerApp).get('/api/disputes/buyer/dispute-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('dispute-1');
      expect(disputeService.getDispute).toHaveBeenCalledWith('dispute-1', TEST_BUYER_ID);
    });

    it('returns 404 when dispute not found', async () => {
      (disputeService.getDispute as any).mockResolvedValue(null);

      const res = await request(buyerApp).get('/api/disputes/buyer/nope');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Dispute not found');
    });

    it('returns 500 on service error', async () => {
      (disputeService.getDispute as any).mockRejectedValue(new Error('DB down'));

      const res = await request(buyerApp).get('/api/disputes/buyer/dispute-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch dispute');
    });
  });

  describe('POST /api/disputes/buyer/:id/accept', () => {
    it('accepts seller resolution', async () => {
      (disputeService.buyerAcceptResolution as any).mockResolvedValue({
        success: true,
        dispute: { ...mockDispute, status: 'resolved' },
      });

      const res = await request(buyerApp).post('/api/disputes/buyer/dispute-1/accept');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('resolved');
      expect(disputeService.buyerAcceptResolution).toHaveBeenCalledWith('dispute-1', TEST_BUYER_ID);
    });

    it('returns 400 when service returns failure', async () => {
      (disputeService.buyerAcceptResolution as any).mockResolvedValue({
        success: false,
        error: 'Dispute is not in a state to accept resolution',
      });

      const res = await request(buyerApp).post('/api/disputes/buyer/dispute-1/accept');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Dispute is not in a state to accept resolution');
    });
  });

  describe('POST /api/disputes/buyer/:id/reject', () => {
    it('rejects seller resolution with valid reason', async () => {
      (disputeService.buyerRejectResolution as any).mockResolvedValue({
        success: true,
        dispute: { ...mockDispute, status: 'open' },
      });

      const res = await request(buyerApp)
        .post('/api/disputes/buyer/dispute-1/reject')
        .send({ reason: 'The proposed resolution is not acceptable at all' });

      expect(res.status).toBe(200);
      expect(disputeService.buyerRejectResolution).toHaveBeenCalledWith(
        'dispute-1',
        TEST_BUYER_ID,
        'The proposed resolution is not acceptable at all'
      );
    });

    it('returns 400 for reason too short', async () => {
      const res = await request(buyerApp)
        .post('/api/disputes/buyer/dispute-1/reject')
        .send({ reason: 'no' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });
  });

  describe('POST /api/disputes/buyer/:id/escalate', () => {
    it('escalates dispute with valid reason', async () => {
      (disputeService.escalateDispute as any).mockResolvedValue({
        success: true,
        dispute: { ...mockDispute, status: 'escalated' },
      });

      const res = await request(buyerApp)
        .post('/api/disputes/buyer/dispute-1/escalate')
        .send({ reason: 'Seller is not responding to my dispute at all' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('escalated');
    });

    it('returns 400 for missing reason', async () => {
      const res = await request(buyerApp)
        .post('/api/disputes/buyer/dispute-1/escalate')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });
  });

  describe('POST /api/disputes/buyer/:id/evidence', () => {
    const validEvidence = {
      evidence: [
        { id: 'ev-1', name: 'photo.jpg', type: 'image/jpeg', url: 'https://example.com/photo.jpg', uploadedAt: '2026-01-01' },
      ],
    };

    it('adds evidence with valid data', async () => {
      (disputeService.addEvidence as any).mockResolvedValue({
        success: true,
        dispute: mockDispute,
      });

      const res = await request(buyerApp)
        .post('/api/disputes/buyer/dispute-1/evidence')
        .send(validEvidence);

      expect(res.status).toBe(200);
      expect(disputeService.addEvidence).toHaveBeenCalledWith(
        'dispute-1',
        TEST_BUYER_ID,
        validEvidence.evidence
      );
    });

    it('returns 400 for empty evidence array', async () => {
      const res = await request(buyerApp)
        .post('/api/disputes/buyer/dispute-1/evidence')
        .send({ evidence: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });
  });

  describe('POST /api/disputes/buyer/:id/close', () => {
    it('closes a dispute', async () => {
      (disputeService.closeDispute as any).mockResolvedValue({
        success: true,
        dispute: { ...mockDispute, status: 'closed' },
      });

      const res = await request(buyerApp).post('/api/disputes/buyer/dispute-1/close');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('closed');
    });

    it('returns 400 when service returns failure', async () => {
      (disputeService.closeDispute as any).mockResolvedValue({
        success: false,
        error: 'Cannot close an escalated dispute',
      });

      const res = await request(buyerApp).post('/api/disputes/buyer/dispute-1/close');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot close an escalated dispute');
    });
  });
});

// =============================================================================
// Seller Dispute Routes
// =============================================================================

describe('Seller Dispute Routes', () => {
  describe('GET /api/disputes/seller', () => {
    it('returns seller disputes', async () => {
      (disputeService.getSellerDisputes as any).mockResolvedValue([mockDispute]);

      const res = await request(sellerApp).get('/api/disputes/seller');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockDispute]);
      expect(disputeService.getSellerDisputes).toHaveBeenCalledWith(
        TEST_SELLER_ID,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });

    it('returns 500 on service error', async () => {
      (disputeService.getSellerDisputes as any).mockRejectedValue(new Error('DB down'));

      const res = await request(sellerApp).get('/api/disputes/seller');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch disputes');
    });
  });

  describe('GET /api/disputes/seller/stats', () => {
    it('returns seller dispute stats', async () => {
      const stats = { total: 8, open: 3 };
      (disputeService.getSellerDisputeStats as any).mockResolvedValue(stats);

      const res = await request(sellerApp).get('/api/disputes/seller/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stats);
    });
  });

  describe('GET /api/disputes/seller/:id', () => {
    it('returns a single dispute for seller', async () => {
      (disputeService.getDispute as any).mockResolvedValue(mockDispute);

      const res = await request(sellerApp).get('/api/disputes/seller/dispute-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('dispute-1');
    });

    it('returns 404 when dispute not found', async () => {
      (disputeService.getDispute as any).mockResolvedValue(null);

      const res = await request(sellerApp).get('/api/disputes/seller/nope');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/disputes/seller/:id/review', () => {
    it('marks dispute as under review', async () => {
      (disputeService.markAsUnderReview as any).mockResolvedValue({
        success: true,
        dispute: { ...mockDispute, status: 'under_review' },
      });

      const res = await request(sellerApp).post('/api/disputes/seller/dispute-1/review');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('under_review');
    });

    it('returns 400 when service returns failure', async () => {
      (disputeService.markAsUnderReview as any).mockResolvedValue({
        success: false,
        error: 'Dispute is already under review',
      });

      const res = await request(sellerApp).post('/api/disputes/seller/dispute-1/review');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/disputes/seller/:id/respond', () => {
    const validResponse = {
      responseType: 'propose_resolution' as const,
      response: 'We apologize for the damage and propose a full refund',
    };

    it('submits seller response with valid data', async () => {
      (disputeService.sellerRespond as any).mockResolvedValue({
        success: true,
        dispute: { ...mockDispute, status: 'seller_responded' },
      });

      const res = await request(sellerApp)
        .post('/api/disputes/seller/dispute-1/respond')
        .send(validResponse);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('seller_responded');
      expect(disputeService.sellerRespond).toHaveBeenCalledWith(
        expect.objectContaining({
          disputeId: 'dispute-1',
          sellerId: TEST_SELLER_ID,
          responseType: 'propose_resolution',
        })
      );
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(sellerApp)
        .post('/api/disputes/seller/dispute-1/respond')
        .send({ responseType: 'accept_responsibility' }); // missing response

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 for invalid responseType enum', async () => {
      const res = await request(sellerApp)
        .post('/api/disputes/seller/dispute-1/respond')
        .send({ responseType: 'bogus', response: 'This is my response text long enough' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    it('returns 400 when service returns failure', async () => {
      (disputeService.sellerRespond as any).mockResolvedValue({
        success: false,
        error: 'Dispute is not open for response',
      });

      const res = await request(sellerApp)
        .post('/api/disputes/seller/dispute-1/respond')
        .send(validResponse);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/disputes/seller/:id/escalate', () => {
    it('escalates dispute by seller', async () => {
      (disputeService.escalateDispute as any).mockResolvedValue({
        success: true,
        dispute: { ...mockDispute, status: 'escalated' },
      });

      const res = await request(sellerApp)
        .post('/api/disputes/seller/dispute-1/escalate')
        .send({ reason: 'Buyer is making unreasonable demands for refund' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('escalated');
    });

    it('returns 400 for reason too short', async () => {
      const res = await request(sellerApp)
        .post('/api/disputes/seller/dispute-1/escalate')
        .send({ reason: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });
  });
});

// =============================================================================
// Shared Dispute Routes
// =============================================================================

describe('Shared Dispute Routes', () => {
  describe('GET /api/disputes/:id/history', () => {
    it('returns dispute history', async () => {
      const history = [{ action: 'created', timestamp: '2026-01-01' }];
      (disputeService.getDisputeHistory as any).mockResolvedValue(history);

      const res = await request(buyerApp).get('/api/disputes/dispute-1/history');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(history);
      expect(disputeService.getDisputeHistory).toHaveBeenCalledWith('dispute-1', TEST_BUYER_ID);
    });

    it('returns 500 on service error', async () => {
      (disputeService.getDisputeHistory as any).mockRejectedValue(new Error('DB down'));

      const res = await request(buyerApp).get('/api/disputes/dispute-1/history');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch dispute history');
    });
  });

  describe('GET /api/disputes/order/:orderId', () => {
    it('returns dispute for an order', async () => {
      (disputeService.getDisputeByOrder as any).mockResolvedValue(mockDispute);

      const res = await request(buyerApp).get('/api/disputes/order/order-1');

      expect(res.status).toBe(200);
      expect(res.body.orderId).toBe('order-1');
    });

    it('returns 404 when no dispute found for order', async () => {
      (disputeService.getDisputeByOrder as any).mockResolvedValue(null);

      const res = await request(buyerApp).get('/api/disputes/order/order-999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Dispute not found');
    });
  });
});
