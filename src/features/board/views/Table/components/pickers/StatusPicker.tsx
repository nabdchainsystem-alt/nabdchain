import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash } from 'phosphor-react';
import { STATUS_STYLES, StatusOption } from '../../types';
import { usePopupPosition } from '../../hooks/usePopupPosition';
import { useAppContext } from '../../../../../../contexts/AppContext';

// Default statuses with colors matching KanbanBoard
const DEFAULT_STATUSES: StatusOption[] = [
    { id: 'To Do', title: 'To Do', color: 'gray' },
    { id: 'In Progress', title: 'In Progress', color: 'blue' },
    { id: 'Q&A', title: 'Q&A', color: 'purple' },
    { id: 'Done', title: 'Done', color: 'emerald' },
    { id: 'Stuck', title: 'Stuck', color: 'orange' },
    { id: 'Rejected', title: 'Rejected', color: 'rose' }
];

// Status label translation keys
const STATUS_TRANSLATION_KEYS: Record<string, string> = {
    'To Do': 'to_do',
    'In Progress': 'in_progress',
    'Q&A': 'qa',
    'Done': 'done',
    'Stuck': 'stuck',
    'Rejected': 'rejected',
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

export const StatusPicker: React.FC<StatusPickerProps> = ({
    onSelect,
    onClose,
    current,
    triggerRect,
    options,
    onAdd,
    onDelete
}) => {
    const { t, dir } = useAppContext();
    const isRTL = dir === 'rtl';
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
                className="fixed w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl z-[9999] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-[11px] font-bold font-sans uppercase tracking-wider text-stone-400">
                        {t('task_status')}
                    </span>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto flex flex-col gap-1 custom-scrollbar">
                    {displayStatuses.map((s) => {
                        const statusTitle = typeof s === 'string' ? s : s.title;
                        const statusId = typeof s === 'string' ? s : s.id;
                        const statusStyle = STATUS_STYLES[statusTitle] || 'bg-gray-100 text-gray-800';
                        const isActive = current === statusTitle;

                        return (
                            <div key={statusId} className="group relative flex items-center">
                                <button
                                    onClick={() => { onSelect(statusTitle); onClose(); }}
                                    className={`flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded shadow-sm transition-transform active:scale-95 ${statusStyle}`}
                                >
                                    {getStatusLabel(statusTitle)}
                                </button>
                                {!DEFAULT_STATUSES.some(ds => ds.id === statusId) && onDelete && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onDelete) onDelete(statusTitle);
                                        }}
                                        className={`absolute top-0 bottom-0 px-2 flex items-center justify-center text-stone-400 hover:text-red-500 bg-white/50 hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'left-0 rounded-s' : 'right-0 rounded-e'}`}
                                        title={t('delete_status')}
                                    >
                                        <Trash size={12} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                <form onSubmit={handleAddStatus} className="p-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
                    <input
                        type="text"
                        value={customStatus}
                        onChange={(e) => setCustomStatus(e.target.value)}
                        placeholder={t('add_new_status')}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-800 transition-all placeholder:text-stone-400"
                    />
                </form>
            </div>
        </>
    );

    return createPortal(content, document.body);
};

export { DEFAULT_STATUSES };
