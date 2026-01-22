import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';

// ============================================================================
// Types
// ============================================================================

export type ModelTier = 'cleaner' | 'worker' | 'thinker';

export interface AICreditsState {
    balance: number;
    loading: boolean;
    error: string | null;
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

    // API methods
    processPrompt: (prompt: string, promptType?: string) => Promise<AIResponse>;
    generateChart: (prompt: string, data: Record<string, unknown>[]) => Promise<ChartResponse>;
    uploadFile: (fileData: FileUploadData) => Promise<FileMappingResponse>;
    analyzeDeep: (prompt: string, context?: Record<string, unknown>) => Promise<AIResponse>;
    previewTier: (prompt: string) => Promise<TierPreview>;
}

export interface AIResponse {
    success: boolean;
    content?: string;
    tier: ModelTier;
    creditsUsed: number;
    error?: string;
}

export interface ChartResponse {
    success: boolean;
    chartConfig?: Record<string, unknown>;
    chartType?: string;
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
}

// ============================================================================
// Context
// ============================================================================

const AIContext = createContext<AIContextType | undefined>(undefined);

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
    const [credits, setCredits] = useState(0);
    const [creditsLoading, setCreditsLoading] = useState(true);
    const [deepModeEnabled, setDeepModeEnabled] = useState(false);
    const [userDepartment, setUserDepartment] = useState<string | null>(() => {
        // Try to restore from localStorage
        return localStorage.getItem('user_ai_department');
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTier, setCurrentTier] = useState<ModelTier | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                console.error('[AIContext] Failed to fetch credits');
            }
        } catch (err) {
            console.error('[AIContext] Credits fetch error:', err);
        } finally {
            setCreditsLoading(false);
        }
    }, [getAuthHeaders]);

    // Load credits on mount
    useEffect(() => {
        refreshCredits();
    }, [refreshCredits]);

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
            const response = await fetch(`${API_URL}/api/ai/process`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt,
                    forceDeepMode: deepModeEnabled,
                    promptType,
                    context: userDepartment ? { department: userDepartment } : undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCurrentTier(data.tier);
                await refreshCredits(); // Update credits after successful request
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
    }, [deepModeEnabled, getAuthHeaders, refreshCredits]);

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
            const response = await fetch(`${API_URL}/api/ai/analyze`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ prompt, context }),
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
    }, [getAuthHeaders, refreshCredits]);

    // Preview which tier would be used (no credits charged)
    const previewTier = useCallback(async (prompt: string): Promise<TierPreview> => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/api/ai/tier-preview`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ prompt, forceDeepMode: deepModeEnabled }),
            });

            return await response.json();
        } catch (err) {
            return { tier: 'worker', creditCost: 1, model: 'gemini-3.0-flash-preview' };
        }
    }, [deepModeEnabled, getAuthHeaders]);

    const value: AIContextType = {
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
        processPrompt,
        generateChart,
        uploadFile,
        analyzeDeep,
        previewTier,
    };

    return (
        <AIContext.Provider value={value}>
            {children}
        </AIContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useAI(): AIContextType {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}

export default AIContext;
