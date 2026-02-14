/**
 * useOrderAISummary — Hook for fetching AI summary for a specific order
 *
 * Returns { data, isLoading, error, fetchSummary } for on-demand AI analysis.
 */
import { useState, useCallback } from 'react';
import { portalAIService, AIInsightResponse } from '../services/aiService';

interface OrderAISummaryState {
  data: AIInsightResponse['data'] | null;
  isLoading: boolean;
  error: string | null;
}

export function useOrderAISummary() {
  const [state, setState] = useState<OrderAISummaryState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchSummary = useCallback(async (orderId: string, language?: 'en' | 'ar') => {
    setState({ data: null, isLoading: true, error: null });

    try {
      const response = await portalAIService.getOrderSummary({ orderId, language });
      setState({ data: response.data, isLoading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch AI summary',
      });
    }
  }, []);

  return {
    ...state,
    fetchSummary,
  };
}
