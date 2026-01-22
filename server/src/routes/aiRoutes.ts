import { Router, Request, Response } from 'express';
import {
    routeRequest,
    processFileUpload,
    generateChart,
    getCreditsBalance,
    determineTier,
    AIRequest,
    FileUploadData,
} from '../services/aiRouterService';

const router = Router();

// Type for authenticated request
interface AuthRequest extends Request {
    auth?: {
        userId: string;
    };
}

/**
 * GET /api/ai/credits
 * Returns user's current AI credit balance
 */
router.get('/credits', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const balance = await getCreditsBalance(userId);
        res.json({ credits: balance });
    } catch (error) {
        console.error('[AI Routes] Get credits error:', error);
        res.status(500).json({ error: 'Failed to get credit balance' });
    }
});

/**
 * POST /api/ai/process
 * Main AI processing endpoint - routes to appropriate tier automatically
 */
router.post('/process', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { prompt, context, forceDeepMode, promptType } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const request: AIRequest = {
            prompt,
            userId,
            context,
            forceDeepMode: forceDeepMode === true,
            promptType: promptType || 'general',
        };

        // Preview what tier will be used (for transparency)
        const tier = determineTier(request);

        const response = await routeRequest(request);

        res.json({
            ...response,
            requestedTier: tier,
        });
    } catch (error) {
        console.error('[AI Routes] Process error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'AI processing failed'
        });
    }
});

/**
 * POST /api/ai/upload
 * Process file upload for schema mapping (Tier 1 - Cleaner)
 */
router.post('/upload', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { fileName, headers, sampleRows, fileType } = req.body;

        if (!fileName || !headers || !Array.isArray(headers)) {
            return res.status(400).json({ error: 'fileName and headers are required' });
        }

        const fileData: FileUploadData = {
            fileName,
            headers,
            sampleRows: sampleRows || [],
            fileType: fileType || 'csv',
        };

        const result = await processFileUpload(userId, fileData);
        res.json(result);
    } catch (error) {
        console.error('[AI Routes] Upload error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'File processing failed'
        });
    }
});

/**
 * POST /api/ai/chart
 * Generate chart configuration (Tier 2 Worker, or Tier 3 if deep mode)
 */
router.post('/chart', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { prompt, data, deepMode } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Data array is required' });
        }

        const result = await generateChart(userId, prompt, data, deepMode === true);
        res.json(result);
    } catch (error) {
        console.error('[AI Routes] Chart error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Chart generation failed'
        });
    }
});

/**
 * POST /api/ai/analyze
 * Deep analysis endpoint (Tier 3 - Thinker)
 */
router.post('/analyze', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { prompt, context } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const request: AIRequest = {
            prompt,
            userId,
            context,
            forceDeepMode: true, // Always use Tier 3 for this endpoint
            promptType: 'analysis',
        };

        const response = await routeRequest(request);
        res.json(response);
    } catch (error) {
        console.error('[AI Routes] Analyze error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Analysis failed'
        });
    }
});

/**
 * GET /api/ai/tier-preview
 * Preview which tier would be used for a given prompt (no credits charged)
 */
router.post('/tier-preview', async (req: AuthRequest, res: Response) => {
    try {
        const { prompt, forceDeepMode, fileUpload } = req.body;

        if (!prompt && !fileUpload) {
            return res.status(400).json({ error: 'Prompt or fileUpload is required' });
        }

        const request: AIRequest = {
            prompt: prompt || '',
            userId: 'preview', // Dummy user for preview
            forceDeepMode: forceDeepMode === true,
            fileUpload,
        };

        const tier = determineTier(request);
        const creditCost = tier === 'thinker' ? 5 : 1;

        res.json({
            tier,
            creditCost,
            model: tier === 'cleaner' ? 'gemini-2.0-flash' :
                tier === 'worker' ? 'gemini-2.5-flash' : 'gemini-2.5-pro',
        });
    } catch (error) {
        console.error('[AI Routes] Tier preview error:', error);
        res.status(500).json({ error: 'Failed to preview tier' });
    }
});

export default router;
