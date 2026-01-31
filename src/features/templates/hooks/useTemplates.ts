import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import type { Template, TemplateCategory } from '../types';
import { hookLogger } from '@/utils/logger';

// =============================================================================
// USE TEMPLATES HOOK
// Status: IMPLEMENTED - Connected to backend API
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UseTemplatesOptions {
  category?: TemplateCategory;
  workspaceId?: string;
  autoFetch?: boolean;
}

interface UseTemplatesReturn {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<Template[]>;
  getByCategory: (category: TemplateCategory) => Promise<Template[]>;
  createFromTemplate: (templateId: string, boardName: string) => Promise<string>;
  saveAsTemplate: (boardId: string, data: { name: string; description: string; category: TemplateCategory; tags: string[] }) => Promise<Template>;
  updateTemplate: (id: string, data: Partial<Template>) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTemplates = (options: UseTemplatesOptions = {}): UseTemplatesReturn => {
  const { getToken } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper for authenticated fetch
  const fetchWithAuth = useCallback(async (url: string, fetchOptions?: RequestInit) => {
    const token = await getToken();
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...fetchOptions?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, [getToken]);

  // Transform API response to local type
  const transformTemplate = useCallback((data: Template & { createdAt: string; updatedAt: string }): Template => ({
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  }), []);

  // Fetch templates
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.category) params.set('category', options.category);

      const url = `${API_BASE}/api/templates${params.toString() ? `?${params.toString()}` : ''}`;
      const data = await fetchWithAuth(url);

      const transformed = data.map(transformTemplate);
      setTemplates(transformed);
      hookLogger.debug('[useTemplates] Fetched templates', { count: transformed.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load templates';
      setError(message);
      hookLogger.error('[useTemplates] Fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, options.category, transformTemplate]);

  // Search templates
  const search = useCallback(async (query: string): Promise<Template[]> => {
    try {
      const params = new URLSearchParams();
      params.set('search', query);

      const url = `${API_BASE}/api/templates?${params.toString()}`;
      const data = await fetchWithAuth(url);

      const transformed = data.map(transformTemplate);
      hookLogger.debug('[useTemplates] Search results', { query, count: transformed.length });
      return transformed;
    } catch (err) {
      hookLogger.error('[useTemplates] Search error', err);
      throw err;
    }
  }, [fetchWithAuth, transformTemplate]);

  // Get templates by category
  const getByCategory = useCallback(async (category: TemplateCategory): Promise<Template[]> => {
    try {
      const url = `${API_BASE}/api/templates?category=${category}`;
      const data = await fetchWithAuth(url);

      const transformed = data.map(transformTemplate);
      hookLogger.debug('[useTemplates] Fetched by category', { category, count: transformed.length });
      return transformed;
    } catch (err) {
      hookLogger.error('[useTemplates] Get by category error', err);
      throw err;
    }
  }, [fetchWithAuth, transformTemplate]);

  // Create a board from a template
  const createFromTemplate = useCallback(async (templateId: string, boardName: string): Promise<string> => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/api/templates/${templateId}/use`, {
        method: 'POST',
        body: JSON.stringify({ boardName }),
      });

      hookLogger.info('[useTemplates] Created board from template', { templateId, boardId: data.boardId });
      return data.boardId;
    } catch (err) {
      hookLogger.error('[useTemplates] Create from template error', err);
      throw err;
    }
  }, [fetchWithAuth]);

  // Save a board as a template
  const saveAsTemplate = useCallback(
    async (
      boardId: string,
      data: { name: string; description: string; category: TemplateCategory; tags: string[] }
    ): Promise<Template> => {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/templates/from-board`, {
          method: 'POST',
          body: JSON.stringify({
            boardId,
            ...data,
          }),
        });

        const newTemplate = transformTemplate(response);
        setTemplates((prev) => [...prev, newTemplate]);

        hookLogger.info('[useTemplates] Created template from board', { templateId: newTemplate.id, boardId });
        return newTemplate;
      } catch (err) {
        hookLogger.error('[useTemplates] Save as template error', err);
        throw err;
      }
    },
    [fetchWithAuth, transformTemplate]
  );

  // Update a template
  const updateTemplate = useCallback(async (id: string, data: Partial<Template>): Promise<Template> => {
    // Store previous state for rollback
    const previousTemplates = templates;

    // Optimistic update
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, updatedAt: new Date() } : t))
    );

    try {
      const payload: Record<string, unknown> = { ...data };
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.usageCount;

      const response = await fetchWithAuth(`${API_BASE}/api/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const updated = transformTemplate(response);
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );

      hookLogger.debug('[useTemplates] Updated template', { templateId: id });
      return updated;
    } catch (err) {
      // Rollback on error
      setTemplates(previousTemplates);
      hookLogger.error('[useTemplates] Update error', err);
      throw err;
    }
  }, [fetchWithAuth, transformTemplate, templates]);

  // Delete a template
  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    // Store previous state for rollback
    const previousTemplates = templates;

    // Optimistic update
    setTemplates((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetchWithAuth(`${API_BASE}/api/templates/${id}`, {
        method: 'DELETE',
      });
      hookLogger.debug('[useTemplates] Deleted template', { templateId: id });
    } catch (err) {
      // Rollback on error
      setTemplates(previousTemplates);
      hookLogger.error('[useTemplates] Delete error', err);
      throw err;
    }
  }, [fetchWithAuth, templates]);

  // Initial fetch
  useEffect(() => {
    if (options.autoFetch !== false) {
      refresh();
    }
  }, [refresh, options.autoFetch]);

  return {
    templates,
    isLoading,
    error,
    search,
    getByCategory,
    createFromTemplate,
    saveAsTemplate,
    updateTemplate,
    deleteTemplate,
    refresh,
  };
};

export default useTemplates;
