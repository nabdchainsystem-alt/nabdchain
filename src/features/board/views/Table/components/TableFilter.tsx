import React, { useState, useRef } from 'react';
import { Filter as FilterIcon, X, Plus, ChevronDown, Check, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PortalPopup } from '../../../../../components/ui/PortalPopup';
import { Column } from '../RoomTable';

export interface FilterItem {
    id: string;
    columnId: string;
    operator: string;
    value: any;
}

interface TableFilterProps {
    columns: Column[];
    filters: FilterItem[];
    onChange: (filters: FilterItem[]) => void;
}

const OPERATORS = {
    text: [
        { label: 'Contains', value: 'contains' },
        { label: 'Is', value: 'is' },
        { label: 'Start with', value: 'startsWith' },
        { label: 'End with', value: 'endsWith' },
        { label: 'Is empty', value: 'isEmpty' },
        { label: 'Is not empty', value: 'isNotEmpty' },
    ],
    number: [
        { label: '=', value: 'eq' },
        { label: '>', value: 'gt' },
        { label: '<', value: 'lt' },
        { label: '>=', value: 'gte' },
        { label: '<=', value: 'lte' },
        { label: 'Is empty', value: 'isEmpty' },
        { label: 'Is not empty', value: 'isNotEmpty' },
    ],
    select: [
        { label: 'Is', value: 'is' },
        { label: 'Is not', value: 'isNot' },
        { label: 'Is empty', value: 'isEmpty' },
        { label: 'Is not empty', value: 'isNotEmpty' },
    ],
    date: [
        { label: 'Is', value: 'is' },
        { label: 'Before', value: 'before' },
        { label: 'After', value: 'after' },
        { label: 'Is empty', value: 'isEmpty' },
        { label: 'Is not empty', value: 'isNotEmpty' },
    ]
};

const getOperators = (type: string) => {
    if (type === 'number') return OPERATORS.number;
    if (type === 'date') return OPERATORS.date;
    if (['status', 'priority', 'select'].includes(type)) return OPERATORS.select;
    return OPERATORS.text;
};

export const TableFilter: React.FC<TableFilterProps> = ({ columns, filters, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const filterableColumns = columns.filter(c => c.id !== 'select' && c.id !== 'actions');

    const handleAddFilter = () => {
        const firstCol = filterableColumns[0];
        if (!firstCol) return;

        const newFilter: FilterItem = {
            id: Date.now().toString(),
            columnId: firstCol.id,
            operator: getOperators(firstCol.type)[0].value,
            value: ''
        };
        onChange([...filters, newFilter]);
    };

    const handleUpdateFilter = (id: string, updates: Partial<FilterItem>) => {
        onChange(filters.map(f => {
            if (f.id === id) {
                const updated = { ...f, ...updates };
                // If column changed, reset operator and value
                if (updates.columnId) {
                    const col = columns.find(c => c.id === updates.columnId);
                    if (col) {
                        updated.operator = getOperators(col.type)[0].value;
                        updated.value = '';
                    }
                }
                return updated;
            }
            return f;
        }));
    };

    const handleRemoveFilter = (id: string) => {
        onChange(filters.filter(f => f.id !== id));
    };

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full transition-all border
                    ${filters.length > 0 || isOpen
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
                        : 'text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}
                `}
            >
                <FilterIcon size={12} className={filters.length > 0 ? 'fill-current' : ''} />
                <span>Filter</span>
                {filters.length > 0 && (
                    <span className="flex items-center justify-center bg-indigo-600 text-white text-[9px] w-4 h-4 rounded-full ml-1">
                        {filters.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <PortalPopup
                    triggerRef={triggerRef}
                    onClose={() => setIsOpen(false)}
                    side="bottom"
                    align="end"
                >
                    <div className="w-[450px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Advanced Filters</h3>
                            {filters.length > 0 && (
                                <button
                                    onClick={() => onChange([])}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                            {filters.length === 0 ? (
                                <div className="py-8 text-center text-stone-400 text-xs">
                                    No filters applied. Click 'Add filter' to start.
                                </div>
                            ) : (
                                filters.map((filter, index) => {
                                    const col = columns.find(c => c.id === filter.columnId);
                                    if (!col) return null;
                                    const ops = getOperators(col.type);
                                    const showValueInput = !['isEmpty', 'isNotEmpty'].includes(filter.operator);

                                    return (
                                        <div key={filter.id} className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md border border-stone-100 dark:border-stone-800">
                                            <div className="text-[10px] font-bold text-stone-400 w-8 text-center uppercase">
                                                {index === 0 ? 'Where' : 'And'}
                                            </div>

                                            {/* Column Select */}
                                            <div className="relative">
                                                <select
                                                    value={filter.columnId}
                                                    onChange={(e) => handleUpdateFilter(filter.id, { columnId: e.target.value })}
                                                    className="w-32 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
                                                >
                                                    {filterableColumns.map(c => (
                                                        <option key={c.id} value={c.id}>{c.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                                            </div>

                                            {/* Operator Select */}
                                            <div className="relative">
                                                <select
                                                    value={filter.operator}
                                                    onChange={(e) => handleUpdateFilter(filter.id, { operator: e.target.value })}
                                                    className="w-28 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
                                                >
                                                    {ops.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                                            </div>

                                            {/* Value Input */}
                                            {showValueInput && (
                                                col.options ? (
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={filter.value}
                                                            onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
                                                            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
                                                        >
                                                            <option value="">Select...</option>
                                                            {col.options.map(opt => (
                                                                <option key={opt.id || opt.label} value={opt.label}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                                        value={filter.value}
                                                        onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
                                                        placeholder="Value..."
                                                        className="flex-1 min-w-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                )
                                            )}

                                            <button
                                                onClick={() => handleRemoveFilter(filter.id)}
                                                className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <button
                            onClick={handleAddFilter}
                            className="flex items-center justify-center gap-2 w-full py-1.5 border border-dashed border-stone-300 dark:border-stone-700 rounded-md text-xs text-stone-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all mt-1"
                        >
                            <Plus size={12} />
                            Add Filter
                        </button>
                    </div>
                </PortalPopup>
            )}
        </>
    );
};
