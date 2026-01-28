import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Status, StatusOption } from '../types';

interface StatusCellProps {
  status: Status;
  options: StatusOption[];
  onClick: (newStatus: Status) => void;
}

export const StatusCell: React.FC<StatusCellProps> = ({ status, options, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const getStatusColor = (currentStatus: Status) => {
    // Try to find by ID first, then Label
    const option = options.find(o => o.id === currentStatus || o.label === currentStatus);
    return option ? option.color : 'bg-[#aeaeae]'; // Default gray (10% darker)
  };

  // Check if current status is "set" (not empty string/null)
  const isSet = !!status;
  const currentColor = getStatusColor(status);

  // If color is hex code (from shared storage), we need to set backgroundColor style, not class
  const isHexColor = currentColor.startsWith('#');

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  return (
    <>
      <div
        ref={cellRef}
        onClick={handleOpen}
        className={`w-full h-full flex items-center justify-center px-4 text-white text-sm font-medium cursor-pointer transition-colors relative group ${!isHexColor ? currentColor : ''}`}
        style={isHexColor ? { backgroundColor: currentColor } : undefined}
      >
        {isSet ? (options.find(o => o.id === status || o.label === status)?.label || status) : <span className="opacity-0 group-hover:opacity-100">+</span>}

        <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-r-[8px] border-t-white/20 border-r-transparent"></div>
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-start" onClick={() => setIsOpen(false)}>
          <div
            className="fixed z-50 bg-white shadow-xl rounded-lg p-2 flex flex-col gap-2 w-48 border border-gray-200 menu-enter"
            style={{
              top: coords.top + 4,
              left: coords.left + (coords.width / 2) - 96
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onClick(option.label); // We use LABEL as the saved status string for now to match other apps, or ID? 
                  // Wait, other apps use ID or Label? 
                  // Lists.tsx uses Status Title/Label for display/storage usually?
                  // Actually Lists.tsx stores "To Do", which is the ID matches Title.
                  // Safe to use option.id here if IDs are semantic "To Do".
                  // Let's use option.id
                  onClick(option.id);
                  setIsOpen(false);
                }}
                className={`w-full py-2 px-4 text-white font-medium rounded transition-colors text-center shadow-sm hover:opacity-90`}
                style={{ backgroundColor: option.color.startsWith('#') ? option.color : undefined }} // Handle hex
              >
                <span className={!option.color.startsWith('#') ? option.color : ''}>{option.label}</span>
              </button>
            ))}
            <div className="h-px bg-gray-200 my-1"></div>
            <button className="flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 py-2 rounded text-sm">
              <span>Edit Labels</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};