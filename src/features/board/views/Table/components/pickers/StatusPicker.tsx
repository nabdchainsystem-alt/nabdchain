import React, { useState, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Trash } from 'phosphor-react';
import { STATUS_STYLES, StatusOption } from '../../types';
import { usePopupPosition } from '../../hooks/usePopupPosition';
import { useLanguage } from '../../../../../../contexts/LanguageContext';

// Default statuses with colors matching KanbanBoard
const DEFAULT_STATUSES: StatusOption[] = [
  { id: 'To Do', title: 'To Do', color: 'gray' },
  { id: 'In Progress', title: 'In Progress', color: 'blue' },
  { id: 'Q&A', title: 'Q&A', color: 'purple' },
  { id: 'Done', title: 'Done', color: 'emerald' },
  { id: 'Stuck', title: 'Stuck', color: 'orange' },
  { id: 'Rejected', title: 'Rejected', color: 'rose' },
];

// Status label translation keys - maps ID/title to translation key
const STATUS_TRANSLATION_KEYS: Record<string, string> = {
  // English IDs
  'To Do': 'to_do',
  'In Progress': 'in_progress',
  'Q&A': 'qa',
  Done: 'done',
  Stuck: 'stuck',
  Rejected: 'rejected',
  // Arabic translations (for reverse lookup when stored in Arabic)
  للقيام: 'to_do',
  'قيد التنفيذ': 'in_progress',
  مراجعة: 'qa',
  منجز: 'done',
  متوقف: 'stuck',
  مرفوض: 'rejected',
};

// Helper to get style from color name - using slightly darker colors (10% darker)
const getColorStyle = (color: string): string => {
  const colorMap: Record<string, string> = {
    gray: 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
    blue: 'bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    emerald: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    green: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    orange: 'bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    amber: 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    rose: 'bg-rose-200 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    red: 'bg-rose-200 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    purple: 'bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    violet: 'bg-violet-200 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    indigo: 'bg-indigo-200 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    cyan: 'bg-cyan-200 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    teal: 'bg-teal-200 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    pink: 'bg-pink-200 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
    yellow: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  };
  return colorMap[color.toLowerCase()] || 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300';
};

interface StatusPickerProps {
  onSelect: (status: string) => void;
  onClose: () => void;
  current: string;
  triggerRect?: DOMRect;
  options?: StatusOption[];
  onAdd?: (status: string) => void;
  onDelete?: (status: string) => void;
}

export const StatusPicker: React.FC<StatusPickerProps> = memo(
  ({ onSelect, onClose, current, triggerRect, options, onAdd, onDelete }) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [customStatus, setCustomStatus] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const positionStyle = usePopupPosition({ triggerRect, menuHeight: 250 });

    // Get translated status label
    const getStatusLabel = (title: string): string => {
      const key = STATUS_TRANSLATION_KEYS[title];
      return key ? t(key) : title;
    };

    // Use provided options or fall back to defaults
    const displayStatuses = options && options.length > 0 ? options : DEFAULT_STATUSES;

    const handleAddStatus = (e: React.FormEvent) => {
      e.preventDefault();
      if (customStatus.trim()) {
        if (onAdd) {
          onAdd(customStatus.trim());
        }
        onSelect(customStatus.trim());
        setCustomStatus('');
        onClose();
      }
    };

    const content = (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-[9998]" onClick={onClose} />
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="fixed w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl z-[9999] overflow-hidden flex flex-col menu-enter"
          style={positionStyle}
        >
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
            <span
              className={`text-[11px] font-bold font-sans uppercase tracking-wider text-stone-400 block ${isRtl ? 'text-right' : ''}`}
            >
              {t('status')}
            </span>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto flex flex-col gap-1 custom-scrollbar">
            {displayStatuses.map((s) => {
              const statusTitle = typeof s === 'string' ? s : s.title;
              const statusId = typeof s === 'string' ? s : s.id;
              const statusColor = typeof s === 'string' ? null : s.color;
              // Look up style by ID first (which is always in English), then by title, then use color-based fallback
              const statusStyle =
                STATUS_STYLES[statusId] ||
                STATUS_STYLES[statusTitle] ||
                (statusColor ? getColorStyle(statusColor) : 'bg-gray-100 text-gray-800');
              // Compare with both ID and title for backwards compatibility
              const _isActive = current === statusId || current === statusTitle;

              return (
                <div key={statusId} className="group relative flex items-center">
                  <button
                    onClick={() => {
                      onSelect(statusId);
                      onClose();
                    }}
                    className={`flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded transition-transform active:scale-95 ${statusStyle}`}
                  >
                    {getStatusLabel(statusTitle)}
                  </button>
                  {!DEFAULT_STATUSES.some((ds) => ds.id === statusId) && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDelete) onDelete(statusId);
                      }}
                      className={`absolute top-0 bottom-0 px-2 flex items-center justify-center text-stone-400 hover:text-red-500 bg-white/50 hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity ${isRtl ? 'left-0 rounded-s' : 'right-0 rounded-e'}`}
                      title={t('delete_status')}
                    >
                      <Trash size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <form
            onSubmit={handleAddStatus}
            className="p-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50"
          >
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder={t('add_new_status')}
              className={`w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-800 transition-all placeholder:text-stone-400 ${isRtl ? 'text-right' : ''}`}
            />
          </form>
        </div>
      </>
    );

    return createPortal(content, document.body);
  },
);

export { DEFAULT_STATUSES };
