import React, { useState, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Clock, Plus, Trash } from 'phosphor-react';
import { boardLogger } from '@/utils/logger';

// =============================================================================
// TIME TRACKING PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export interface TimeEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description?: string;
  userId: string;
  billable: boolean;
}

export interface TimeTrackingValue {
  totalTime: number; // Total seconds tracked
  entries: TimeEntry[];
  isRunning: boolean;
  runningStartTime?: Date;
}

interface TimeTrackingPickerProps {
  value: TimeTrackingValue | null;
  onSelect: (value: TimeTrackingValue | null) => void;
  onClose: () => void;
  triggerRect?: DOMRect;
  onStartTimer?: () => void;
  onStopTimer?: () => void;
  onAddManualEntry?: (entry: Partial<TimeEntry>) => void;
}

// Format seconds to HH:MM:SS
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format seconds to human readable (e.g., "2h 30m")
export const formatDurationHuman = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const TimeTrackingPicker: React.FC<TimeTrackingPickerProps> = memo(
  ({ value, onSelect, onClose, triggerRect, onStartTimer, onStopTimer, onAddManualEntry }) => {
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualHours, setManualHours] = useState('0');
    const [manualMinutes, setManualMinutes] = useState('0');
    const [manualDescription, setManualDescription] = useState('');

    const MENU_WIDTH = 280;
    const MENU_HEIGHT = 350;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
      if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - triggerRect.bottom;
      const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

      let left: number | undefined;
      let right: number | undefined;

      if (wouldOverflowRight) {
        right = PADDING;
      } else {
        left = Math.max(PADDING, triggerRect.left);
      }

      const openUp = spaceBelow < MENU_HEIGHT + PADDING && triggerRect.top > spaceBelow;

      const baseStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 9999,
        width: MENU_WIDTH,
      };

      if (openUp) {
        return {
          ...baseStyle,
          bottom: windowHeight - triggerRect.top + 4,
          ...(left !== undefined ? { left } : { right }),
        };
      }
      return { ...baseStyle, top: triggerRect.bottom + 4, ...(left !== undefined ? { left } : { right }) };
    }, [triggerRect]);

    const isRunning = value?.isRunning || false;
    const totalTime = value?.totalTime || 0;

    const handleStartTimer = () => {
      // Delegates to parent handler for timer state management
      boardLogger.debug('[TimeTracking] Start timer');
      onStartTimer?.();
    };

    const handleStopTimer = () => {
      // Delegates to parent handler for timer state management
      boardLogger.debug('[TimeTracking] Stop timer');
      onStopTimer?.();
    };

    const handleAddManualEntry = () => {
      const hours = parseInt(manualHours) || 0;
      const minutes = parseInt(manualMinutes) || 0;
      const duration = hours * 3600 + minutes * 60;

      if (duration > 0) {
        // Delegates to parent handler for manual time entry
        boardLogger.debug('[TimeTracking] Add manual entry', { duration, description: manualDescription });
        onAddManualEntry?.({ duration, description: manualDescription });
        setShowManualEntry(false);
        setManualHours('0');
        setManualMinutes('0');
        setManualDescription('');
      }
    };

    const content = (
      <>
        <div className="fixed inset-0 z-[9998]" onClick={onClose} />
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
          style={positionStyle}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Clock size={14} />
                Time Tracking
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                BETA
              </span>
            </div>
          </div>

          {/* Total Time Display */}
          <div className="p-4 text-center border-b border-stone-100 dark:border-stone-800">
            <div className="text-3xl font-mono font-bold text-stone-700 dark:text-stone-200">
              {formatDuration(totalTime)}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">Total time tracked</div>
          </div>

          {/* Timer Controls */}
          <div className="p-3 flex items-center justify-center gap-2 border-b border-stone-100 dark:border-stone-800">
            {isRunning ? (
              <button
                onClick={handleStopTimer}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Pause size={18} weight="fill" />
                <span className="font-medium">Stop</span>
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Play size={18} weight="fill" />
                <span className="font-medium">Start Timer</span>
              </button>
            )}
          </div>

          {/* Manual Entry Section */}
          {!showManualEntry ? (
            <div className="p-3 border-b border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setShowManualEntry(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Add time manually
              </button>
            </div>
          ) : (
            <div className="p-3 border-b border-stone-100 dark:border-stone-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-stone-500 uppercase">Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-stone-500 uppercase">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="flex-1 py-1.5 text-xs text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddManualEntry}
                  className="flex-1 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  Add Entry
                </button>
              </div>
            </div>
          )}

          {/* Recent Entries */}
          <div className="flex-1 overflow-y-auto max-h-[150px]">
            <div className="px-3 py-2 text-[10px] font-medium text-stone-500 uppercase">Recent Entries</div>
            {!value?.entries || value.entries.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-stone-400">No time entries yet</div>
            ) : (
              <div className="px-2 pb-2 space-y-1">
                {value.entries.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-stone-50 dark:bg-stone-800/50 rounded"
                  >
                    <span className="text-xs text-stone-600 dark:text-stone-400">
                      {formatDurationHuman(entry.duration)}
                    </span>
                    <span className="text-[10px] text-stone-400 truncate max-w-[120px]">
                      {entry.description || 'No description'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clear Button */}
          <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              className="w-full py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <Trash size={12} />
              Clear all time
            </button>
          </div>
        </div>
      </>
    );

    return createPortal(content, document.body);
  },
);

export default TimeTrackingPicker;
