import { useState, useCallback } from 'react';
import type { Template, TemplateCategory } from '../types';

// =============================================================================
// USE TEMPLATES HOOK - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface UseTemplatesOptions {
  category?: TemplateCategory;
  workspaceId?: string;
}

interface UseTemplatesReturn {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<Template[]>;
  getByCategory: (category: TemplateCategory) => Promise<Template[]>;
  createFromTemplate: (templateId: string, boardName: string) => Promise<string>;
  saveAsTemplate: (boardId: string, data: { name: string; description: string; category: TemplateCategory; tags: string[] }) => Promise<Template>;
  refresh: () => Promise<void>;
}

export const useTemplates = (options: UseTemplatesOptions = {}): UseTemplatesReturn => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string): Promise<Template[]> => {
    // TODO: Implement API call
    console.log('[useTemplates] Search - NOT IMPLEMENTED', query);
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [templates]);

  const getByCategory = useCallback(async (category: TemplateCategory): Promise<Template[]> => {
    // TODO: Implement API call
    console.log('[useTemplates] Get by category - NOT IMPLEMENTED', category);
    return templates.filter((t) => t.category === category);
  }, [templates]);

  const createFromTemplate = useCallback(async (templateId: string, boardName: string): Promise<string> => {
    // TODO: Implement API call to create board from template
    console.log('[useTemplates] Create from template - NOT IMPLEMENTED', { templateId, boardName });
    return `board-${Date.now()}`;
  }, []);

  const saveAsTemplate = useCallback(
    async (
      boardId: string,
      data: { name: string; description: string; category: TemplateCategory; tags: string[] }
    ): Promise<Template> => {
      // TODO: Implement API call to save board as template
      console.log('[useTemplates] Save as template - NOT IMPLEMENTED', { boardId, ...data });

      const newTemplate: Template = {
        id: `template-${Date.now()}`,
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        isPublic: false,
        workspaceId: options.workspaceId,
        content: {
          board: { name: data.name, defaultView: 'table', availableViews: ['table', 'kanban'] },
          columns: [],
          rooms: [],
        },
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setTemplates((prev) => [...prev, newTemplate]);
      return newTemplate;
    },
    [options.workspaceId]
  );

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement API call
      console.log('[useTemplates] Refresh - NOT IMPLEMENTED', options);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    templates,
    isLoading,
    error,
    search,
    getByCategory,
    createFromTemplate,
    saveAsTemplate,
    refresh,
  };
};

export default useTemplates;
