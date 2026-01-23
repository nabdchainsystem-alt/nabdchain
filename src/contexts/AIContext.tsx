import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from '../auth-adapter';
import { aiLogger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export type ModelTier = 'cleaner' | 'worker' | 'thinker';

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

export interface AIContext {
    department?: string;
    userRole?: string;
    boardData?: BoardContextData;
    roomData?: RoomContextData;
    projectContext?: string;
}

export interface AIContextType {
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
    currentBoardContext: BoardContextData | null;
    currentRoomContext: RoomContextData | null;

    // API methods
    processPrompt: (prompt: string, promptType?: string) => Promise<AIResponse>;
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
    const [credits, setCredits] = useState(100); // Default credits
    const [creditsLoading, setCreditsLoading] = useState(false);
    const [deepModeEnabled, setDeepModeEnabled] = useState(false);
    const [userDepartment, setUserDepartment] = useState<string | null>(() => {
        return localStorage.getItem('user_ai_department');
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTier, setCurrentTier] = useState<ModelTier | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentBoardContext, setCurrentBoardContext] = useState<BoardContextData | null>(null);
    const [currentRoomContext, setCurrentRoomContext] = useState<RoomContextData | null>(null);

    // Persist department to localStorage
    useEffect(() => {
        if (userDepartment) {
            localStorage.setItem('user_ai_department', userDepartment);
        } else {
            localStorage.removeItem('user_ai_department');
        }
    }, [userDepartment]);

    // Fetch auth headers
    const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
        const token = await getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }, [getToken]);

    // Build context object for API calls
    const buildContext = useCallback((): AIContext => {
        const context: AIContext = {};

        if (userDepartment) {
            context.department = userDepartment;
        }

        if (currentBoardContext) {
            context.boardData = currentBoardContext;
        }

        if (currentRoomContext) {
            context.roomData = currentRoomContext;
        }

        return context;
    }, [userDepartment, currentBoardContext, currentRoomContext]);

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
        promptType: string = 'general'
    ): Promise<AIResponse> => {
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
    }, [deepModeEnabled, getAuthHeaders, buildContext, refreshCredits]);

    // Generate chart configuration
    const generateChart = useCallback(async (
        prompt: string,
        data: Record<string, unknown>[]
    ): Promise<ChartResponse> => {
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
    }, [deepModeEnabled, getAuthHeaders, refreshCredits]);

    // Generate table
    const generateTable = useCallback(async (
        prompt: string,
        data: Record<string, unknown>[]
    ): Promise<TableResponse> => {
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
    }, [deepModeEnabled, getAuthHeaders, refreshCredits]);

    // Generate forecast
    const generateForecast = useCallback(async (
        prompt: string,
        data: Record<string, unknown>[],
        periods: number = 6
    ): Promise<ForecastResponse> => {
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
    }, [getAuthHeaders, refreshCredits]);

    // Generate tips
    const generateTips = useCallback(async (
        focusArea?: string
    ): Promise<TipsResponse> => {
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
    }, [getAuthHeaders, buildContext, refreshCredits]);

    // Extract GTD tasks
    const extractGTDTasks = useCallback(async (
        input: string
    ): Promise<GTDTaskResponse> => {
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
    }, [getAuthHeaders, buildContext, refreshCredits]);

    // Upload file for schema mapping
    const uploadFile = useCallback(async (
        fileData: FileUploadData
    ): Promise<FileMappingResponse> => {
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
    }, [getAuthHeaders, refreshCredits]);

    // Deep analysis (forces Tier 3)
    const analyzeDeep = useCallback(async (
        prompt: string,
        context?: Record<string, unknown>
    ): Promise<AIResponse> => {
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
    }, [getAuthHeaders, buildContext, refreshCredits]);

    // Preview which tier would be used (no credits charged)
    const previewTier = useCallback(async (prompt: string): Promise<TierPreview> => {
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
    }, [deepModeEnabled, getAuthHeaders, buildContext]);

    // Analyze complexity without processing
    const analyzeComplexity = useCallback(async (prompt: string): Promise<ComplexityAnalysis> => {
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
    }, [getAuthHeaders, buildContext]);

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
                byTier: { cleaner: 0, worker: 0, thinker: 0 },
                byType: {},
                successRate: 0,
            };
        }
    }, [getAuthHeaders]);

    const value = useMemo<AIContextType>(() => ({
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
        currentBoardContext,
        currentRoomContext,
        setCurrentBoardContext,
        setCurrentRoomContext,
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
        currentBoardContext,
        currentRoomContext,
        setCurrentBoardContext,
        setCurrentRoomContext,
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
