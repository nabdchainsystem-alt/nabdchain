import React from 'react';
import { Clock, Play, Pause } from 'phosphor-react';

// =============================================================================
// TIMER WIDGET - PLACEHOLDER (Floating timer for header/sidebar)
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface TimerWidgetProps {
  isRunning?: boolean;
  elapsedSeconds?: number;
  taskName?: string;
  onToggle?: () => void;
  onClick?: () => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({
  isRunning = false,
  elapsedSeconds = 0,
  taskName,
  onToggle,
  onClick,
}) => {
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRunning && elapsedSeconds === 0) {
    return null;
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
    >
      <Clock size={16} className={isRunning ? 'text-green-500 animate-pulse' : 'text-stone-500'} />
      <span className="text-sm font-mono font-medium text-stone-700 dark:text-stone-300">
        {formatTime(elapsedSeconds)}
      </span>
      {taskName && (
        <span className="text-xs text-stone-500 truncate max-w-[100px]">
          {taskName}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
        className={`p-1 rounded ${isRunning ? 'hover:bg-red-100 text-red-500' : 'hover:bg-green-100 text-green-500'}`}
      >
        {isRunning ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
      </button>
    </div>
  );
};

export default TimerWidget;
