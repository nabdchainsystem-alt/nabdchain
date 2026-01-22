import { GoogleGenerativeAI, Content, GenerativeModel } from '@google/generative-ai';
import { prisma } from '../lib/prisma';
import { getDepartmentPrompt } from './departmentPrompts';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ModelTier = 'cleaner' | 'worker' | 'thinker';

export interface AIRequest {
    prompt: string;
    userId: string;
    context?: AIContext;
    forceDeepMode?: boolean;
    fileUpload?: FileUploadData;
    promptType?: 'chart' | 'gtd' | 'analysis' | 'upload' | 'general';
}

export interface AIContext {
    department?: string;
    userRole?: string;
    existingMappings?: FileMappingData[];
    boardData?: string;
    history?: Content[];
}

export interface FileUploadData {
    fileName: string;
    headers: string[];
    sampleRows: Record<string, unknown>[];
    fileType: 'csv' | 'xlsx' | 'json';
}

export interface FileMappingData {
    originalSchema: Record<string, string>;
    mappedSchema: Record<string, string>;
    dataTypes: Record<string, string>;
}

export interface AIResponse {
    success: boolean;
    content?: string;
    tier: ModelTier;
    creditsUsed: number;
    error?: string;
    metadata?: {
        model: string;
        tokensUsed?: number;
        cached?: boolean;
    };
}

export interface ChartGenerationResult {
    success: boolean;
    chartConfig?: Record<string, unknown>;
    chartType?: string;
    error?: string;
}

export interface FileMappingResult {
    success: boolean;
    mapping?: FileMappingData;
    summary?: string;
    error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Model names for each tier
const MODEL_CONFIG = {
    cleaner: 'gemini-2.5-flash-preview-05-20',   // Tier 1: Low-cost data processing
    worker: 'gemini-3.0-flash-preview',          // Tier 2: Default engine (90% of requests)
    thinker: 'gemini-3.0-pro-preview',           // Tier 3: High-intelligence (10% of requests)
} as const;

// Credit costs per tier
const CREDIT_COSTS: Record<ModelTier, number> = {
    cleaner: 1,
    worker: 1,
    thinker: 5,
};

// Complexity patterns for tier detection
const COMPLEX_PATTERNS = [
    /analyze.*trend/i,
    /predict.*risk/i,
    /cross.*department/i,
    /strategic.*advice/i,
    /comprehensive.*audit/i,
    /compare.*all/i,
    /forecast/i,
    /correlation/i,
    /multi.*file/i,
    /q[1-4].*projection/i,
];

const SIMPLE_PATTERNS = [
    /create.*chart/i,
    /generate.*graph/i,
    /show.*data/i,
    /list.*task/i,
    /add.*task/i,
    /summarize/i,
];

// ============================================================================
// AI Router Service
// ============================================================================

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured in environment variables');
        }
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
    return genAI;
}

/**
 * Determines the appropriate model tier based on request complexity
 */
export function determineTier(request: AIRequest): ModelTier {
    // Tier 1: File uploads always go to cleaner
    if (request.fileUpload) {
        return 'cleaner';
    }

    // Tier 3: Force deep mode or complex patterns
    if (request.forceDeepMode) {
        return 'thinker';
    }

    const prompt = request.prompt.toLowerCase();

    // Check for complex patterns
    for (const pattern of COMPLEX_PATTERNS) {
        if (pattern.test(prompt)) {
            return 'thinker';
        }
    }

    // Check for simple patterns (default to worker)
    for (const pattern of SIMPLE_PATTERNS) {
        if (pattern.test(prompt)) {
            return 'worker';
        }
    }

    // Default to worker for most requests
    return 'worker';
}

/**
 * Checks if user has sufficient credits for the request
 */
export async function checkCredits(userId: string, tier: ModelTier): Promise<{ hasCredits: boolean; balance: number }> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aiCreditsBalance: true },
    });

    const balance = user?.aiCreditsBalance ?? 0;
    const cost = CREDIT_COSTS[tier];

    return {
        hasCredits: balance >= cost,
        balance,
    };
}

/**
 * Deducts credits from user's balance
 */
export async function deductCredits(userId: string, tier: ModelTier): Promise<number> {
    const cost = CREDIT_COSTS[tier];

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            aiCreditsBalance: {
                decrement: cost,
            },
        },
        select: { aiCreditsBalance: true },
    });

    return updatedUser.aiCreditsBalance;
}

/**
 * Logs AI usage for analytics
 */
export async function logAIUsage(
    userId: string,
    tier: ModelTier,
    creditsUsed: number,
    promptType: string,
    success: boolean
): Promise<void> {
    await prisma.aIUsageLog.create({
        data: {
            userId,
            tier,
            creditsUsed,
            promptType,
            success,
        },
    });
}

/**
 * Builds system prompt with department-specific instructions
 */
function buildSystemPrompt(basePrompt: string, context?: AIContext): string {
    let systemPrompt = basePrompt;

    if (context?.department) {
        const deptPrompt = getDepartmentPrompt(context.department);
        if (deptPrompt) {
            systemPrompt += `\n\nDepartment-specific guidance (${context.department}):\n${deptPrompt}`;
        }
    }

    if (context?.userRole) {
        systemPrompt += `\n\nUser role: ${context.userRole}`;
    }

    return systemPrompt;
}

/**
 * Gets the appropriate Gemini model for the tier
 */
function getModel(tier: ModelTier): GenerativeModel {
    const ai = getGenAI();
    const modelName = MODEL_CONFIG[tier];
    return ai.getGenerativeModel({ model: modelName });
}

/**
 * Main routing function - routes request to appropriate tier
 */
export async function routeRequest(request: AIRequest): Promise<AIResponse> {
    const tier = determineTier(request);
    const cost = CREDIT_COSTS[tier];

    // Check credits
    const { hasCredits, balance } = await checkCredits(request.userId, tier);
    if (!hasCredits) {
        return {
            success: false,
            tier,
            creditsUsed: 0,
            error: `Insufficient credits. Required: ${cost}, Available: ${balance}`,
        };
    }

    try {
        const model = getModel(tier);

        // Build system prompt based on tier and context
        let systemPrompt = '';
        switch (tier) {
            case 'cleaner':
                systemPrompt = buildSystemPrompt(
                    'You are a data processing assistant. Analyze file structures, detect data types, and generate normalized schema mappings. Output JSON only.',
                    request.context
                );
                break;
            case 'worker':
                systemPrompt = buildSystemPrompt(
                    'You are NABD AI, a helpful business assistant. Generate chart configurations, help with task management, and provide concise answers. For charts, output valid ECharts option JSON.',
                    request.context
                );
                break;
            case 'thinker':
                systemPrompt = buildSystemPrompt(
                    'You are NABD AI Strategic Advisor. Provide deep analysis, identify patterns across data, predict risks, and offer comprehensive strategic recommendations. Be thorough but actionable.',
                    request.context
                );
                break;
        }

        // Generate content
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
            systemInstruction: systemPrompt,
        });

        const responseText = result.response.text();

        // Deduct credits on success
        await deductCredits(request.userId, tier);

        // Log usage
        await logAIUsage(
            request.userId,
            tier,
            cost,
            request.promptType || 'general',
            true
        );

        return {
            success: true,
            content: responseText,
            tier,
            creditsUsed: cost,
            metadata: {
                model: MODEL_CONFIG[tier],
            },
        };
    } catch (error) {
        console.error('[AIRouter] Error:', error);

        // Log failed attempt
        await logAIUsage(
            request.userId,
            tier,
            0,
            request.promptType || 'general',
            false
        );

        return {
            success: false,
            tier,
            creditsUsed: 0,
            error: error instanceof Error ? error.message : 'Unknown AI error',
        };
    }
}

/**
 * Process file upload and generate schema mapping (Tier 1)
 */
export async function processFileUpload(
    userId: string,
    fileData: FileUploadData
): Promise<FileMappingResult> {
    const prompt = `Analyze this file structure and generate a normalized schema mapping.

File: ${fileData.fileName}
Type: ${fileData.fileType}
Headers: ${JSON.stringify(fileData.headers)}
Sample Data: ${JSON.stringify(fileData.sampleRows.slice(0, 3), null, 2)}

Generate a JSON response with:
1. "originalSchema": mapping of original headers to descriptions
2. "mappedSchema": normalized field names (e.g., "Item No" -> "itemCode", "Qty" -> "quantity")
3. "dataTypes": detected data type for each field (string, number, date, boolean)

Output valid JSON only, no markdown formatting.`;

    const response = await routeRequest({
        prompt,
        userId,
        fileUpload: fileData,
        promptType: 'upload',
    });

    if (!response.success || !response.content) {
        return {
            success: false,
            error: response.error || 'Failed to process file',
        };
    }

    try {
        // Clean potential markdown wrapping
        const cleanJson = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const mapping = JSON.parse(cleanJson) as FileMappingData;

        // Save to database
        await prisma.fileMapping.create({
            data: {
                userId,
                fileName: fileData.fileName,
                originalSchema: JSON.stringify(mapping.originalSchema),
                mappedSchema: JSON.stringify(mapping.mappedSchema),
                dataTypes: JSON.stringify(mapping.dataTypes),
            },
        });

        return {
            success: true,
            mapping,
            summary: `Processed ${fileData.headers.length} columns from ${fileData.fileName}`,
        };
    } catch (parseError) {
        console.error('[AIRouter] JSON parse error:', parseError);
        return {
            success: false,
            error: 'Failed to parse AI response as JSON',
        };
    }
}

/**
 * Generate chart configuration (Tier 2 by default, Tier 3 if deep mode)
 */
export async function generateChart(
    userId: string,
    prompt: string,
    data: Record<string, unknown>[],
    deepMode: boolean = false
): Promise<ChartGenerationResult> {
    const chartPrompt = `Generate an ECharts configuration for the following request.

User Request: ${prompt}

Available Data (sample):
${JSON.stringify(data.slice(0, 10), null, 2)}

Requirements:
1. Output a valid ECharts option object as JSON
2. Include appropriate chart type (bar, line, pie, scatter, etc.)
3. Set sensible defaults for colors, legends, and tooltips
4. Make the chart visually appealing with proper titles and labels

Output valid JSON only, no markdown formatting or explanations.`;

    const response = await routeRequest({
        prompt: chartPrompt,
        userId,
        forceDeepMode: deepMode,
        promptType: 'chart',
    });

    if (!response.success || !response.content) {
        return {
            success: false,
            error: response.error || 'Failed to generate chart',
        };
    }

    try {
        const cleanJson = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const chartConfig = JSON.parse(cleanJson);

        return {
            success: true,
            chartConfig,
            chartType: chartConfig.series?.[0]?.type || 'bar',
        };
    } catch (parseError) {
        console.error('[AIRouter] Chart config parse error:', parseError);
        return {
            success: false,
            error: 'Failed to parse chart configuration',
        };
    }
}

/**
 * Get user's current credit balance
 */
export async function getCreditsBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aiCreditsBalance: true },
    });
    return user?.aiCreditsBalance ?? 0;
}
