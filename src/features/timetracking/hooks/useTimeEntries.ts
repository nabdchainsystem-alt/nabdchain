import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import type { TimeEntry } from '../types';
import { hookLogger } from '@/utils/logger';

// =============================================================================
// USE TIME ENTRIES HOOK
// Status: IMPLEMENTED - Connected to backend API
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UseTimeEntriesOptions {
  userId?: string;
  boardId?: string;
  taskId?: string;
  dateRange?: { start: Date; end: Date };
  autoFetch?: boolean;
}

interface TimeEntrySummary {
  totalSeconds: number;
  totalHours: number;
  billableSeconds: number;
  billableHours: number;
  nonBillableHours: number;
  totalAmount: number;
  entriesCount: number;
}

interface UseTimeEntriesReturn {
  entries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
  totalSeconds: number;
  summary: TimeEntrySummary | null;
  addEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TimeEntry>;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<TimeEntry>;
  deleteEntry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  fetchSummary: () => Promise<void>;
}

export const useTimeEntries = (options: UseTimeEntriesOptions = {}): UseTimeEntriesReturn => {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<TimeEntrySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration, 0);

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

  // Build query string from options
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (options.boardId) params.set('boardId', options.boardId);
    if (options.taskId) params.set('taskId', options.taskId);
    if (options.dateRange?.start) params.set('startDate', options.dateRange.start.toISOString());
    if (options.dateRange?.end) params.set('endDate', options.dateRange.end.toISOString());
    return params.toString();
  }, [options.boardId, options.taskId, options.dateRange]);

  // Fetch entries
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const queryString = buildQueryString();
      const url = `${API_BASE}/api/time-entries${queryString ? `?${queryString}` : ''}`;
      const data = await fetchWithAuth(url);

      // Transform dates
      const transformed: TimeEntry[] = data.map((entry: TimeEntry & { startTime: string; endTime?: string; createdAt: string; updatedAt: string }) => ({
        ...entry,
        startTime: new Date(entry.startTime),
        endTime: entry.endTime ? new Date(entry.endTime) : undefined,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      }));

      setEntries(transformed);
      hookLogger.debug('[useTimeEntries] Fetched entries', { count: transformed.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load time entries';
      setError(message);
      hookLogger.error('[useTimeEntries] Fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, buildQueryString]);

  // Fetch summary
  const fetchSummary = useCallback(async (): Promise<void> => {
    try {
      const queryString = buildQueryString();
      const url = `${API_BASE}/api/time-entries/summary${queryString ? `?${queryString}` : ''}`;
      const data = await fetchWithAuth(url);
      setSummary(data);
      hookLogger.debug('[useTimeEntries] Fetched summary');
    } catch (err) {
      hookLogger.error('[useTimeEntries] Fetch summary error', err);
    }
  }, [fetchWithAuth, buildQueryString]);

  // Add entry
  const addEntry = useCallback(async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry> => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/api/time-entries`, {
        method: 'POST',
        body: JSON.stringify({
          ...entry,
          startTime: entry.startTime.toISOString(),
          endTime: entry.endTime?.toISOString(),
        }),
      });

      const newEntry: TimeEntry = {
        ...data,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };

      setEntries((prev) => [newEntry, ...prev]);
      hookLogger.info('[useTimeEntries] Created entry', { entryId: newEntry.id });
      return newEntry;
    } catch (err) {
      hookLogger.error('[useTimeEntries] Create error', err);
      throw err;
    }
  }, [fetchWithAuth]);

  // Update entry
  const updateEntry = useCallback(async (id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> => {
    // Store previous state for rollback
    const previousEntries = entries;

    // Optimistic update
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          return { ...entry, ...updates, updatedAt: new Date() };
        }
        return entry;
      })
    );

    try {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.startTime) payload.startTime = updates.startTime.toISOString();
      if (updates.endTime) payload.endTime = updates.endTime.toISOString();
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.userId;

      const data = await fetchWithAuth(`${API_BASE}/api/time-entries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const updatedEntry: TimeEntry = {
        ...data,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };

      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? updatedEntry : entry))
      );

      hookLogger.debug('[useTimeEntries] Updated entry', { entryId: id });
      return updatedEntry;
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      hookLogger.error('[useTimeEntries] Update error', err);
      throw err;
    }
  }, [fetchWithAuth, entries]);

  // Delete entry
  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    // Store previous state for rollback
    const previousEntries = entries;

    // Optimistic update
    setEntries((prev) => prev.filter((entry) => entry.id !== id));

    try {
      await fetchWithAuth(`${API_BASE}/api/time-entries/${id}`, {
        method: 'DELETE',
      });
      hookLogger.debug('[useTimeEntries] Deleted entry', { entryId: id });
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      hookLogger.error('[useTimeEntries] Delete error', err);
      throw err;
    }
  }, [fetchWithAuth, entries]);

  // Initial fetch
  useEffect(() => {
    if (options.autoFetch !== false) {
      refresh();
    }
  }, [refresh, options.autoFetch]);

  return {
    entries,
    isLoading,
    error,
    totalSeconds,
    summary,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh,
    fetchSummary,
  };
};

export default useTimeEntries;
