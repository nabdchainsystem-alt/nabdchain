import React, { useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { PRIORITY_LEVELS, PriorityLevel, normalizePriority } from '../../../../../priorities/priorityUtils';
import { PRIORITY_STYLES } from '../../types';
import { usePopupPosition } from '../../hooks/usePopupPosition';
import { useLanguage } from '../../../../../../contexts/LanguageContext';

// Priority label translation keys
const PRIORITY_TRANSLATION_KEYS: Record<string, string> = {
  Urgent: 'urgent',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
};

interface PriorityPickerProps {
  onSelect: (priority: PriorityLevel | null) => void;
  onClose: () => void;
  current: string | null;
  triggerRect?: DOMRect;
}

export const PriorityPicker: React.FC<PriorityPickerProps> = memo(({ onSelect, onClose, current, triggerRect }) => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const normalizedCurrent = normalizePriority(current);
  const menuRef = useRef<HTMLDivElement>(null);
  const positionStyle = usePopupPosition({ triggerRect, menuHeight: 250 });

  // Get translated priority label
  const getPriorityLabel = (label: string): string => {
    const key = PRIORITY_TRANSLATION_KEYS[label];
    return key ? t(key) : label;
  };

  const handleSelect = (priority: PriorityLevel | null) => {
    onSelect(priority);
    onClose();
  };

  const content = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[9999] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col menu-enter min-w-[200px]"
        style={positionStyle}
      >
        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
          <span
            className={`text-[11px] font-bold font-sans uppercase tracking-wider text-stone-400 block ${isRtl ? 'text-right' : ''}`}
          >
            {t('priority')}
          </span>
        </div>
        <div className="p-2 flex flex-col gap-1">
          {PRIORITY_LEVELS.map((label) => {
            const styleClass = PRIORITY_STYLES[label] || 'bg-gray-100 text-gray-800';
            const _isActive = normalizedCurrent === label;
            return (
              <button
                key={label}
                onClick={() => handleSelect(label)}
                className={`w-full flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded transition-transform active:scale-95 ${styleClass}`}
              >
                {getPriorityLabel(label)}
              </button>
            );
          })}
          <div className="h-px bg-stone-100 dark:bg-stone-800 my-1 mx-2" />
          <button
            onClick={() => handleSelect(null)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
          >
            <span>{t('no_priority')}</span>
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
});
