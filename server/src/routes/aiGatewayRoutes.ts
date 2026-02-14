/**
 * AI Gateway Routes — Portal Power Features
 *
 * POST /api/ai/insights        — Business insights for buyer/seller workspace
 * POST /api/ai/rfq-draft       — AI-generated RFQ message draft
 * POST /api/ai/quote-compare   — Compare quotes for an RFQ
 * POST /api/ai/workspace-summary — Summarize workspace activity
 */
import { Router, Request, Response } from 'express';
import {
    generateInsights,
    generateRFQDraft,
    generateQuoteComparison,
    generateWorkspaceSummary,
    generateOrderSummary,
    generateInvoiceRisk,
    checkAIRateLimit,
    InsightsInputSchema,
    RFQDraftInputSchema,
    QuoteCompareInputSchema,
    WorkspaceSummaryInputSchema,
    OrderSummaryInputSchema,
    InvoiceRiskInputSchema,
} from '../services/aiGatewayService';
import { aiLogger } from '../utils/logger';

const router = Router();

interface AuthRequest extends Request {
    auth?: { userId: string };
    portalAuth?: { userId: string; buyerId?: string; sellerId?: string; portalRole?: string };
}

/**
 * Rate limit + auth guard shared across all AI gateway endpoints
 */
function guardRequest(req: AuthRequest, res: Response): { userId: string; portalAuth: { buyerId?: string; sellerId?: string } } | null {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }

    const rateCheck = checkAIRateLimit(userId);
    if (!rateCheck.allowed) {
        res.status(429).json({
            error: 'AI rate limit exceeded. Please wait before making more requests.',
            retryAfterMs: rateCheck.resetIn,
        });
        return null;
    }

    // Set rate limit headers
    res.setHeader('X-AI-RateLimit-Remaining', rateCheck.remaining);
    res.setHeader('X-AI-RateLimit-Reset', rateCheck.resetIn);

    return {
        userId,
        portalAuth: {
            buyerId: req.portalAuth?.buyerId,
            sellerId: req.portalAuth?.sellerId,
        },
    };
}

/**
 * POST /api/ai/insights
 * Generate business insights for buyer/seller workspace
 */
router.post('/insights', async (req: AuthRequest, res: Response) => {
    const guard = guardRequest(req, res);
    if (!guard) return;

    try {
        const input = InsightsInputSchema.parse(req.body);
        const result = await generateInsights(guard.userId, input, guard.portalAuth);
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: error.message });
        }
        aiLogger.error('[AI Gateway] Insights error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to generate insights',
        });
    }
});

/**
 * POST /api/ai/rfq-draft
 * AI-generate an RFQ message draft
 */
router.post('/rfq-draft', async (req: AuthRequest, res: Response) => {
    const guard = guardRequest(req, res);
    if (!guard) return;

    try {
        const input = RFQDraftInputSchema.parse(req.body);
        const result = await generateRFQDraft(guard.userId, input);
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: error.message });
        }
        aiLogger.error('[AI Gateway] RFQ Draft error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to generate RFQ draft',
        });
    }
});

/**
 * POST /api/ai/quote-compare
 * Compare quotes for a given RFQ
 */
router.post('/quote-compare', async (req: AuthRequest, res: Response) => {
    const guard = guardRequest(req, res);
    if (!guard) return;

    try {
        const input = QuoteCompareInputSchema.parse(req.body);
        const result = await generateQuoteComparison(guard.userId, input);
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: error.message });
        }
        aiLogger.error('[AI Gateway] Quote Compare error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to compare quotes',
        });
    }
});

/**
 * POST /api/ai/workspace-summary
 * Summarize workspace activity for a period
 */
router.post('/workspace-summary', async (req: AuthRequest, res: Response) => {
    const guard = guardRequest(req, res);
    if (!guard) return;

    try {
        const input = WorkspaceSummaryInputSchema.parse(req.body);
        const result = await generateWorkspaceSummary(guard.userId, input, guard.portalAuth);
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: error.message });
        }
        aiLogger.error('[AI Gateway] Workspace Summary error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to generate workspace summary',
        });
    }
});

/**
 * POST /api/ai/order-summary
 * AI analysis of a single order
 */
router.post('/order-summary', async (req: AuthRequest, res: Response) => {
    const guard = guardRequest(req, res);
    if (!guard) return;

    try {
        const input = OrderSummaryInputSchema.parse(req.body);
        const result = await generateOrderSummary(guard.userId, input, {
            ...guard.portalAuth,
            portalRole: req.portalAuth?.portalRole,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: error.message });
        }
        aiLogger.error('[AI Gateway] Order Summary error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to generate order summary',
        });
    }
});

/**
 * POST /api/ai/invoice-risk
 * AI risk assessment of a single invoice
 */
router.post('/invoice-risk', async (req: AuthRequest, res: Response) => {
    const guard = guardRequest(req, res);
    if (!guard) return;

    try {
        const input = InvoiceRiskInputSchema.parse(req.body);
        const result = await generateInvoiceRisk(guard.userId, input, {
            ...guard.portalAuth,
            portalRole: req.portalAuth?.portalRole,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: error.message });
        }
        aiLogger.error('[AI Gateway] Invoice Risk error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to assess invoice risk',
        });
    }
});

export default router;
