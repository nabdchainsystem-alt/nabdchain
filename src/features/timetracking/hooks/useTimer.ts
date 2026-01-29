import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// USE TIMER HOOK - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface UseTimerOptions {
  onTick?: (elapsed: number) => void;
  onStart?: () => void;
  onStop?: (elapsed: number) => void;
  onPause?: (elapsed: number) => void;
  autoSaveInterval?: number; // Auto-save every N seconds
}

interface UseTimerReturn {
  isRunning: boolean;
  elapsedSeconds: number;
  start: (taskId?: string, description?: string) => void;
  pause: () => void;
  stop: () => number;
  reset: () => void;
  currentTaskId?: string;
  description?: string;
}

export const useTimer = (options: UseTimerOptions = {}): UseTimerReturn => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>();
  const [description, setDescription] = useState<string | undefined>();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

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

  const start = useCallback((taskId?: string, desc?: string) => {
    setIsRunning(true);
    setCurrentTaskId(taskId);
    setDescription(desc);
    startTimeRef.current = Date.now();
    options.onStart?.();

    // TODO: Persist timer state to localStorage or server
    console.log('[useTimer] Start - NOT FULLY IMPLEMENTED');
  }, [options.onStart]);

  const pause = useCallback(() => {
    setIsRunning(false);
    options.onPause?.(elapsedSeconds);

    // TODO: Persist paused state
    console.log('[useTimer] Pause - NOT FULLY IMPLEMENTED');
  }, [elapsedSeconds, options.onPause]);

  const stop = useCallback(() => {
    setIsRunning(false);
    const finalElapsed = elapsedSeconds;
    options.onStop?.(finalElapsed);

    // Reset
    setElapsedSeconds(0);
    setCurrentTaskId(undefined);
    setDescription(undefined);
    startTimeRef.current = null;

    // TODO: Create time entry on server
    console.log('[useTimer] Stop - NOT FULLY IMPLEMENTED', { finalElapsed });

    return finalElapsed;
  }, [elapsedSeconds, options.onStop]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setCurrentTaskId(undefined);
    setDescription(undefined);
    startTimeRef.current = null;
  }, []);

  return {
    isRunning,
    elapsedSeconds,
    start,
    pause,
    stop,
    reset,
    currentTaskId,
    description,
  };
};

export default useTimer;
