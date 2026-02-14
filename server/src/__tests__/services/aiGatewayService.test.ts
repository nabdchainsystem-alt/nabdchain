/**
 * Tests for AI Gateway Service
 * - Output schema parsing + validation
 * - Sensitive data redaction
 * - Rate limiter logic
 * - Happy path with mocked Gemini client
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetMocks } from '../setup';

// vi.mock must be in the test file for proper hoisting
vi.mock('../../lib/prisma', () => ({
    prisma: prismaMock,
    default: prismaMock,
}));

vi.mock('../../utils/logger', () => ({
    aiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Mock the AI router service to avoid actual Gemini calls
vi.mock('../../services/aiRouterService', () => ({
    routeRequest: vi.fn(),
    AIRequest: {},
}));
import {
    AIInsightSchema,
    redactSensitiveData,
    checkAIRateLimit,
    generateInsights,
    generateRFQDraft,
    generateQuoteComparison,
    generateWorkspaceSummary,
} from '../../services/aiGatewayService';
import { routeRequest } from '../../services/aiRouterService';

const mockRouteRequest = vi.mocked(routeRequest);

// ============================================================================
// Test Data
// ============================================================================

const VALID_AI_OUTPUT = JSON.stringify({
    summary: 'Your workspace is performing well with 15 orders this month.',
    insights: [
        { title: 'Order Growth', description: 'Orders up 20% vs last month', severity: 'info' },
    ],
    risks: [
        { title: 'Payment Delays', description: '3 invoices overdue', severity: 'medium' },
    ],
    recommendedActions: [
        { title: 'Follow up on overdue invoices', description: 'Contact buyers for payment', deepLink: '/invoices' },
    ],
    confidence: 0.85,
    dataUsed: ['orders', 'invoices'],
});

// ============================================================================
// Schema Validation Tests
// ============================================================================

describe('AIInsightSchema', () => {
    it('should validate a correct AI output', () => {
        const parsed = AIInsightSchema.parse(JSON.parse(VALID_AI_OUTPUT));
        expect(parsed.summary).toBe('Your workspace is performing well with 15 orders this month.');
        expect(parsed.insights).toHaveLength(1);
        expect(parsed.risks).toHaveLength(1);
        expect(parsed.recommendedActions).toHaveLength(1);
        expect(parsed.confidence).toBe(0.85);
        expect(parsed.dataUsed).toEqual(['orders', 'invoices']);
    });

    it('should reject missing summary', () => {
        expect(() =>
            AIInsightSchema.parse({
                insights: [],
                risks: [],
                recommendedActions: [],
                confidence: 0.5,
                dataUsed: [],
            }),
        ).toThrow();
    });

    it('should reject confidence > 1', () => {
        expect(() =>
            AIInsightSchema.parse({
                summary: 'test',
                insights: [],
                risks: [],
                recommendedActions: [],
                confidence: 1.5,
                dataUsed: [],
            }),
        ).toThrow();
    });

    it('should reject invalid severity on risks', () => {
        expect(() =>
            AIInsightSchema.parse({
                summary: 'test',
                insights: [],
                risks: [{ title: 'x', description: 'y', severity: 'super_high' }],
                recommendedActions: [],
                confidence: 0.5,
                dataUsed: [],
            }),
        ).toThrow();
    });

    it('should accept empty arrays', () => {
        const parsed = AIInsightSchema.parse({
            summary: 'No data available',
            insights: [],
            risks: [],
            recommendedActions: [],
            confidence: 0,
            dataUsed: [],
        });
        expect(parsed.summary).toBe('No data available');
        expect(parsed.confidence).toBe(0);
    });
});

// ============================================================================
// Redaction Tests
// ============================================================================

describe('redactSensitiveData', () => {
    it('should redact IBAN numbers', () => {
        const result = redactSensitiveData('Bank: SA0380000000608010167519');
        expect(result).toContain('[IBAN_REDACTED]');
        expect(result).not.toContain('SA0380000000608010167519');
    });

    it('should redact credit card numbers', () => {
        const result = redactSensitiveData('Card: 4111-1111-1111-1111');
        expect(result).toContain('[CARD_REDACTED]');
        expect(result).not.toContain('4111-1111-1111-1111');
    });

    it('should redact API keys', () => {
        const result = redactSensitiveData('Key: sk_live_abcdefghijklmnop1234');
        expect(result).toContain('[TOKEN_REDACTED]');
        expect(result).not.toContain('sk_live_abcdefghijklmnop1234');
    });

    it('should redact email addresses', () => {
        const result = redactSensitiveData('Contact: user@example.com');
        expect(result).toContain('[EMAIL_REDACTED]');
        expect(result).not.toContain('user@example.com');
    });

    it('should redact phone numbers', () => {
        const result = redactSensitiveData('Phone: +966 50 123 4567');
        expect(result).toContain('[PHONE_REDACTED]');
    });

    it('should handle text with no sensitive data', () => {
        const input = 'Order total: 5000 SAR for 100 units';
        expect(redactSensitiveData(input)).toBe(input);
    });

    it('should redact multiple patterns in same string', () => {
        const input = 'Email: a@b.com, IBAN: SA0380000000608010167519';
        const result = redactSensitiveData(input);
        expect(result).toContain('[EMAIL_REDACTED]');
        expect(result).toContain('[IBAN_REDACTED]');
    });
});

// ============================================================================
// Rate Limiter Tests
// ============================================================================

describe('checkAIRateLimit', () => {
    it('should allow first request', () => {
        const result = checkAIRateLimit('rate-test-user-1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
    });

    it('should decrement remaining on subsequent calls', () => {
        const userId = 'rate-test-user-2';
        checkAIRateLimit(userId);
        const second = checkAIRateLimit(userId);
        expect(second.allowed).toBe(true);
        expect(second.remaining).toBe(8);
    });

    it('should block after limit exceeded', () => {
        const userId = 'rate-test-user-3';
        // Exhaust the limit
        for (let i = 0; i < 10; i++) {
            checkAIRateLimit(userId);
        }
        const result = checkAIRateLimit(userId);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.resetIn).toBeGreaterThan(0);
    });
});

// ============================================================================
// Endpoint Happy Path Tests (mocked Gemini)
// ============================================================================

describe('generateInsights', () => {
    beforeEach(() => {
        resetMocks();
        mockRouteRequest.mockReset();
    });

    it('should return structured insights for buyer', async () => {
        // Mock Prisma data
        prismaMock.marketplaceOrder.findMany.mockResolvedValue([
            { id: '1', orderNumber: 'ORD-001', status: 'delivered', totalPrice: 5000, itemName: 'Steel', createdAt: new Date() },
        ]);
        prismaMock.marketplaceRFQ.findMany.mockResolvedValue([]);
        prismaMock.quote.findMany.mockResolvedValue([]);
        prismaMock.marketplaceInvoice.findMany.mockResolvedValue([]);
        prismaMock.buyerExpense.findMany.mockResolvedValue([]);

        // Mock AI response
        mockRouteRequest.mockResolvedValue({
            success: true,
            content: VALID_AI_OUTPUT,
            tier: 'analyst',
            creditsUsed: 3,
        });

        const result = await generateInsights('user-1', { role: 'buyer' }, { buyerId: 'buyer-1' });

        expect(result.summary).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        expect(Array.isArray(result.insights)).toBe(true);
        expect(Array.isArray(result.risks)).toBe(true);
        expect(Array.isArray(result.recommendedActions)).toBe(true);
    });

    it('should fallback gracefully when AI returns unparseable content', async () => {
        prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
        prismaMock.marketplaceRFQ.findMany.mockResolvedValue([]);
        prismaMock.quote.findMany.mockResolvedValue([]);
        prismaMock.marketplaceInvoice.findMany.mockResolvedValue([]);
        prismaMock.buyerExpense.findMany.mockResolvedValue([]);

        mockRouteRequest.mockResolvedValue({
            success: true,
            content: 'This is not valid JSON at all, just a plain text response from AI',
            tier: 'analyst',
            creditsUsed: 3,
        });

        const result = await generateInsights('user-2', { role: 'buyer' }, { buyerId: 'buyer-2' });

        // Should fallback gracefully
        expect(result.summary).toContain('This is not valid JSON');
        expect(result.confidence).toBe(0.3);
        expect(result.dataUsed).toEqual(['raw_response']);
    });

    it('should throw on AI failure', async () => {
        prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
        prismaMock.marketplaceRFQ.findMany.mockResolvedValue([]);
        prismaMock.quote.findMany.mockResolvedValue([]);
        prismaMock.marketplaceInvoice.findMany.mockResolvedValue([]);
        prismaMock.buyerExpense.findMany.mockResolvedValue([]);

        mockRouteRequest.mockResolvedValue({
            success: false,
            content: undefined,
            tier: 'analyst',
            creditsUsed: 0,
            error: 'Insufficient credits',
        });

        await expect(
            generateInsights('user-3', { role: 'buyer' }, { buyerId: 'buyer-3' }),
        ).rejects.toThrow('Insufficient credits');
    });
});

describe('generateRFQDraft', () => {
    beforeEach(() => {
        resetMocks();
        mockRouteRequest.mockReset();
    });

    it('should return structured RFQ draft', async () => {
        mockRouteRequest.mockResolvedValue({
            success: true,
            content: VALID_AI_OUTPUT,
            tier: 'worker',
            creditsUsed: 1,
        });

        const result = await generateRFQDraft('user-1', {
            itemName: 'Steel Pipes',
            quantity: 500,
            requirements: 'Grade A',
        });

        expect(result.summary).toBeDefined();
        expect(mockRouteRequest).toHaveBeenCalledTimes(1);
        const callArgs = mockRouteRequest.mock.calls[0][0];
        expect(callArgs.prompt).toContain('Steel Pipes');
        expect(callArgs.prompt).toContain('500');
    });
});

describe('generateQuoteComparison', () => {
    beforeEach(() => {
        resetMocks();
        mockRouteRequest.mockReset();
    });

    it('should compare quotes for an RFQ', async () => {
        prismaMock.itemRFQ.findUnique.mockResolvedValue({
            id: 'rfq-1',
            rfqNumber: 'RFQ-001',
            quantity: 100,
            status: 'quoted',
            item: { name: 'Copper Wire' },
        });

        prismaMock.quote.findMany.mockResolvedValue([
            { id: 'q1', quoteNumber: 'QT-001', unitPrice: 50, totalPrice: 5000, deliveryDays: 14, status: 'sent', sellerId: 's1', discount: null },
            { id: 'q2', quoteNumber: 'QT-002', unitPrice: 45, totalPrice: 4500, deliveryDays: 21, status: 'sent', sellerId: 's2', discount: 5 },
        ]);

        mockRouteRequest.mockResolvedValue({
            success: true,
            content: VALID_AI_OUTPUT,
            tier: 'analyst',
            creditsUsed: 3,
        });

        const result = await generateQuoteComparison('user-1', { rfqId: 'rfq-1' });

        expect(result.summary).toBeDefined();
        expect(mockRouteRequest).toHaveBeenCalledTimes(1);
        const prompt = mockRouteRequest.mock.calls[0][0].prompt;
        expect(prompt).toContain('Compare');
    });

    it('should throw if RFQ not found', async () => {
        prismaMock.itemRFQ.findUnique.mockResolvedValue(null);

        await expect(
            generateQuoteComparison('user-1', { rfqId: 'nonexistent' }),
        ).rejects.toThrow('RFQ not found');
    });

    it('should throw if no quotes found', async () => {
        prismaMock.itemRFQ.findUnique.mockResolvedValue({
            id: 'rfq-2',
            rfqNumber: 'RFQ-002',
            quantity: 50,
            status: 'new',
            item: { name: 'Bolts' },
        });
        prismaMock.quote.findMany.mockResolvedValue([]);

        await expect(
            generateQuoteComparison('user-1', { rfqId: 'rfq-2' }),
        ).rejects.toThrow('No quotes found');
    });
});

describe('generateWorkspaceSummary', () => {
    beforeEach(() => {
        resetMocks();
        mockRouteRequest.mockReset();
    });

    it('should generate seller workspace summary', async () => {
        prismaMock.marketplaceOrder.findMany.mockResolvedValue([]);
        prismaMock.marketplaceRFQ.findMany.mockResolvedValue([]);
        prismaMock.quote.findMany.mockResolvedValue([]);
        prismaMock.item.findMany.mockResolvedValue([]);
        prismaMock.marketplaceInvoice.findMany.mockResolvedValue([]);

        mockRouteRequest.mockResolvedValue({
            success: true,
            content: VALID_AI_OUTPUT,
            tier: 'analyst',
            creditsUsed: 3,
        });

        const result = await generateWorkspaceSummary(
            'user-1',
            { role: 'seller', period: '7d' },
            { sellerId: 'seller-1' },
        );

        expect(result.summary).toBeDefined();
        expect(result.insights).toHaveLength(1);
    });
});
