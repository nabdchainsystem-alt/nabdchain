import React, { useState, useRef, useEffect } from 'react';

interface CornellLayoutProps {
  cuesContent: React.ReactNode;
  notesContent: React.ReactNode;
  summaryContent: React.ReactNode;
  actionsContent?: React.ReactNode;
  className?: string;
}

export const CornellLayout: React.FC<CornellLayoutProps> = ({
  cuesContent,
  notesContent,
  summaryContent,
  actionsContent,
  className = '',
}) => {
  // Resizable Columns State
  const [leftWidth, setLeftWidth] = useState(30); // Percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Min/Max constraints (e.g., 15% to 60%)
    if (newLeftWidth > 15 && newLeftWidth < 60) {
      setLeftWidth(newLeftWidth);
    }
  }, []);

  const handleMouseUp = React.useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = (_e: React.MouseEvent) => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`flex flex-col h-full w-full bg-white dark:bg-monday-dark-bg border border-gray-200 dark:border-monday-dark-border rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      {/* Top Section: Cues (Left) + Notes (Right) */}
      <div ref={containerRef} className="flex flex-1 min-h-0 relative">
        {/* 1. Cue Column (Left) */}
        <div
          style={{ width: `${leftWidth}%` }}
          className="h-full flex flex-col bg-[#FDFDFE] dark:bg-monday-dark-surface p-4 border-r border-gray-200 dark:border-monday-dark-border transition-[width] duration-0 ease-linear will-change-[width]"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 select-none">
            Cues / Questions
          </h3>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {cuesContent}
          </div>
        </div>

        {/* Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 hover:w-1.5 h-full cursor-col-resize bg-transparent hover:bg-blue-400 absolute z-10 transition-all hover:opacity-100 opacity-0"
          style={{ left: `${leftWidth}%`, transform: 'translateX(-50%)' }}
        />

        {/* 2. Note-Taking Area (Right) */}
        <div className="flex-1 h-full flex flex-col bg-white dark:bg-monday-dark-bg p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 select-none">Notes</h3>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {notesContent}
          </div>
        </div>
      </div>

      {/* Bottom Split: Summary & Actions */}
      <div className="flex-none border-t-2 border-gray-200 dark:border-monday-dark-border">
        {/* 3. Summary Section */}
        <div className="h-[120px] bg-[#FAFAFA] dark:bg-monday-dark-surface p-4 flex flex-col border-b border-gray-200 dark:border-monday-dark-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 select-none">Summary</h3>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {summaryContent}
          </div>
        </div>

        {/* 4. Action Items Section */}
        {actionsContent && (
          <div className="bg-white dark:bg-monday-dark-bg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 select-none">Action Items</h3>
            </div>
            <div className="flex-1">{actionsContent}</div>
          </div>
        )}
      </div>
    </div>
  );
};
