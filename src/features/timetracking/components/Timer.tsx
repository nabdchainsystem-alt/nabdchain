import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Stop } from 'phosphor-react';

// =============================================================================
// TIMER COMPONENT - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface TimerProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onPause?: (duration: number) => void;
  taskId?: string;
  boardId?: string;
}

export const Timer: React.FC<TimerProps> = ({
  onStart,
  onStop,
  onPause,
  taskId,
  boardId,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    onStart?.();
  };

  const handlePause = () => {
    setIsRunning(false);
    onPause?.(elapsedSeconds);
  };

  const handleStop = () => {
    setIsRunning(false);
    onStop?.(elapsedSeconds);
    setElapsedSeconds(0);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-2xl font-mono font-bold text-stone-700 dark:text-stone-200 min-w-[100px]">
        {formatTime(elapsedSeconds)}
      </div>
      <div className="flex items-center gap-1">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            title="Start timer"
          >
            <Play size={20} weight="fill" />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            title="Pause timer"
          >
            <Pause size={20} weight="fill" />
          </button>
        )}
        {(isRunning || elapsedSeconds > 0) && (
          <button
            onClick={handleStop}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            title="Stop and save"
          >
            <Stop size={20} weight="fill" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Timer;
