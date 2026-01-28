import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePopupPosition } from '../../hooks/usePopupPosition';
import { PencilSimple, Trash, X, Check } from 'phosphor-react';

interface SelectOption {
    id: string;
    label: string;
    color: string;
}

const OPTION_COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500', 'bg-stone-500'
];

interface SelectPickerProps {
    onSelect: (value: string) => void;
    onClose: () => void;
    current: string;
    options: SelectOption[];
    triggerRect?: DOMRect;
    onAdd?: (label: string) => void;
    onEdit?: (optionId: string, newLabel: string, newColor: string) => void;
    onDelete?: (optionId: string) => void;
}

export const SelectPicker: React.FC<SelectPickerProps> = ({
    onSelect,
    onClose,
    current,
    options,
    triggerRect,
    onAdd,
    onEdit,
    onDelete
}) => {
    const [search, setSearch] = useState('');
    const [editingOption, setEditingOption] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editColor, setEditColor] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const positionStyle = usePopupPosition({ triggerRect, menuHeight: 380, menuWidth: 260 });

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleStartEdit = (opt: SelectOption, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingOption(opt.id);
        setEditLabel(opt.label);
        setEditColor(opt.color);
        setShowColorPicker(false);
        setTimeout(() => editInputRef.current?.focus(), 50);
    };

    const handleSaveEdit = () => {
        if (editingOption && editLabel.trim() && onEdit) {
            onEdit(editingOption, editLabel.trim(), editColor);
        }
        setEditingOption(null);
        setShowColorPicker(false);
    };

    const handleCancelEdit = () => {
        setEditingOption(null);
        setShowColorPicker(false);
    };

    const handleDelete = (optionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(optionId);
        }
    };

    const content = (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed w-[260px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl z-[9999] overflow-hidden flex flex-col menu-enter"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search or add options..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg outline-none focus:border-blue-500 transition-all placeholder:text-stone-400"
                    />
                </div>

                <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto p-2">
                    {/* Clear / None Option */}
                    <button
                        onClick={() => { onSelect(''); onClose(); }}
                        className="w-full h-8 border border-dashed border-stone-300 dark:border-stone-600 rounded-lg flex items-center justify-center hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    >
                        <span className="text-stone-400 text-xs">Clear selection</span>
                    </button>

                    {/* Filtered Options */}
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <div key={opt.id} className="relative group">
                                {editingOption === opt.id ? (
                                    // Edit Mode
                                    <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-blue-300 dark:border-blue-600">
                                        <div className="flex items-center gap-2 mb-2">
                                            <button
                                                onClick={() => setShowColorPicker(!showColorPicker)}
                                                className={`w-6 h-6 rounded-full ${editColor} shrink-0 hover:scale-110 transition-transform ring-2 ring-offset-1 ring-stone-300`}
                                            />
                                            <input
                                                ref={editInputRef}
                                                type="text"
                                                value={editLabel}
                                                onChange={(e) => setEditLabel(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveEdit();
                                                    if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                                className="flex-1 px-2 py-1 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        {showColorPicker && (
                                            <div className="grid grid-cols-6 gap-1 mb-2 p-1 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-700">
                                                {OPTION_COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => { setEditColor(c); setShowColorPicker(false); }}
                                                        className={`w-5 h-5 rounded-full ${c} hover:scale-110 transition-transform ${editColor === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"
                                            >
                                                <X size={14} />
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="p-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <button
                                        onClick={() => { onSelect(opt.label); onClose(); }}
                                        className={`w-full py-2 px-3 rounded-lg text-xs font-medium text-white transition-all active:scale-95 ${opt.color || 'bg-stone-500'} flex items-center justify-between`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {(onEdit || onDelete) && (
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {onEdit && (
                                                    <button
                                                        onClick={(e) => handleStartEdit(opt, e)}
                                                        className="p-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                                                    >
                                                        <PencilSimple size={12} />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={(e) => handleDelete(opt.id, e)}
                                                        className="p-1 bg-white/20 hover:bg-red-500/80 rounded transition-colors"
                                                    >
                                                        <Trash size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="py-3 text-center text-xs text-stone-400">
                            No options found
                        </div>
                    )}

                    {/* Add new option */}
                    {search.trim() && !options.some(o => o.label.toLowerCase() === search.trim().toLowerCase()) && onAdd && (
                        <button
                            onClick={() => { onAdd(search.trim()); setSearch(''); }}
                            className="w-full py-2 px-3 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-1 border border-dashed border-stone-300 dark:border-stone-700 mt-1"
                        >
                            <span>+ Create "{search.trim()}"</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};

export type { SelectOption };
