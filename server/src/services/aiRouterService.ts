import { GoogleGenerativeAI, Content, GenerativeModel, CachedContent } from '@google/generative-ai';
import { prisma } from '../lib/prisma';
import { getDepartmentPrompt } from './departmentPrompts';
import { aiLogger } from '../utils/logger';

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
    promptType?: 'chart' | 'gtd' | 'analysis' | 'upload' | 'general' | 'table' | 'forecast' | 'tips';
    conversationId?: string;
    includeHistory?: boolean;
}

export interface AIContext {
    department?: string;
    userRole?: string;
    existingMappings?: FileMappingData[];
    boardData?: BoardContextData;
    roomData?: RoomContextData;
    history?: Content[];
    projectContext?: string;
}

export interface BoardContextData {
    id: string;
    name: string;
    columns: string[];
    taskCount: number;
    sampleTasks?: Record<string, unknown>[];
}

export interface RoomContextData {
    id: string;
    name: string;
    columns: string[];
    rowCount: number;
    sampleRows?: Record<string, unknown>[];
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
        confidence?: number;
        escalated?: boolean;
        processingTime?: number;
    };
    conversationId?: string;
}

export interface ChartGenerationResult {
    success: boolean;
    chartConfig?: Record<string, unknown>;
    chartType?: string;
    insights?: string[];
    error?: string;
}

export interface TableGenerationResult {
    success: boolean;
    tableData?: {
        columns: { key: string; label: string; type: string }[];
        rows: Record<string, unknown>[];
        summary?: string;
    };
    error?: string;
}

export interface ForecastResult {
    success: boolean;
    forecast?: {
        predictions: { period: string; value: number; confidence: number }[];
        trend: 'up' | 'down' | 'stable';
        insights: string[];
        methodology: string;
    };
    error?: string;
}

export interface TipsResult {
    success: boolean;
    tips?: {
        category: string;
        priority: 'high' | 'medium' | 'low';
        title: string;
        description: string;
        actionItems: string[];
    }[];
    error?: string;
}

export interface FileMappingResult {
    success: boolean;
    mapping?: FileMappingData;
    summary?: string;
    error?: string;
}

export interface GTDTaskResult {
    success: boolean;
    tasks?: {
        title: string;
        description?: string;
        priority: 'urgent' | 'high' | 'medium' | 'low';
        dueDate?: string;
        category?: string;
        subtasks?: string[];
    }[];
    error?: string;
}

export interface ComplexityAnalysis {
    score: number; // 0-100
    tier: ModelTier;
    confidence: number; // 0-1
    factors: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Model names for each tier - Updated to correct Gemini model names
const MODEL_CONFIG = {
    cleaner: 'gemini-2.5-flash-preview-05-20',  // Tier 1: Gemini 2.5 Flash - Low-cost data processing
    worker: 'gemini-2.5-flash-preview-05-20',   // Tier 2: Gemini 3 Flash - Default engine (90% of requests)
    thinker: 'gemini-2.5-pro-preview-06-05',    // Tier 3: Gemini 3 Pro - High-intelligence (10% of requests)
} as const;

// Fallback models if primary fails
const FALLBACK_MODELS = {
    cleaner: 'gemini-2.0-flash',
    worker: 'gemini-2.0-flash',
    thinker: 'gemini-2.5-flash-preview-05-20',
} as const;

// Credit costs per tier
const CREDIT_COSTS: Record<ModelTier, number> = {
    cleaner: 1,
    worker: 1,
    thinker: 5,
};

// Complexity patterns for semantic analysis
const COMPLEXITY_INDICATORS = {
    high: {
        patterns: [
            /analyze.*trend/i,
            /predict.*risk/i,
            /cross.*department/i,
            /strategic.*advice/i,
            /comprehensive.*audit/i,
            /compare.*all/i,
            /forecast.*(?:revenue|sales|growth|demand)/i,
            /correlation.*between/i,
            /multi.*(?:file|source|department)/i,
            /q[1-4].*projection/i,
            /(?:annual|quarterly|monthly).*(?:report|analysis)/i,
            /root.*cause.*analysis/i,
            /what.*(?:if|should)/i,
            /optimize.*(?:across|multiple)/i,
            /identify.*(?:patterns|anomalies|outliers)/i,
            /benchmark.*(?:against|comparison)/i,
            /scenario.*planning/i,
            /risk.*assessment/i,
            /performance.*(?:gap|improvement)/i,
        ],
        keywords: [
            'strategic', 'comprehensive', 'holistic', 'enterprise-wide',
            'cross-functional', 'long-term', 'predictive', 'diagnostic',
            'prescriptive', 'correlation', 'regression', 'sentiment',
            'anomaly', 'outlier', 'benchmark', 'competitive', 'market',
        ],
        weight: 30,
    },
    medium: {
        patterns: [
            /create.*(?:chart|graph|visualization)/i,
            /generate.*(?:report|summary)/i,
            /show.*(?:data|metrics|stats)/i,
            /compare.*(?:two|these|specific)/i,
            /calculate.*(?:total|average|sum)/i,
            /list.*(?:top|bottom|all)/i,
            /group.*by/i,
            /filter.*(?:where|when)/i,
            /sort.*(?:by|ascending|descending)/i,
        ],
        keywords: [
            'chart', 'graph', 'table', 'report', 'summary', 'list',
            'calculate', 'count', 'total', 'average', 'filter', 'sort',
        ],
        weight: 15,
    },
    low: {
        patterns: [
            /add.*task/i,
            /create.*(?:task|item|entry)/i,
            /update.*(?:status|field)/i,
            /delete.*(?:task|item)/i,
            /mark.*(?:complete|done)/i,
            /what.*is/i,
            /how.*(?:many|much)/i,
            /when.*(?:is|was)/i,
        ],
        keywords: [
            'add', 'create', 'update', 'delete', 'simple', 'basic',
            'quick', 'single', 'one', 'specific',
        ],
        weight: 5,
    },
};

// Data complexity indicators
const DATA_COMPLEXITY_THRESHOLDS = {
    rowCount: { low: 100, medium: 1000, high: 10000 },
    columnCount: { low: 5, medium: 15, high: 30 },
    fileCount: { low: 1, medium: 3, high: 5 },
};

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
};

// Context cache TTL (15 minutes)
const CONTEXT_CACHE_TTL = 15 * 60 * 1000;

// ============================================================================
// In-Memory Cache for Context
// ============================================================================

interface CacheEntry {
    content: string;
    timestamp: number;
    tier: ModelTier;
}

const contextCache = new Map<string, CacheEntry>();

function getCacheKey(userId: string, promptType: string, department?: string): string {
    return `${userId}:${promptType}:${department || 'general'}`;
}

function getCachedContext(key: string): CacheEntry | null {
    const entry = contextCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CONTEXT_CACHE_TTL) {
        contextCache.delete(key);
        return null;
    }

    return entry;
}

function setCachedContext(key: string, content: string, tier: ModelTier): void {
    contextCache.set(key, {
        content,
        timestamp: Date.now(),
        tier,
    });
}

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
 * Analyzes prompt complexity using semantic analysis
 */
export function analyzeComplexity(prompt: string, context?: AIContext): ComplexityAnalysis {
    const factors: string[] = [];
    let score = 0;

    const lowerPrompt = prompt.toLowerCase();
    const words = lowerPrompt.split(/\s+/);

    // Check high complexity patterns
    for (const pattern of COMPLEXITY_INDICATORS.high.patterns) {
        if (pattern.test(prompt)) {
            score += COMPLEXITY_INDICATORS.high.weight;
            factors.push(`High complexity pattern: ${pattern.source}`);
        }
    }

    // Check high complexity keywords
    for (const keyword of COMPLEXITY_INDICATORS.high.keywords) {
        if (words.includes(keyword)) {
            score += 5;
            factors.push(`High complexity keyword: ${keyword}`);
        }
    }

    // Check medium complexity patterns
    for (const pattern of COMPLEXITY_INDICATORS.medium.patterns) {
        if (pattern.test(prompt)) {
            score += COMPLEXITY_INDICATORS.medium.weight;
            factors.push(`Medium complexity pattern: ${pattern.source}`);
        }
    }

    // Check medium complexity keywords
    for (const keyword of COMPLEXITY_INDICATORS.medium.keywords) {
        if (words.includes(keyword)) {
            score += 3;
            factors.push(`Medium complexity keyword: ${keyword}`);
        }
    }

    // Analyze data context complexity
    if (context?.boardData) {
        const taskCount = context.boardData.taskCount || 0;
        if (taskCount > DATA_COMPLEXITY_THRESHOLDS.rowCount.high) {
            score += 20;
            factors.push(`Large dataset: ${taskCount} tasks`);
        } else if (taskCount > DATA_COMPLEXITY_THRESHOLDS.rowCount.medium) {
            score += 10;
            factors.push(`Medium dataset: ${taskCount} tasks`);
        }
    }

    if (context?.roomData) {
        const rowCount = context.roomData.rowCount || 0;
        const colCount = context.roomData.columns?.length || 0;

        if (rowCount > DATA_COMPLEXITY_THRESHOLDS.rowCount.high) {
            score += 20;
            factors.push(`Large table: ${rowCount} rows`);
        }

        if (colCount > DATA_COMPLEXITY_THRESHOLDS.columnCount.high) {
            score += 15;
            factors.push(`Wide table: ${colCount} columns`);
        }
    }

    // Prompt length complexity
    if (prompt.length > 500) {
        score += 10;
        factors.push('Long prompt');
    }

    // Multiple questions indicator
    const questionMarks = (prompt.match(/\?/g) || []).length;
    if (questionMarks > 2) {
        score += questionMarks * 5;
        factors.push(`Multiple questions: ${questionMarks}`);
    }

    // Determine tier based on score
    let tier: ModelTier;
    let confidence: number;

    if (score >= 50) {
        tier = 'thinker';
        confidence = Math.min(0.95, 0.6 + (score - 50) / 100);
    } else if (score >= 20) {
        tier = 'worker';
        confidence = Math.min(0.9, 0.5 + (score - 20) / 60);
    } else {
        tier = 'worker'; // Default to worker, not cleaner (cleaner is only for files)
        confidence = 0.8;
    }

    return { score, tier, confidence, factors };
}

/**
 * Determines the appropriate model tier based on request complexity
 */
export function determineTier(request: AIRequest): ModelTier {
    // Tier 1: File uploads always go to cleaner
    if (request.fileUpload) {
        return 'cleaner';
    }

    // Tier 3: Force deep mode
    if (request.forceDeepMode) {
        return 'thinker';
    }

    // Tier 3: Specific prompt types that always need deep analysis
    if (request.promptType === 'forecast' || request.promptType === 'analysis') {
        return 'thinker';
    }

    // Use semantic complexity analysis
    const analysis = analyzeComplexity(request.prompt, request.context);

    return analysis.tier;
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
 * Logs AI usage for analytics with extended metadata
 */
export async function logAIUsage(
    userId: string,
    tier: ModelTier,
    creditsUsed: number,
    promptType: string,
    success: boolean,
    metadata?: {
        promptLength?: number;
        responseLength?: number;
        processingTime?: number;
        escalated?: boolean;
        cached?: boolean;
    }
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
 * Gets conversation history for context
 */
export async function getConversationHistory(
    userId: string,
    conversationId?: string,
    limit: number = 10
): Promise<Content[]> {
    // For now, we'll use a simple in-memory approach
    // In a production system, this would query from a conversations table
    return [];
}

/**
 * Saves conversation turn
 */
export async function saveConversationTurn(
    userId: string,
    conversationId: string,
    role: 'user' | 'model',
    content: string
): Promise<void> {
    // In production, save to database
    // For now, this is a placeholder
}

/**
 * Builds comprehensive system prompt with department-specific instructions
 */
function buildSystemPrompt(tier: ModelTier, context?: AIContext, promptType?: string): string {
    let systemPrompt = '';

    // Base prompts for each tier
    const basePrompts: Record<ModelTier, string> = {
        cleaner: `You are NABD Brain - Data Processor Module.
Your role is to analyze and normalize data structures for the NABD enterprise platform.

Capabilities:
- Analyze file structures (CSV, Excel, JSON)
- Detect and classify data types
- Generate normalized schema mappings
- Standardize column names to camelCase
- Identify data quality issues and anomalies

Rules:
- Output JSON only, no markdown formatting
- Map business terms to standard names (qty→quantity, amt→amount)
- Detect currencies, percentages, dates separately
- Flag potential data quality issues`,

        worker: `You are NABD Brain - Intelligence Engine.
A powerful AI assistant for the NABD enterprise platform, optimized for speed and efficiency.

Capabilities:
- Generate chart configurations (ECharts format)
- Create data tables and summaries
- Help with task management and GTD methodology
- Provide concise, actionable business insights
- Answer questions about data and metrics

Guidelines:
- Be concise and direct - respect the user's time
- For charts, output valid ECharts option JSON only
- For tables, output structured JSON with columns and rows
- For tasks, extract actionable items with clear priorities
- Consider department context when available
- Focus on practical, implementable answers`,

        thinker: `You are NABD Brain - Strategic Advisor Module.
An expert business analyst and strategist for the NABD enterprise platform, designed for deep analysis.

Capabilities:
- Multi-dimensional data analysis across departments
- Pattern recognition and anomaly detection
- Predictive forecasting with confidence intervals
- Strategic recommendations with action plans
- Risk assessment and mitigation strategies
- Cross-departmental correlation analysis
- Benchmark comparisons and competitive insights
- Scenario planning and what-if analysis

Guidelines:
- Provide thorough, well-reasoned analysis
- Support every insight with data references
- Include confidence levels (0-100%) for predictions
- Offer multiple scenarios when uncertainty exists
- Prioritize actionable recommendations
- Consider both short-term and long-term impacts
- Identify risks and mitigation strategies
- Connect insights to business outcomes`,
    };

    systemPrompt = basePrompts[tier];

    // Add prompt-type specific instructions
    const promptTypeInstructions: Record<string, string> = {
        chart: `\n\nChart Generation Instructions:
- Output valid ECharts option object as JSON
- Include appropriate chart type (bar, line, pie, scatter, area, radar, funnel)
- Set sensible colors, legends, and tooltips
- Make charts visually appealing with proper titles
- For comparisons, use grouped/stacked bars
- For trends, use line or area charts
- For distributions, use pie or radar charts`,

        table: `\n\nTable Generation Instructions:
- Output JSON with structure: { columns: [{key, label, type}], rows: [{...}], summary: string }
- Include data types for columns (string, number, date, boolean)
- Sort data meaningfully (by importance or value)
- Include summary statistics when relevant
- Limit to most relevant rows if data is large`,

        forecast: `\n\nForecasting Instructions:
- Output JSON with structure: { predictions: [{period, value, confidence}], trend, insights, methodology }
- Include confidence intervals (0-1)
- Identify trend direction (up, down, stable)
- Explain methodology used
- List key assumptions
- Highlight potential risks to forecast`,

        tips: `\n\nTips Generation Instructions:
- Output JSON array of tips with structure: { category, priority, title, description, actionItems }
- Prioritize by impact (high, medium, low)
- Make tips specific and actionable
- Include clear action items
- Consider department context
- Focus on quick wins and strategic improvements`,

        gtd: `\n\nGTD Task Generation Instructions:
- Extract actionable tasks from the request
- Output JSON array: { title, description, priority, dueDate, category, subtasks }
- Use priority levels: urgent, high, medium, low
- Break down complex items into subtasks
- Suggest realistic due dates if timeline mentioned
- Categorize tasks (work, follow-up, waiting, reference)`,

        analysis: `\n\nDeep Analysis Instructions:
- Provide comprehensive multi-factor analysis
- Identify patterns, trends, and anomalies
- Include root cause analysis when applicable
- Suggest correlations with evidence
- Provide confidence levels for insights
- Structure output with clear sections
- End with prioritized recommendations`,
    };

    if (promptType && promptTypeInstructions[promptType]) {
        systemPrompt += promptTypeInstructions[promptType];
    }

    // Add department context
    if (context?.department) {
        const deptPrompt = getDepartmentPrompt(context.department);
        if (deptPrompt) {
            systemPrompt += `\n\nDepartment Context (${context.department}):\n${deptPrompt}`;
        }
    }

    // Add user role context
    if (context?.userRole) {
        systemPrompt += `\n\nUser Role: ${context.userRole}`;
    }

    // Add project context
    if (context?.projectContext) {
        systemPrompt += `\n\nProject Context:\n${context.projectContext}`;
    }

    // Add board/room data context
    if (context?.boardData) {
        systemPrompt += `\n\nCurrent Board: "${context.boardData.name}" with ${context.boardData.taskCount} tasks`;
        if (context.boardData.columns?.length) {
            systemPrompt += `\nAvailable columns: ${context.boardData.columns.join(', ')}`;
        }
    }

    if (context?.roomData) {
        systemPrompt += `\n\nCurrent Table: "${context.roomData.name}" with ${context.roomData.rowCount} rows`;
        if (context.roomData.columns?.length) {
            systemPrompt += `\nTable columns: ${context.roomData.columns.join(', ')}`;
        }
    }

    return systemPrompt;
}

/**
 * Gets the appropriate Gemini model for the tier with fallback support
 */
async function getModelWithFallback(
    tier: ModelTier,
    useFallback: boolean = false
): Promise<{ model: GenerativeModel; modelName: string }> {
    const ai = getGenAI();
    const modelName = useFallback ? FALLBACK_MODELS[tier] : MODEL_CONFIG[tier];
    const model = ai.getGenerativeModel({ model: modelName });
    return { model, modelName };
}

/**
 * Executes AI request with retry logic
 */
async function executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry on certain errors
            if (lastError.message.includes('PERMISSION_DENIED') ||
                lastError.message.includes('INVALID_API_KEY') ||
                lastError.message.includes('quota')) {
                throw lastError;
            }

            // Exponential backoff
            const delay = Math.min(
                RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
                RETRY_CONFIG.maxDelay
            );
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

/**
 * Main routing function - routes request to appropriate tier with smart escalation
 */
export async function routeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    let tier = determineTier(request);
    const originalTier = tier;
    const cost = CREDIT_COSTS[tier];
    const complexityAnalysis = analyzeComplexity(request.prompt, request.context);

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

    let useFallback = false;
    let escalated = false;

    try {
        const { model, modelName } = await getModelWithFallback(tier, useFallback);

        // Build system prompt based on tier and context
        const systemPrompt = buildSystemPrompt(tier, request.context, request.promptType);

        // Build conversation history if available
        let contents: Content[] = [];
        if (request.includeHistory && request.conversationId) {
            contents = await getConversationHistory(request.userId, request.conversationId);
        }
        contents.push({ role: 'user', parts: [{ text: request.prompt }] });

        // Generate content with retry
        const result = await executeWithRetry(async () => {
            return model.generateContent({
                contents,
                systemInstruction: systemPrompt,
            });
        });

        const responseText = result.response.text();

        // Check if response indicates low confidence and should escalate to higher tier
        if (tier === 'worker' && complexityAnalysis.confidence < 0.6) {
            // Consider escalating to thinker
            const escalationIndicators = [
                /i('m| am) not sure/i,
                /i cannot determine/i,
                /insufficient.*data/i,
                /need more.*context/i,
                /too complex/i,
            ];

            const shouldEscalate = escalationIndicators.some(pattern => pattern.test(responseText));

            if (shouldEscalate) {
                // Check if user has credits for thinker
                const { hasCredits: hasThinkerCredits } = await checkCredits(request.userId, 'thinker');

                if (hasThinkerCredits) {
                    // Escalate to thinker
                    tier = 'thinker';
                    escalated = true;

                    const { model: thinkerModel, modelName: thinkerModelName } = await getModelWithFallback('thinker');
                    const thinkerPrompt = buildSystemPrompt('thinker', request.context, request.promptType);

                    const thinkerResult = await executeWithRetry(async () => {
                        return thinkerModel.generateContent({
                            contents,
                            systemInstruction: thinkerPrompt,
                        });
                    });

                    const thinkerResponse = thinkerResult.response.text();

                    // Deduct thinker credits
                    await deductCredits(request.userId, 'thinker');

                    const processingTime = Date.now() - startTime;

                    await logAIUsage(
                        request.userId,
                        'thinker',
                        CREDIT_COSTS.thinker,
                        request.promptType || 'general',
                        true,
                        { promptLength: request.prompt.length, responseLength: thinkerResponse.length, processingTime, escalated: true }
                    );

                    return {
                        success: true,
                        content: thinkerResponse,
                        tier: 'thinker',
                        creditsUsed: CREDIT_COSTS.thinker,
                        metadata: {
                            model: thinkerModelName,
                            confidence: complexityAnalysis.confidence,
                            escalated: true,
                            processingTime,
                        },
                    };
                }
            }
        }

        // Deduct credits on success
        await deductCredits(request.userId, tier);

        const processingTime = Date.now() - startTime;

        // Log usage
        await logAIUsage(
            request.userId,
            tier,
            CREDIT_COSTS[tier],
            request.promptType || 'general',
            true,
            { promptLength: request.prompt.length, responseLength: responseText.length, processingTime }
        );

        // Save conversation turn if tracking
        if (request.conversationId) {
            await saveConversationTurn(request.userId, request.conversationId, 'user', request.prompt);
            await saveConversationTurn(request.userId, request.conversationId, 'model', responseText);
        }

        return {
            success: true,
            content: responseText,
            tier,
            creditsUsed: CREDIT_COSTS[tier],
            metadata: {
                model: modelName,
                confidence: complexityAnalysis.confidence,
                escalated,
                processingTime,
            },
            conversationId: request.conversationId,
        };
    } catch (error) {
        aiLogger.error('[AIRouter] Error:', error);

        // Try fallback model if primary fails
        if (!useFallback) {
            try {
                const { model: fallbackModel, modelName: fallbackModelName } = await getModelWithFallback(tier, true);
                const systemPrompt = buildSystemPrompt(tier, request.context, request.promptType);

                const result = await fallbackModel.generateContent({
                    contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
                    systemInstruction: systemPrompt,
                });

                const responseText = result.response.text();
                await deductCredits(request.userId, tier);

                const processingTime = Date.now() - startTime;

                await logAIUsage(
                    request.userId,
                    tier,
                    CREDIT_COSTS[tier],
                    request.promptType || 'general',
                    true,
                    { promptLength: request.prompt.length, responseLength: responseText.length, processingTime }
                );

                return {
                    success: true,
                    content: responseText,
                    tier,
                    creditsUsed: CREDIT_COSTS[tier],
                    metadata: {
                        model: fallbackModelName,
                        processingTime,
                    },
                };
            } catch (fallbackError) {
                aiLogger.error('[AIRouter] Fallback error:', fallbackError);
            }
        }

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
Sample Data: ${JSON.stringify(fileData.sampleRows.slice(0, 5), null, 2)}

Generate a JSON response with:
1. "originalSchema": object mapping original header names to their descriptions
2. "mappedSchema": object mapping original headers to normalized camelCase field names (e.g., "Item No" -> "itemCode", "Qty" -> "quantity", "Unit Price" -> "unitPrice")
3. "dataTypes": object mapping normalized field names to detected types (string, number, date, boolean, currency, percentage)

Rules for mapping:
- Use camelCase for all normalized names
- Standardize common business terms (qty->quantity, amt->amount, desc->description)
- Detect currencies and percentages separately from numbers
- Identify date formats

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
        aiLogger.error('[AIRouter] JSON parse error:', parseError);
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
    const sampleSize = Math.min(data.length, deepMode ? 50 : 20);
    const sampleData = data.slice(0, sampleSize);

    const chartPrompt = `Generate an ECharts configuration for the following request.

User Request: ${prompt}

Data Summary:
- Total rows: ${data.length}
- Sample data (${sampleSize} rows):
${JSON.stringify(sampleData, null, 2)}

${deepMode ? `
Additional Analysis Required:
- Identify the best chart type for this data
- Include trend lines if showing time series
- Add statistical annotations (avg, min, max) where relevant
- Suggest data groupings if appropriate
` : ''}

Output Requirements:
1. Valid ECharts option object as JSON
2. Appropriate chart type based on data characteristics
3. Proper axis labels and formatting
4. Color scheme suitable for business dashboards
5. Responsive tooltip configuration
6. Legend if multiple series

${deepMode ? 'Also include an "insights" array with 2-3 key observations about the data.' : ''}

Output valid JSON only, no markdown formatting.`;

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
        const result = JSON.parse(cleanJson);

        // Handle both formats (with insights wrapper or direct config)
        const chartConfig = result.option || result.chartConfig || result;
        const insights = result.insights || [];

        return {
            success: true,
            chartConfig,
            chartType: chartConfig.series?.[0]?.type || 'bar',
            insights,
        };
    } catch (parseError) {
        aiLogger.error('[AIRouter] Chart config parse error:', parseError);
        return {
            success: false,
            error: 'Failed to parse chart configuration',
        };
    }
}

/**
 * Generate data table from analysis (Tier 2)
 */
export async function generateTable(
    userId: string,
    prompt: string,
    sourceData: Record<string, unknown>[],
    deepMode: boolean = false
): Promise<TableGenerationResult> {
    const sampleSize = Math.min(sourceData.length, 30);

    const tablePrompt = `Generate a data table based on this request.

User Request: ${prompt}

Source Data (${sourceData.length} total rows, showing ${sampleSize}):
${JSON.stringify(sourceData.slice(0, sampleSize), null, 2)}

Output a JSON object with:
{
    "columns": [
        { "key": "fieldName", "label": "Display Label", "type": "string|number|date|currency|percentage" }
    ],
    "rows": [
        { "fieldName": "value", ... }
    ],
    "summary": "Brief description of what this table shows"
}

Requirements:
- Select and transform relevant columns based on the request
- Apply appropriate aggregations (sum, avg, count) if requested
- Sort data meaningfully
- Format numbers and dates appropriately
- Limit to 50 most relevant rows

Output valid JSON only, no markdown formatting.`;

    const response = await routeRequest({
        prompt: tablePrompt,
        userId,
        forceDeepMode: deepMode,
        promptType: 'table',
    });

    if (!response.success || !response.content) {
        return {
            success: false,
            error: response.error || 'Failed to generate table',
        };
    }

    try {
        const cleanJson = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const tableData = JSON.parse(cleanJson);

        return {
            success: true,
            tableData,
        };
    } catch (parseError) {
        aiLogger.error('[AIRouter] Table parse error:', parseError);
        return {
            success: false,
            error: 'Failed to parse table data',
        };
    }
}

/**
 * Generate forecast predictions (Tier 3 - Thinker)
 */
export async function generateForecast(
    userId: string,
    prompt: string,
    historicalData: Record<string, unknown>[],
    periods: number = 6
): Promise<ForecastResult> {
    const forecastPrompt = `Generate a forecast based on this historical data.

User Request: ${prompt}

Historical Data (${historicalData.length} periods):
${JSON.stringify(historicalData, null, 2)}

Forecast ${periods} future periods.

Output JSON:
{
    "predictions": [
        { "period": "2024-Q1", "value": 12500, "confidence": 0.85 }
    ],
    "trend": "up|down|stable",
    "insights": [
        "Key insight about the forecast..."
    ],
    "methodology": "Description of forecasting approach used",
    "assumptions": ["List of key assumptions"],
    "risks": ["Potential risks to this forecast"]
}

Requirements:
- Use appropriate forecasting methodology for the data pattern
- Include confidence intervals (0-1 scale)
- Identify seasonality if present
- Note any anomalies in historical data
- Provide actionable insights

Output valid JSON only, no markdown formatting.`;

    const response = await routeRequest({
        prompt: forecastPrompt,
        userId,
        forceDeepMode: true,
        promptType: 'forecast',
    });

    if (!response.success || !response.content) {
        return {
            success: false,
            error: response.error || 'Failed to generate forecast',
        };
    }

    try {
        const cleanJson = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const forecast = JSON.parse(cleanJson);

        return {
            success: true,
            forecast,
        };
    } catch (parseError) {
        aiLogger.error('[AIRouter] Forecast parse error:', parseError);
        return {
            success: false,
            error: 'Failed to parse forecast data',
        };
    }
}

/**
 * Generate actionable tips and recommendations (Tier 2/3)
 */
export async function generateTips(
    userId: string,
    context: AIContext,
    focusArea?: string
): Promise<TipsResult> {
    const tipsPrompt = `Generate actionable tips and recommendations.

Context:
- Department: ${context.department || 'General'}
- Role: ${context.userRole || 'User'}
${context.boardData ? `- Current Board: ${context.boardData.name} with ${context.boardData.taskCount} tasks` : ''}
${context.roomData ? `- Current Table: ${context.roomData.name} with ${context.roomData.rowCount} rows` : ''}
${focusArea ? `- Focus Area: ${focusArea}` : ''}

Generate 3-5 relevant tips as JSON array:
[
    {
        "category": "Category name",
        "priority": "high|medium|low",
        "title": "Brief tip title",
        "description": "Detailed explanation",
        "actionItems": ["Specific action 1", "Specific action 2"]
    }
]

Requirements:
- Prioritize by potential impact
- Make tips specific and actionable
- Include measurable action items
- Consider the department context
- Mix quick wins with strategic improvements

Output valid JSON only, no markdown formatting.`;

    const response = await routeRequest({
        prompt: tipsPrompt,
        userId,
        context,
        promptType: 'tips',
    });

    if (!response.success || !response.content) {
        return {
            success: false,
            error: response.error || 'Failed to generate tips',
        };
    }

    try {
        const cleanJson = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const tips = JSON.parse(cleanJson);

        return {
            success: true,
            tips: Array.isArray(tips) ? tips : tips.tips,
        };
    } catch (parseError) {
        aiLogger.error('[AIRouter] Tips parse error:', parseError);
        return {
            success: false,
            error: 'Failed to parse tips',
        };
    }
}

/**
 * Extract GTD tasks from natural language (Tier 2)
 */
export async function extractGTDTasks(
    userId: string,
    input: string,
    context?: AIContext
): Promise<GTDTaskResult> {
    const gtdPrompt = `Extract actionable GTD (Getting Things Done) tasks from this input.

Input: "${input}"

${context?.department ? `Department Context: ${context.department}` : ''}

Output JSON array of tasks:
[
    {
        "title": "Clear, actionable task title",
        "description": "Optional details",
        "priority": "urgent|high|medium|low",
        "dueDate": "YYYY-MM-DD or null",
        "category": "next_action|waiting_for|someday|project|reference",
        "subtasks": ["Subtask 1", "Subtask 2"]
    }
]

GTD Rules:
- Tasks must start with a verb (action-oriented)
- "urgent": Due within 24 hours or blocking others
- "high": Due within a week or important
- "medium": Due within 2 weeks
- "low": No deadline or nice-to-have
- Break complex items into subtasks
- Identify dependencies as "waiting_for" category

Output valid JSON only, no markdown formatting.`;

    const response = await routeRequest({
        prompt: gtdPrompt,
        userId,
        context,
        promptType: 'gtd',
    });

    if (!response.success || !response.content) {
        return {
            success: false,
            error: response.error || 'Failed to extract tasks',
        };
    }

    try {
        const cleanJson = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const tasks = JSON.parse(cleanJson);

        return {
            success: true,
            tasks: Array.isArray(tasks) ? tasks : tasks.tasks,
        };
    } catch (parseError) {
        aiLogger.error('[AIRouter] GTD parse error:', parseError);
        return {
            success: false,
            error: 'Failed to parse tasks',
        };
    }
}

/**
 * Deep analysis endpoint (Tier 3 - Thinker)
 */
export async function analyzeDeep(
    userId: string,
    prompt: string,
    context?: AIContext
): Promise<AIResponse> {
    return routeRequest({
        prompt,
        userId,
        context,
        forceDeepMode: true,
        promptType: 'analysis',
    });
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

/**
 * Add credits to user's balance (for purchases, rewards, etc.)
 */
export async function addCredits(userId: string, amount: number): Promise<number> {
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            aiCreditsBalance: {
                increment: amount,
            },
        },
        select: { aiCreditsBalance: true },
    });
    return updatedUser.aiCreditsBalance;
}

/**
 * Get AI usage statistics for a user
 */
export async function getUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
): Promise<{
    totalRequests: number;
    totalCreditsUsed: number;
    byTier: Record<ModelTier, number>;
    byType: Record<string, number>;
    successRate: number;
}> {
    const whereClause: any = { userId };

    if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
    }

    const logs = await prisma.aIUsageLog.findMany({
        where: whereClause,
    });

    const byTier: Record<ModelTier, number> = { cleaner: 0, worker: 0, thinker: 0 };
    const byType: Record<string, number> = {};
    let totalCredits = 0;
    let successCount = 0;

    for (const log of logs) {
        byTier[log.tier as ModelTier] = (byTier[log.tier as ModelTier] || 0) + 1;
        byType[log.promptType] = (byType[log.promptType] || 0) + 1;
        totalCredits += log.creditsUsed;
        if (log.success) successCount++;
    }

    return {
        totalRequests: logs.length,
        totalCreditsUsed: totalCredits,
        byTier,
        byType,
        successRate: logs.length > 0 ? successCount / logs.length : 0,
    };
}
