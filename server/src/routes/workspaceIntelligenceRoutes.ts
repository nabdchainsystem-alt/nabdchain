/**
 * Workspace Intelligence Routes
 *
 * GET  /api/workspace/intelligence/feed    — Paginated feed of AI insight events
 * GET  /api/workspace/intelligence/:id     — Single event detail
 * POST /api/workspace/intelligence/:id/resolve  — Mark event as resolved
 * POST /api/workspace/intelligence/:id/dismiss  — Dismiss event
 * GET  /api/workspace/intelligence/count   — Active event count (badge)
 */
import { Router, Request, Response } from 'express';
import {
    getInsightFeed,
    getInsightEvent,
    resolveInsightEvent,
    dismissInsightEvent,
    countActiveInsights,
    FeedQuerySchema,
} from '../services/workspaceIntelligenceService';
import { aiLogger } from '../utils/logger';

const router = Router();

interface AuthRequest extends Request {
    auth?: { userId: string };
    portalAuth?: { userId: string; buyerId?: string; sellerId?: string; portalRole?: string };
}

function getUserId(req: AuthRequest): string | null {
    return req.auth?.userId || req.portalAuth?.userId || null;
}

/**
 * GET /feed — Paginated insight feed
 */
router.get('/feed', async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const input = FeedQuerySchema.parse({
            role: req.query.role,
            status: req.query.status || undefined,
            entityType: req.query.entityType || undefined,
            insightType: req.query.insightType || undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            cursor: req.query.cursor || undefined,
        });

        const result = await getInsightFeed(userId, input);
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid query parameters', details: error.message });
        }
        aiLogger.error('[Intelligence] Feed error:', error);
        res.status(500).json({ error: 'Failed to fetch intelligence feed' });
    }
});

/**
 * GET /count — Active event count
 */
router.get('/count', async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const role = req.query.role as string;
    if (!role || !['buyer', 'seller'].includes(role)) {
        return res.status(400).json({ error: 'role query parameter required (buyer|seller)' });
    }

    try {
        const count = await countActiveInsights(userId, role);
        res.json({ success: true, data: { count } });
    } catch (error) {
        aiLogger.error('[Intelligence] Count error:', error);
        res.status(500).json({ error: 'Failed to count insights' });
    }
});

/**
 * GET /:id — Single event
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const eventId = String(req.params.id);
        const event = await getInsightEvent(eventId, userId);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json({ success: true, data: event });
    } catch (error) {
        aiLogger.error('[Intelligence] Get event error:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

/**
 * POST /:id/resolve — Mark as resolved
 */
router.post('/:id/resolve', async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const eventId = String(req.params.id);
        const event = await resolveInsightEvent(eventId, userId);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json({ success: true, data: event });
    } catch (error) {
        aiLogger.error('[Intelligence] Resolve error:', error);
        res.status(500).json({ error: 'Failed to resolve event' });
    }
});

/**
 * POST /:id/dismiss — Dismiss event
 */
router.post('/:id/dismiss', async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const eventId = String(req.params.id);
        const event = await dismissInsightEvent(eventId, userId);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json({ success: true, data: event });
    } catch (error) {
        aiLogger.error('[Intelligence] Dismiss error:', error);
        res.status(500).json({ error: 'Failed to dismiss event' });
    }
});

export default router;
