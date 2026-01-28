import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { useAuth } from '../auth-adapter';
import { aiLogger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export type ModelTier = 'cleaner' | 'assistant' | 'worker' | 'analyst' | 'thinker';

export interface AICreditsState {
    balance: number;
    loading: boolean;
    error: string | null;
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

export interface PageContextData {
    view: string;
    department?: string;
    boardId?: string;
    boardName?: string;
}

export interface AIContext {
    department?: string;
    userRole?: string;
    boardData?: BoardContextData;
    roomData?: RoomContextData;
    projectContext?: string;
}

export interface AIContextType {
    // AI enabled/disabled toggle
    aiEnabled: boolean;
    toggleAI: () => void;

    // Credits
    credits: number;
    creditsLoading: boolean;
    refreshCredits: () => Promise<void>;

    // Mode toggle
    deepModeEnabled: boolean;
    toggleDeepMode: () => void;

    // User context
    userDepartment: string | null;
    setUserDepartment: (department: string | null) => void;

    // Processing state
    isProcessing: boolean;
    currentTier: ModelTier | null;

    // Error state
    error: string | null;
    clearError: () => void;

    // Context management
    setCurrentBoardContext: (board: BoardContextData | null) => void;
    setCurrentRoomContext: (room: RoomContextData | null) => void;
    setCurrentPageContext: (page: PageContextData | null) => void;
    currentBoardContext: BoardContextData | null;
    currentRoomContext: RoomContextData | null;
    currentPageContext: PageContextData | null;

    // API methods (language: 'en' | 'ar' for response language)
    processPrompt: (prompt: string, promptType?: string, language?: string) => Promise<AIResponse>;
    generateChart: (prompt: string, data: Record<string, unknown>[]) => Promise<ChartResponse>;
    generateTable: (prompt: string, data: Record<string, unknown>[]) => Promise<TableResponse>;
    generateForecast: (prompt: string, data: Record<string, unknown>[], periods?: number) => Promise<ForecastResponse>;
    generateTips: (focusArea?: string) => Promise<TipsResponse>;
    extractGTDTasks: (input: string) => Promise<GTDTaskResponse>;
    uploadFile: (fileData: FileUploadData) => Promise<FileMappingResponse>;
    analyzeDeep: (prompt: string, context?: Record<string, unknown>) => Promise<AIResponse>;
    previewTier: (prompt: string) => Promise<TierPreview>;
    analyzeComplexity: (prompt: string) => Promise<ComplexityAnalysis>;
    getUsageStats: (startDate?: Date, endDate?: Date) => Promise<UsageStats>;
}

export interface AIResponse {
    success: boolean;
    content?: string;
    tier: ModelTier;
    creditsUsed: number;
    error?: string;
    metadata?: {
        model: string;
        confidence?: number;
        escalated?: boolean;
        processingTime?: number;
    };
    complexityScore?: number;
    complexityFactors?: string[];
}

export interface ChartResponse {
    success: boolean;
    chartConfig?: Record<string, unknown>;
    chartType?: string;
    insights?: string[];
    error?: string;
}

export interface TableResponse {
    success: boolean;
    tableData?: {
        columns: { key: string; label: string; type: string }[];
        rows: Record<string, unknown>[];
        summary?: string;
    };
    error?: string;
}

export interface ForecastResponse {
    success: boolean;
    forecast?: {
        predictions: { period: string; value: number; confidence: number }[];
        trend: 'up' | 'down' | 'stable';
        insights: string[];
        methodology: string;
    };
    error?: string;
}

export interface TipsResponse {
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

export interface GTDTaskResponse {
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

export interface FileMappingResponse {
    success: boolean;
    mapping?: {
        originalSchema: Record<string, string>;
        mappedSchema: Record<string, string>;
        dataTypes: Record<string, string>;
    };
    summary?: string;
    error?: string;
}

export interface FileUploadData {
    fileName: string;
    headers: string[];
    sampleRows: Record<string, unknown>[];
    fileType: 'csv' | 'xlsx' | 'json';
}

export interface TierPreview {
    tier: ModelTier;
    creditCost: number;
    model: string;
    complexity?: {
        score: number;
        confidence: number;
        factors: string[];
    };
}

export interface ComplexityAnalysis {
    score: number;
    tier: ModelTier;
    confidence: number;
    factors: string[];
}

export interface UsageStats {
    totalRequests: number;
    totalCreditsUsed: number;
    byTier: Record<ModelTier, number>;
    byType: Record<string, number>;
    successRate: number;
}

// ============================================================================
// Context
// ============================================================================

const AIContextReact = createContext<AIContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// Provider
// ============================================================================

interface AIProviderProps {
    children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
    const { getToken } = useAuth();

    // State
    const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem('ai_enabled');
        return saved !== null ? saved === 'true' : false; // Default to disabled
    });
    const [credits, setCredits] = useState(0); // Start at 0, fetched from API
    const [creditsLoading, setCreditsLoading] = useState(true); // Start as loading
    const [deepModeEnabled, setDeepModeEnabled] = useState(false);
    const [userDepartment, setUserDepartment] = useState<string | null>(() => {
        return localStorage.getItem('user_ai_department');
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTier, setCurrentTier] = useState<ModelTier | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Use refs for board/room/page context to prevent re-renders when context updates
    // These are only needed for API calls, not for rendering
    const currentBoardContextRef = useRef<BoardContextData | null>(null);
    const currentRoomContextRef = useRef<RoomContextData | null>(null);
    const currentPageContextRef = useRef<PageContextData | null>(null);

    // Persist department to localStorage
    useEffect(() => {
        if (userDepartment) {
            localStorage.setItem('user_ai_department', userDepartment);
        } else {
            localStorage.removeItem('user_ai_department');
        }
    }, [userDepartment]);

    // Persist AI enabled state to localStorage
    useEffect(() => {
        localStorage.setItem('ai_enabled', String(aiEnabled));
    }, [aiEnabled]);

    // Toggle AI on/off
    const toggleAI = useCallback(() => {
        setAiEnabled(prev => !prev);
    }, []);

    // Fetch auth headers
    const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
        const token = await getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }, [getToken]);

    // Stable setter functions that don't cause re-renders
    const setCurrentBoardContext = useCallback((data: BoardContextData | null) => {
        currentBoardContextRef.current = data;
    }, []);

    const setCurrentRoomContext = useCallback((data: RoomContextData | null) => {
        currentRoomContextRef.current = data;
    }, []);

    const setCurrentPageContext = useCallback((data: PageContextData | null) => {
        currentPageContextRef.current = data;
    }, []);

    // Build context object for API calls (reads from refs)
    const buildContext = useCallback((): AIContext => {
        const context: AIContext = {};

        if (userDepartment) {
            context.department = userDepartment;
        }

        // Use page context department if available
        if (currentPageContextRef.current?.department) {
            context.department = currentPageContextRef.current.department;
        }

        if (currentBoardContextRef.current) {
            context.boardData = currentBoardContextRef.current;
        }

        if (currentRoomContextRef.current) {
            context.roomData = currentRoomContextRef.current;
        }

        // Add current page context info
        if (currentPageContextRef.current) {
            context.projectContext = `Current page: ${currentPageContextRef.current.view}${
                currentPageContextRef.current.boardName ? ` - Board: ${currentPageContextRef.current.boardName}` : ''
            }`;
        }

        return context;
    }, [userDepartment]);

    // Refresh credits from server
    const refreshCredits = useCallback(async () => {
        try {
            setCreditsLoading(true);
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/api/ai/credits`, { headers });

            if (response.ok) {
                const data = await response.json();
                setCredits(data.credits);
            } else {
                aiLogger.error('[AIContext] Failed to fetch credits');
            }
        } catch (err) {
            aiLogger.error('[AIContext] Credits fetch error:', err);
        } finally {
            setCreditsLoading(false);
        }
    }, [getAuthHeaders]);

    // Load credits on mount (with delay to ensure auth is ready)
    useEffect(() => {
        const timer = setTimeout(() => {
            refreshCredits().catch(() => {
                // Silently fail - credits will show 0 until server is available
                setCreditsLoading(false);
            });
        }, 500);
        return () => clearTimeout(timer);
    }, []); // Empty deps - only run once on mount

    // Toggle deep mode
    const toggleDeepMode = useCallback(() => {
        setDeepModeEnabled(prev => !prev);
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Process a prompt through the AI router
    const processPrompt = useCallback(async (
        prompt: string,
        promptType: string = 'general',
        language: string = 'en'
    ): Promise<AIResponse> => {
        // Check if AI is enabled
        if (!aiEnabled) {
            return { success: false, tier: 'worker', creditsUsed: 0, error: 'AI is disabled. Enable it to use AI features.' };
        }

        try {
            setIsProcessing(true);
            setError(null);

            const headers = await getAuthHeaders();
            const context = buildContext();

            const response = await fetch(`${API_URL}/api/ai/process`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt,
                    forceDeepMode: deepModeEnabled,
                    promptType,
                    language, // Pass language preference for response
                    context: Object.keys(context).length > 0 ? context : undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCurrentTier(data.tier);
                await refreshCredits();
            } else {
                setError(data.error || 'AI processing failed');
            }

            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            setError(errorMsg);
            return { success: false, tier: 'worker', creditsUsed: 0, error: errorMsg };
        } finally {
            setIsProcessing(false);
        }
    }, [aiEnabled, deepModeEnabled, getAuthHeaders, buildContext, refreshCredits]);

    // Generate chart configuration
    const generateChart = useCallback(async (
        prompt: string,
        data: Record<string, unknown>[]
    ): Promise<ChartResponse> => {
        // Check if AI is enabled
        if (!aiEnabled) {
            return { success: false, error: 'AI is disabled. Enable it to use AI features.' };
        }

        try {
            setIsProcessing(true);
            setError(null);

            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/api/ai/chart`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt,
                    data,
                    deepMode: deepModeEnabled,
                }),
            });

            const result = await response.json();

            if (result.success) {
                await refreshCredits();
            } else {
                setError(result.error || 'Chart generation failed');
            }

            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsProcessing(false);
        }
    }, [aiEnabled, deepModeEnabled, getAuthHeaders, refreshCredits]);

    // Generate table
    const generateTable = useCallback(async (
        prompt: string,
        data: Record<string, unknown>[]
    ): Promise<TableResponse> => {
        if (!aiEnabled) {
            return { success: false, error: 'AI is disabled. Enable it to use AI features.' };
        }

        try {
            setIsProcessing(true);
            setError(null);

            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/api/ai/table`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt,
                    data,
                    deepMode: deepModeEnabled,
                }),
            });

            const result = await response.json();

            if (result.success) {
                await refreshCredits();
            } else {
                setError(result.error || 'Table generation failed');
            }

            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsProcessing(false);
        }
    }, [aiEnabled, deepModeEnabled, getAuthHeaders, refreshCredits]);

    // Generate forecast
    const generateForecast = useCallback(async (
        prompt: string,
        data: Record<string, unknown>[],
        periods: number = 6
    ): Promise<ForecastResponse> => {
        if (!aiEnabled) {
            return { success: false, error: 'AI is disabled. Enable it to use AI features.' };
        }

        try {
            setIsProcessing(true);
            setError(null);
            setCurrentTier('thinker'); // Forecast always uses Tier 3

            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/api/ai/forecast`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt,
                    data,
                    periods,
                }),
            });

            const result = await response.json();

            if (result.success) {
                await refreshCredits();
            } else {
                setError(result.error || 'Forecast generation failed');
            }

            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsProcessing(false);
        }
    }, [aiEnabled, getAuthHeaders, refreshCredits]);

    // Generate tips
    const generateTips = useCallback(async (
        focusArea?: string
    ): Promise<TipsResponse> => {
        if (!aiEnabled) {
            return { success: false, error: 'AI is disabled. Enable it to use AI features.' };
        }

        try {
            setIsProcessing(true);
            setError(null);

            const headers = await getAuthHeaders();
            const context = buildContext();

            const response = await fetch(`${API_URL}/api/ai/tips`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    context,
                    focusArea,
                }),
            });

            const result = await response.json();

            if (result.success) {
                await refreshCredits();
            } else {
                setError(result.error || 'Tips generation failed');
            }

            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsProcessing(false);
        }
    }, [aiEnabled, getAuthHeaders, buildContext, refreshCredits]);

    // Extract GTD tasks
    const extractGTDTasks = useCallback(async (
        input: string
    ): Promise<GTDTaskResponse> => {
        if (!aiEnabled) {
            return { success: false, error: 'AI is disabled. Enable it to use AI features.' };
        }

        try {
            setIsProcessing(true);
            setError(null);

            const headers = await getAuthHeaders();
            const context = buildContext();

            const response = await fetch(`${API_URL}/api/ai/gtd`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    input,
                    context,
                }),
            });

            const result = await response.json();

            if (result.success) {
                await refreshCredits();
            } else {
                setError(result.error || 'GTD task extraction failed');
            }

            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsProcessing(false);
        }
    }, [aiEnabled, getAuthHeaders, buildContext, refreshCredits]);

    // Upload file for schema mapping
    const uploadFile = useCallback(async (
        fileData: FileUploadData
    ): Promise<FileMappingResponse> => {
        if (!aiEnabled) {
            return { success: false, error: 'AI is disabled. Enable it to use AI features.' };
        }

        try {
            setIsProcessing(true);
            setError(null);
            setCurrentTier('cleaner');

            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/api/ai/upload`, {
                method: 'POST',
                headers,
                body: JSON.stringify(fileData),
            });

            const result = await response.json();

            if (result.success) {
                await refreshCredits();
            } else {
                setError(result.error || 'File upload processing failed');
            }

            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsProcessing(false);
        }
    }, [aiEnabled, getAuthHeaders, refreshCredits]);

    // Deep analysis (forces Tier 3)
    const analyzeDeep = useCallback(async (
        prompt: string,
        context?: Record<string, unknown>
    ): Promise<AIResponse> => {
        if (!aiEnabled) {
            return { success: false, tier: 'thinker', creditsUsed: 0, error: 'AI is disabled. Enable it to use AI features.' };
        }

        try {
            setIsProcessing(true);
            setError(null);
            setCurrentTier('thinker');

            const headers = await getAuthHeaders();
            const baseContext = buildContext();

            const response = await fetch(`${API_URL}/api/ai/analyze`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt,
                    context: { ...baseContext, ...context },
                }),
            });

            const data = await response.json();

            if (data.success) {
                await refreshCredits();
            } else {
                setError(data.error || 'Deep analysis failed');
            }

            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Network error';
            setError(errorMsg);
            return { success: false, tier: 'thinker', creditsUsed: 0, error: errorMsg };
        } finally {
            setIsProcessing(false);
        }
    }, [aiEnabled, getAuthHeaders, buildContext, refreshCredits]);

    // Preview which tier would be used (no credits charged)
    const previewTier = useCallback(async (prompt: string): Promise<TierPreview> => {
        if (!aiEnabled) {
            return { tier: 'worker', creditCost: 0, model: 'AI Disabled' };
        }

        try {
            const headers = await getAuthHeaders();
            const context = buildContext();

            const response = await fetch(`${API_URL}/api/ai/tier-preview`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt,
                    context,
                    forceDeepMode: deepModeEnabled,
                }),
            });

            return await response.json();
        } catch (err) {
            return { tier: 'worker', creditCost: 1, model: 'Gemini 3 Flash' };
        }
    }, [aiEnabled, deepModeEnabled, getAuthHeaders, buildContext]);

    // Analyze complexity without processing
    const analyzeComplexity = useCallback(async (prompt: string): Promise<ComplexityAnalysis> => {
        if (!aiEnabled) {
            return { score: 0, tier: 'worker', confidence: 0, factors: ['AI is disabled'] };
        }

        try {
            const headers = await getAuthHeaders();
            const context = buildContext();

            const response = await fetch(`${API_URL}/api/ai/complexity`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ prompt, context }),
            });

            return await response.json();
        } catch (err) {
            return { score: 0, tier: 'worker', confidence: 0.5, factors: [] };
        }
    }, [aiEnabled, getAuthHeaders, buildContext]);

    // Get usage statistics
    const getUsageStats = useCallback(async (
        startDate?: Date,
        endDate?: Date
    ): Promise<UsageStats> => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();

            if (startDate) params.append('startDate', startDate.toISOString());
            if (endDate) params.append('endDate', endDate.toISOString());

            const url = `${API_URL}/api/ai/usage${params.toString() ? `?${params}` : ''}`;
            const response = await fetch(url, { headers });

            return await response.json();
        } catch (err) {
            return {
                totalRequests: 0,
                totalCreditsUsed: 0,
                byTier: { cleaner: 0, assistant: 0, worker: 0, analyst: 0, thinker: 0 },
                byType: {},
                successRate: 0,
            };
        }
    }, [getAuthHeaders]);

    const value = useMemo<AIContextType>(() => ({
        aiEnabled,
        toggleAI,
        credits,
        creditsLoading,
        refreshCredits,
        deepModeEnabled,
        toggleDeepMode,
        userDepartment,
        setUserDepartment,
        isProcessing,
        currentTier,
        error,
        clearError,
        // Expose refs' current values (reads are live, writes don't cause re-renders)
        currentBoardContext: currentBoardContextRef.current,
        currentRoomContext: currentRoomContextRef.current,
        currentPageContext: currentPageContextRef.current,
        setCurrentBoardContext,
        setCurrentRoomContext,
        setCurrentPageContext,
        processPrompt,
        generateChart,
        generateTable,
        generateForecast,
        generateTips,
        extractGTDTasks,
        uploadFile,
        analyzeDeep,
        previewTier,
        analyzeComplexity,
        getUsageStats,
    }), [
        aiEnabled,
        toggleAI,
        credits,
        creditsLoading,
        refreshCredits,
        deepModeEnabled,
        toggleDeepMode,
        userDepartment,
        setUserDepartment,
        isProcessing,
        currentTier,
        error,
        clearError,
        // Note: refs not in deps - updates don't trigger re-renders
        setCurrentBoardContext,
        setCurrentRoomContext,
        setCurrentPageContext,
        processPrompt,
        generateChart,
        generateTable,
        generateForecast,
        generateTips,
        extractGTDTasks,
        uploadFile,
        analyzeDeep,
        previewTier,
        analyzeComplexity,
        getUsageStats,
    ]);

    return (
        <AIContextReact.Provider value={value}>
            {children}
        </AIContextReact.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useAI(): AIContextType {
    const context = useContext(AIContextReact);
    if (context === undefined) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}

export default AIContextReact;
