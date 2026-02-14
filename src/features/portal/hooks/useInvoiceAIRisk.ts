/**
 * useInvoiceAIRisk — Hook for fetching AI risk assessment for a specific invoice
 *
 * Returns { data, isLoading, error, fetchRisk } for on-demand AI analysis.
 */
import { useState, useCallback } from 'react';
import { portalAIService, AIInsightResponse } from '../services/aiService';

interface InvoiceAIRiskState {
  data: AIInsightResponse['data'] | null;
  isLoading: boolean;
  error: string | null;
}

export function useInvoiceAIRisk() {
  const [state, setState] = useState<InvoiceAIRiskState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchRisk = useCallback(async (invoiceId: string, language?: 'en' | 'ar') => {
    setState({ data: null, isLoading: true, error: null });

    try {
      const response = await portalAIService.getInvoiceRisk({ invoiceId, language });
      setState({ data: response.data, isLoading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to assess invoice risk',
      });
    }
  }, []);

  return {
    ...state,
    fetchRisk,
  };
}
