import React, { useState, useRef } from 'react';
import { PortalPopup } from '../../../../components/ui/PortalPopup';

interface DropdownOption {
  id: string;
  label: string;
  color: string;
}

interface DropdownPickerProps {
  options: DropdownOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
  currentId?: string;
  darkMode?: boolean;
}

// Internal Picker Component
const DropdownPicker: React.FC<DropdownPickerProps> = ({ options, onSelect, onClose, _currentId, _darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const _containerRef = useRef<HTMLDivElement>(null);

  // Filter options
  const filteredOptions = options?.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  // Handle click outside is managed by PortalPopup usually, but just in case
  // We rely on PortalPopup's overlay or trigger handling.

  return (
    <div
      className={`flex flex-col w-64 bg-white dark:bg-stone-900 rounded-lg shadow-xl border border-gray-200 dark:border-stone-700 p-2 gap-2 menu-enter`}
    >
      {/* Search */}
      <div className="relative">
        <input
          autoFocus
          type="text"
          placeholder="Search or add options..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-2 pr-2 py-1.5 text-xs border border-gray-300 dark:border-stone-600 rounded bg-transparent text-gray-800 dark:text-stone-200 focus:outline-none focus:border-blue-500 placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto px-0.5 custom-scrollbar">
        {/* Clear Option */}
        <button
          onClick={() => {
            onSelect('');
            onClose();
          }}
          className="w-full h-7 border border-dashed border-gray-300 dark:border-stone-600 rounded flex items-center justify-center hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors shrink-0"
        >
          <span className="text-gray-400 text-xs">-</span>
        </button>

        {/* Options */}
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onSelect(opt.id);
                onClose();
              }}
              className={`w-full py-1.5 px-3 rounded text-xs font-medium text-white transition-opacity hover:opacity-90 text-left truncate shrink-0`}
              style={{ backgroundColor: opt.color || '#9ca3af' }}
              title={opt.label}
            >
              {opt.label}
            </button>
          ))
        ) : (
          <div className="py-2 text-center text-xs text-gray-400">No options found</div>
        )}
      </div>
    </div>
  );
};

export const DropdownCell: React.FC<{
  value?: string;
  onChange: (val: string) => void;
  options?: DropdownOption[];
  darkMode?: boolean;
}> = ({ value, onChange, options, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Find selected option to display
  // We assume 'value' is the ID based on previous <option value={o.id}>
  const selectedOption = options?.find((o) => o.id === value);

  const handleSelect = (newVal: string) => {
    onChange(newVal);
    setIsOpen(false);
  };

  return (
    <div className="w-full h-full p-1 relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full rounded flex items-center justify-start px-2 hover:opacity-80 transition-all ${
          selectedOption ? 'text-white font-medium' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-stone-800/50'
        }`}
        style={{
          backgroundColor: selectedOption ? selectedOption.color || '#9ca3af' : 'transparent',
        }}
      >
        <span className="truncate text-xs">{selectedOption ? selectedOption.label : 'Select Option'}</span>
      </button>

      {isOpen && (
        <PortalPopup triggerRef={triggerRef} onClose={() => setIsOpen(false)} side="bottom" align="center">
          <DropdownPicker
            options={options || []}
            onSelect={handleSelect}
            onClose={() => setIsOpen(false)}
            currentId={value}
            darkMode={darkMode}
          />
        </PortalPopup>
      )}
    </div>
  );
};
