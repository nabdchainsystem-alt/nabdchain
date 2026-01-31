import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { hookLogger } from '@/utils/logger';

// =============================================================================
// USE TIMER HOOK
// Status: IMPLEMENTED - Syncs with backend API
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TIMER_STATE_KEY = 'nabd-timer-state';

interface UseTimerOptions {
  onTick?: (elapsed: number) => void;
  onStart?: () => void;
  onStop?: (elapsed: number) => void;
  onPause?: (elapsed: number) => void;
  boardId?: string;
}

interface UseTimerReturn {
  isRunning: boolean;
  elapsedSeconds: number;
  start: (taskId?: string, description?: string) => Promise<void>;
  pause: () => void;
  stop: () => Promise<number>;
  reset: () => void;
  currentTaskId?: string;
  currentEntryId?: string;
  description?: string;
  syncWithServer: () => Promise<void>;
}

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  pausedElapsed: number;
  currentTaskId?: string;
  currentEntryId?: string;
  description?: string;
  boardId?: string;
}

// Persist timer state to localStorage
const saveTimerState = (state: TimerState) => {
  try {
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};

// Load timer state from localStorage
const loadTimerState = (): TimerState | null => {
  try {
    const saved = localStorage.getItem(TIMER_STATE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
};

// Clear timer state from localStorage
const clearTimerState = () => {
  try {
    localStorage.removeItem(TIMER_STATE_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const useTimer = (options: UseTimerOptions = {}): UseTimerReturn => {
  const { getToken } = useAuth();

  // Initialize state from localStorage if available
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>();
  const [currentEntryId, setCurrentEntryId] = useState<string | undefined>();
  const [description, setDescription] = useState<string | undefined>();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef<number>(0);

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

  // Restore timer state on mount
  useEffect(() => {
    const savedState = loadTimerState();
    if (savedState && savedState.isRunning && savedState.startTime) {
      // Calculate elapsed time since saved startTime
      const now = Date.now();
      const savedElapsed = savedState.pausedElapsed || 0;
      const newElapsed = savedElapsed + Math.floor((now - savedState.startTime) / 1000);

      setIsRunning(true);
      setElapsedSeconds(newElapsed);
      setCurrentTaskId(savedState.currentTaskId);
      setCurrentEntryId(savedState.currentEntryId);
      setDescription(savedState.description);
      startTimeRef.current = savedState.startTime;
      pausedElapsedRef.current = savedState.pausedElapsed;

      hookLogger.debug('[useTimer] Restored timer state', { elapsed: newElapsed });
    }
  }, []);

  // Tick effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const newValue = prev + 1;
          options.onTick?.(newValue);
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, options.onTick]);

  // Start timer
  const start = useCallback(async (taskId?: string, desc?: string) => {
    const now = Date.now();

    setIsRunning(true);
    setCurrentTaskId(taskId);
    setDescription(desc);
    startTimeRef.current = now;
    pausedElapsedRef.current = elapsedSeconds;

    options.onStart?.();

    // Create a time entry on the server
    if (options.boardId) {
      try {
        const data = await fetchWithAuth(`${API_BASE}/api/time-entries`, {
          method: 'POST',
          body: JSON.stringify({
            boardId: options.boardId,
            taskId,
            description: desc,
            startTime: new Date(now).toISOString(),
            source: 'timer',
          }),
        });

        setCurrentEntryId(data.id);
        hookLogger.info('[useTimer] Created time entry', { entryId: data.id });

        // Save state with entry ID
        saveTimerState({
          isRunning: true,
          startTime: now,
          pausedElapsed: elapsedSeconds,
          currentTaskId: taskId,
          currentEntryId: data.id,
          description: desc,
          boardId: options.boardId,
        });
      } catch (err) {
        hookLogger.error('[useTimer] Failed to create time entry', err);
        // Still save local state
        saveTimerState({
          isRunning: true,
          startTime: now,
          pausedElapsed: elapsedSeconds,
          currentTaskId: taskId,
          description: desc,
          boardId: options.boardId,
        });
      }
    } else {
      // Save local state without server sync
      saveTimerState({
        isRunning: true,
        startTime: now,
        pausedElapsed: elapsedSeconds,
        currentTaskId: taskId,
        description: desc,
      });
    }

    hookLogger.debug('[useTimer] Started', { taskId, description: desc });
  }, [elapsedSeconds, options.boardId, options.onStart, fetchWithAuth]);

  // Pause timer
  const pause = useCallback(() => {
    setIsRunning(false);
    pausedElapsedRef.current = elapsedSeconds;
    options.onPause?.(elapsedSeconds);

    // Update local storage with paused state
    saveTimerState({
      isRunning: false,
      startTime: null,
      pausedElapsed: elapsedSeconds,
      currentTaskId,
      currentEntryId,
      description,
      boardId: options.boardId,
    });

    hookLogger.debug('[useTimer] Paused', { elapsed: elapsedSeconds });
  }, [elapsedSeconds, currentTaskId, currentEntryId, description, options.boardId, options.onPause]);

  // Stop timer
  const stop = useCallback(async () => {
    setIsRunning(false);
    const finalElapsed = elapsedSeconds;
    options.onStop?.(finalElapsed);

    // Stop the time entry on the server
    if (currentEntryId) {
      try {
        await fetchWithAuth(`${API_BASE}/api/time-entries/${currentEntryId}/stop`, {
          method: 'PATCH',
        });
        hookLogger.info('[useTimer] Stopped time entry', { entryId: currentEntryId, duration: finalElapsed });
      } catch (err) {
        hookLogger.error('[useTimer] Failed to stop time entry', err);
      }
    }

    // Reset state
    setElapsedSeconds(0);
    setCurrentTaskId(undefined);
    setCurrentEntryId(undefined);
    setDescription(undefined);
    startTimeRef.current = null;
    pausedElapsedRef.current = 0;

    // Clear stored state
    clearTimerState();

    hookLogger.debug('[useTimer] Stopped', { finalElapsed });
    return finalElapsed;
  }, [elapsedSeconds, currentEntryId, fetchWithAuth, options.onStop]);

  // Reset timer without stopping server entry
  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setCurrentTaskId(undefined);
    setCurrentEntryId(undefined);
    setDescription(undefined);
    startTimeRef.current = null;
    pausedElapsedRef.current = 0;
    clearTimerState();

    hookLogger.debug('[useTimer] Reset');
  }, []);

  // Sync with server (check for active timer)
  const syncWithServer = useCallback(async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE}/api/time-entries/active/current`);

      if (data) {
        // There's an active timer on the server
        const startTime = new Date(data.startTime).getTime();
        const elapsed = data.elapsedSeconds || Math.floor((Date.now() - startTime) / 1000);

        setIsRunning(true);
        setElapsedSeconds(elapsed);
        setCurrentEntryId(data.id);
        setCurrentTaskId(data.taskId);
        setDescription(data.description);
        startTimeRef.current = startTime;
        pausedElapsedRef.current = 0;

        saveTimerState({
          isRunning: true,
          startTime,
          pausedElapsed: 0,
          currentTaskId: data.taskId,
          currentEntryId: data.id,
          description: data.description,
          boardId: data.boardId,
        });

        hookLogger.info('[useTimer] Synced with server', { entryId: data.id, elapsed });
      }
    } catch (err) {
      hookLogger.error('[useTimer] Sync failed', err);
    }
  }, [fetchWithAuth]);

  return {
    isRunning,
    elapsedSeconds,
    start,
    pause,
    stop,
    reset,
    currentTaskId,
    currentEntryId,
    description,
    syncWithServer,
  };
};

export default useTimer;
