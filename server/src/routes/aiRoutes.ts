import { Router, Request, Response } from 'express';
import {
    routeRequest,
    processFileUpload,
    generateChart,
    generateTable,
    generateForecast,
    generateTips,
    extractGTDTasks,
    analyzeDeep,
    getCreditsBalance,
    addCredits,
    getUsageStats,
    determineTier,
    analyzeComplexity,
    AIRequest,
    AIContext,
    FileUploadData,
} from '../services/aiRouterService';
import { aiLogger } from '../utils/logger';

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
        aiLogger.error('Get credits error:', error);
        res.status(500).json({ error: 'Failed to get credit balance' });
    }
});

/**
 * POST /api/ai/credits/add
 * Add credits to user's balance (admin/purchase endpoint)
 */
router.post('/credits/add', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { amount } = req.body;
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Valid positive amount is required' });
        }

        const newBalance = await addCredits(userId, amount);
        res.json({ credits: newBalance, added: amount });
    } catch (error) {
        aiLogger.error('Add credits error:', error);
        res.status(500).json({ error: 'Failed to add credits' });
    }
});

/**
 * GET /api/ai/usage
 * Get AI usage statistics for the user
 */
router.get('/usage', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { startDate, endDate } = req.query;
        const stats = await getUsageStats(
            userId,
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined
        );

        res.json(stats);
    } catch (error) {
        aiLogger.error('Usage stats error:', error);
        res.status(500).json({ error: 'Failed to get usage statistics' });
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

        const { prompt, context, forceDeepMode, promptType, conversationId, includeHistory } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const request: AIRequest = {
            prompt,
            userId,
            context,
            forceDeepMode: forceDeepMode === true,
            promptType: promptType || 'general',
            conversationId,
            includeHistory,
        };

        // Analyze complexity for transparency
        const complexity = analyzeComplexity(prompt, context);
        const tier = determineTier(request);

        const response = await routeRequest(request);

        res.json({
            ...response,
            requestedTier: tier,
            complexityScore: complexity.score,
            complexityFactors: complexity.factors,
        });
    } catch (error) {
        aiLogger.error('Process error:', error);
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
        aiLogger.error('Upload error:', error);
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
        aiLogger.error('Chart error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Chart generation failed'
        });
    }
});

/**
 * POST /api/ai/table
 * Generate data table from analysis (Tier 2 Worker)
 */
router.post('/table', async (req: AuthRequest, res: Response) => {
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

        const result = await generateTable(userId, prompt, data, deepMode === true);
        res.json(result);
    } catch (error) {
        aiLogger.error('Table error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Table generation failed'
        });
    }
});

/**
 * POST /api/ai/forecast
 * Generate forecast predictions (Tier 3 - Thinker)
 */
router.post('/forecast', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { prompt, data, periods } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Historical data array is required' });
        }

        const result = await generateForecast(userId, prompt, data, periods || 6);
        res.json(result);
    } catch (error) {
        aiLogger.error('Forecast error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Forecast generation failed'
        });
    }
});

/**
 * POST /api/ai/tips
 * Generate actionable tips and recommendations
 */
router.post('/tips', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { context, focusArea } = req.body;

        const aiContext: AIContext = context || {};
        const result = await generateTips(userId, aiContext, focusArea);
        res.json(result);
    } catch (error) {
        aiLogger.error('Tips error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Tips generation failed'
        });
    }
});

/**
 * POST /api/ai/gtd
 * Extract GTD tasks from natural language
 */
router.post('/gtd', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { input, context } = req.body;

        if (!input || typeof input !== 'string') {
            return res.status(400).json({ error: 'Input text is required' });
        }

        const result = await extractGTDTasks(userId, input, context);
        res.json(result);
    } catch (error) {
        aiLogger.error('GTD error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'GTD task extraction failed'
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

        const response = await analyzeDeep(userId, prompt, context);
        res.json(response);
    } catch (error) {
        aiLogger.error('Analyze error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Analysis failed'
        });
    }
});

/**
 * POST /api/ai/tier-preview
 * Preview which tier would be used for a given prompt (no credits charged)
 */
router.post('/tier-preview', async (req: AuthRequest, res: Response) => {
    try {
        const { prompt, context, forceDeepMode, fileUpload } = req.body;

        if (!prompt && !fileUpload) {
            return res.status(400).json({ error: 'Prompt or fileUpload is required' });
        }

        const request: AIRequest = {
            prompt: prompt || '',
            userId: 'preview', // Dummy user for preview
            context,
            forceDeepMode: forceDeepMode === true,
            fileUpload,
        };

        const tier = determineTier(request);
        const complexity = analyzeComplexity(prompt || '', context);
        const creditCost = tier === 'thinker' ? 5 : 1;

        // Model names for display
        const modelNames: Record<string, string> = {
            cleaner: 'Gemini 2.5 Flash',
            worker: 'Gemini 3 Flash',
            thinker: 'Gemini 3 Pro',
        };

        res.json({
            tier,
            creditCost,
            model: modelNames[tier],
            complexity: {
                score: complexity.score,
                confidence: complexity.confidence,
                factors: complexity.factors,
            },
        });
    } catch (error) {
        aiLogger.error('Tier preview error:', error);
        res.status(500).json({ error: 'Failed to preview tier' });
    }
});

/**
 * POST /api/ai/complexity
 * Analyze prompt complexity without processing
 */
router.post('/complexity', async (req: AuthRequest, res: Response) => {
    try {
        const { prompt, context } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const complexity = analyzeComplexity(prompt, context);

        res.json({
            score: complexity.score,
            tier: complexity.tier,
            confidence: complexity.confidence,
            factors: complexity.factors,
        });
    } catch (error) {
        aiLogger.error('Complexity analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze complexity' });
    }
});

export default router;
