import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus as PlusIcon, Trash as Trash2, Check, CaretDown as ChevronDown } from 'phosphor-react';

export interface DropdownOption {
    id: string;
    label: string;
    color: string;
}

interface DropdownConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (label: string, options: DropdownOption[]) => void;
}

// A predefined palette of "Monday-like" colors plus standard ones (10% darker)
const PRESET_COLORS = [
    '#00b369', '#cb3d52', '#4e8be3', '#e5b700', '#8d47c6',
    '#e59c9c', '#e5c094', '#e5e5a3', '#b5e5ab', '#8bdde5',
    '#8fb0e5', '#aaa0e5', '#e5b2e5', '#e5e5e2', '#2d2d2d',
    '#724830', '#e54d1f', '#6d4d41', '#566f7a', '#008577'
];

export const DropdownConfigModal: React.FC<DropdownConfigModalProps> = ({ isOpen, onClose, onSave }) => {
    if (!isOpen) return null;

    const [columnLabel, setColumnLabel] = useState('Status');
    const [options, setOptions] = useState<DropdownOption[]>([
        { id: '1', label: 'Done', color: '#00b369' },
        { id: '2', label: 'Working on it', color: '#e59935' },
        { id: '3', label: 'Stuck', color: '#dd6b20' }
    ]);
    const [activeColorPicker, setActiveColorPicker] = useState<{ id: string; rect: DOMRect } | null>(null);

    const handleAddOption = () => {
        const newOption: DropdownOption = {
            id: Date.now().toString(),
            label: 'New Option',
            color: '#aeaeae'
        };
        setOptions([...options, newOption]);
    };

    const handleRemoveOption = (id: string) => {
        setOptions(options.filter(o => o.id !== id));
    };

    const updateOption = (id: string, updates: Partial<DropdownOption>) => {
        setOptions(options.map(o => o.id === id ? { ...o, ...updates } : o));
    };

    const handleSave = () => {
        if (!columnLabel.trim()) return;
        onSave(columnLabel, options);
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                        <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">Create Dropdown Column</h3>
                        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Column Name */}
                        <div>
                            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                value={columnLabel}
                                onChange={(e) => setColumnLabel(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                                className="w-full px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-stone-800 dark:text-stone-200"
                                placeholder="e.g. Status"
                            />
                        </div>

                        {/* Options */}
                        <div>
                            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                                Options
                            </label>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {options.map((opt) => (
                                    <div key={opt.id} className="flex items-center gap-3 group">
                                        {/* Color Trigger */}
                                        <button
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setActiveColorPicker(activeColorPicker?.id === opt.id ? null : { id: opt.id, rect });
                                            }}
                                            className="w-9 h-9 rounded-md shrink-0 transition-transform active:scale-95 shadow-sm hover:shadow border border-gray-200 dark:border-gray-700"
                                            style={{ backgroundColor: opt.color }}
                                            title="Change color"
                                        />

                                        {/* Input */}
                                        <input
                                            type="text"
                                            value={opt.label}
                                            onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        />

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleRemoveOption(opt.id)}
                                            className="text-stone-300 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 opacity-0 group-hover:opacity-100"
                                            title="Remove option"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAddOption}
                                className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1.5 rounded transition-colors"
                            >
                                <PlusIcon size={16} /> Add Option
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700/50 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors flex items-center gap-2"
                        >
                            <Check size={16} /> Create Column
                        </button>
                    </div>
                </div>
            </div>

            {/* Color Picker Portal */}
            {activeColorPicker && createPortal(
                <div
                    className="fixed z-[10060] bg-white dark:bg-stone-800 p-3 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 w-64 animate-in fade-in zoom-in-95"
                    style={{
                        top: activeColorPicker.rect.bottom + 8,
                        left: activeColorPicker.rect.left,
                    }}
                >
                    <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setActiveColorPicker(null)}
                    />
                    <div className="text-xs font-semibold text-stone-500 mb-2">Presets</div>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => { updateOption(activeColorPicker.id, { color }); setActiveColorPicker(null); }}
                                className="w-8 h-8 rounded-full border border-stone-100 dark:border-stone-600 hover:scale-110 transition-transform shadow-sm"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <div className="border-t border-stone-100 dark:border-stone-700 pt-2">
                        <label className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-stone-50 dark:hover:bg-stone-700/50 cursor-pointer">
                            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Custom Color...</span>
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-stone-200 dark:border-stone-600">
                                <input
                                    type="color"
                                    value={options.find(o => o.id === activeColorPicker.id)?.color || '#000000'}
                                    onChange={(e) => updateOption(activeColorPicker.id, { color: e.target.value })}
                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer"
                                />
                            </div>
                        </label>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
