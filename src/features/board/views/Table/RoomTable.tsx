import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SharedDatePicker } from '../../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import { useClickOutside } from '../../../../hooks/useClickOutside';

const InlineCellEditor: React.FC<{
    children: React.ReactNode;
    onClose: () => void;
}> = ({ children, onClose }) => {
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, onClose);
    return <div ref={ref} className="h-full w-full">{children}</div>;
};

import {
    Plus as PlusIcon,
    CircleDashed,
    Flag,
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    Circle,
    ChevronLeft,
    ChevronRight,
    GripVertical,
    Trash2,
    X,
    Layers,
    ListTree,
    Users,
    Filter,
    Search,
    ArrowUpDown,
    ChevronDown,
    UserCircle,
    EyeOff,
    MoreHorizontal
} from 'lucide-react';
import { ColumnMenu } from '../../components/ColumnMenu';
import { DropdownConfigModal } from '../../components/DropdownConfigModal';
import { ColumnContextMenu } from './components/ColumnContextMenu';
import { NevaAssistant } from '../../components/NevaAssistant';
import { DashboardHeader, DashboardConfig, ChartConfig } from '../../components/dashboard/DashboardHeader';
import { ChartBuilderModal } from '../../components/chart-builder/ChartBuilderModal';
import { ChartDataTransformer } from '../../components/chart-builder/services/ChartDataTransformer';
import { ChartBuilderConfig } from '../../components/chart-builder/types';
import { Sparkles } from 'lucide-react';
import { TablePagination } from './components/TablePagination';
import { TableFilter, FilterItem } from './components/TableFilter';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Filter Logic Helper ---
const checkFilterMatch = (rowValue: any, operator: string, filterValue: any, colType: string): boolean => {
    const val = rowValue === null || rowValue === undefined ? '' : String(rowValue).toLowerCase();
    const filterVal = String(filterValue).toLowerCase();

    // Empty checks
    if (operator === 'isEmpty') return val === '';
    if (operator === 'isNotEmpty') return val !== '';

    // Numeric checks
    if (colType === 'number') {
        const numVal = Number(rowValue);
        const numFilter = Number(filterValue);
        if (isNaN(numVal)) return false; // or handle as empty?

        switch (operator) {
            case 'eq': return numVal === numFilter;
            case 'gt': return numVal > numFilter;
            case 'lt': return numVal < numFilter;
            case 'gte': return numVal >= numFilter;
            case 'lte': return numVal <= numFilter;
            default: return false;
        }
    }

    // Default text/select checks
    switch (operator) {
        case 'contains': return val.includes(filterVal);
        case 'is': return val === filterVal;
        case 'isNot': return val !== filterVal;
        case 'startsWith': return val.startsWith(filterVal);
        case 'endsWith': return val.endsWith(filterVal);
        case 'before': return rowValue < filterValue; // String comparison works for ISO dates
        case 'after': return rowValue > filterValue;
        default: return true;
    }
};

// --- Types ---

export interface Column {
    id: string;
    label: string;
    type: string;
    width: number;
    minWidth: number;
    resizable: boolean;
    pinned?: boolean;
    options?: { id: string; label: string; color: string }[]; // For status/priority/select
}

export interface Row {
    id: string;
    [key: string]: any;
}

interface RoomTableProps {
    roomId: string;
    viewId: string;
    dashboardConfig?: DashboardConfig | null;
    onDashboardUpdate?: (config: DashboardConfig) => void;
    defaultColumns?: Column[];
    renderCustomActions?: (props: {
        setRows: React.Dispatch<React.SetStateAction<Row[]>>;
        setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
        rows: Row[];
        columns: Column[];
    }) => React.ReactNode;
    enableColumnReorder?: boolean;
}

// --- Helpers ---

const formatDate = (date: string | null): string => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(date));
};

const getPriorityColor = (priority: string | null) => {
    switch (priority) {
        case 'Urgent': return 'text-red-600';
        case 'High': return 'text-amber-500';
        case 'Normal': return 'text-blue-600';
        case 'Low': return 'text-stone-400';
        default: return 'text-stone-300';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'Done': return <CheckCircle2 size={14} className="text-emerald-600" />;
        case 'In Progress': return <Clock size={14} className="text-amber-600" />;
        case 'To Do': return <Circle size={14} className="text-stone-400" />;
        default: return <CircleDashed size={14} className="text-stone-400" />;
    }
};

// --- Popover Components ---

const PriorityPicker: React.FC<{
    onSelect: (p: string) => void;
    onClose: () => void;
    current: string | null;
}> = ({ onSelect, onClose, current }) => {
    const priorities = [
        { label: 'Urgent', color: 'text-red-600' },
        { label: 'High', color: 'text-amber-500' },
        { label: 'Normal', color: 'text-blue-600' },
        { label: 'Low', color: 'text-stone-400' },
    ];

    return (
        <div
            className="w-32 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
            <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400">Task Priority</span>
            </div>
            <div className="p-1">
                {priorities.map((p) => (
                    <button
                        key={p.label}
                        onClick={() => { onSelect(p.label); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-start rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${current === p.label ? 'bg-stone-50 dark:bg-stone-800/50' : ''}`}
                    >
                        <Flag size={16} className={p.color} fill="currentColor" fillOpacity={current === p.label ? 1 : 0.2} />
                        <span className="text-stone-700 dark:text-stone-200">{p.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const StatusPicker: React.FC<{
    onSelect: (s: string) => void;
    onClose: () => void;
    current: string;
    statuses: string[];
    onAddStatus: (s: string) => void;
}> = ({ onSelect, onClose, current, statuses, onAddStatus }) => {
    const [customStatus, setCustomStatus] = useState('');

    const handleAddStatus = (e: React.FormEvent) => {
        e.preventDefault();
        if (customStatus.trim()) {
            onAddStatus(customStatus.trim());
            onSelect(customStatus.trim());
            setCustomStatus('');
            onClose();
        }
    };

    return (
        <div
            className="w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
            <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400">Task Status</span>
            </div>
            <div className="p-1 max-h-48 overflow-y-auto">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => { onSelect(s); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-start rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${current === s ? 'bg-stone-50 dark:bg-stone-800/50' : ''}`}
                    >
                        {getStatusIcon(s)}
                        <span className="text-stone-700 dark:text-stone-200">{s}</span>
                    </button>
                ))}
            </div>
            <form onSubmit={handleAddStatus} className="p-2 border-t border-stone-100 dark:border-stone-800">
                <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="New status..."
                    className="w-full px-2 py-1 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
            </form>
        </div>
    );
};




const SelectPicker: React.FC<{
    onSelect: (s: string) => void;
    onClose: () => void;
    current: string;
    options: { id: string; label: string; color: string }[];
}> = ({ onSelect, onClose, current, options }) => {
    const [search, setSearch] = useState('');

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div
            className="w-[220px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 p-2 gap-2"
        >
            {/* Search Input */}
            <input
                type="text"
                autoFocus
                placeholder="Search or add options..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border-2 border-primary/50 focus:border-primary rounded-md outline-none transition-all placeholder:text-stone-400"
            />

            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {/* Clear / None Option */}
                <button
                    onClick={() => { onSelect(''); onClose(); }}
                    className="w-full h-8 border border-dashed border-stone-300 dark:border-stone-600 rounded flex items-center justify-center hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                    <span className="text-stone-400">-</span>
                </button>

                {/* Filtered Options */}
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => {
                        const isHex = opt.color?.startsWith('#');
                        return (
                            <button
                                key={opt.id}
                                onClick={() => { onSelect(opt.label); onClose(); }}
                                className={`w-full py-1.5 px-3 rounded text-xs font-medium text-white transition-transform active:scale-95 ${!isHex ? (opt.color || 'bg-stone-500') : ''}`}
                                style={isHex ? { backgroundColor: opt.color } : {}}
                            >
                                {opt.label}
                            </button>
                        );
                    })
                ) : (
                    <div className="py-2 text-center text-xs text-stone-400">
                        No options found
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sortable Row Component ---
// We extract this to use useSortable hook
interface SortableRowProps {
    row: Row;
    columns: Column[];
    getStickyStyle: (colId: string) => React.CSSProperties;
    renderCellContent: (col: Column, row: Row) => React.ReactNode;
    handleDeleteRow: (id: string) => void;
    activeCell: { rowId: string, colId: string, rect?: DOMRect } | null;
    enableColumnReorder?: boolean;
    handleDragStart?: (e: React.DragEvent<HTMLDivElement>, index: number) => void; // Legacy/Native
    isDraggingNative?: boolean;
}

const SortableRowComponent: React.FC<SortableRowProps> = ({
    row,
    columns,
    getStickyStyle,
    renderCellContent,
    handleDeleteRow,
    activeCell
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: row.id, data: { type: 'row', row } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50
                hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors relative min-w-max
                ${isDragging ? 'bg-indigo-50 dark:bg-indigo-900/20 z-50' : 'bg-white dark:bg-stone-900'}
            `}
        >
            {columns.map(col => (
                <div
                    key={col.id}
                    style={{ width: col.width, ...getStickyStyle(col.id) }}
                    className={`
                        h-full shrink-0 border-e border-stone-200/50 dark:border-stone-800 group-hover:border-stone-200 dark:group-hover:border-stone-700
                        ${activeCell?.rowId === row.id && activeCell?.colId === col.id ? 'z-10' : ''}
                        ${(col.id === 'select' || col.pinned) ? 'bg-white dark:bg-stone-900 group-hover:bg-stone-50 dark:group-hover:bg-stone-800/30 border-r border-stone-200 dark:border-stone-800' : ''}
                        ${col.id === 'select' ? 'flex justify-center items-center' : ''}
                        ${isDragging && (col.id === 'select' || col.pinned) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} 
                    `}
                >
                    {col.id === 'select' ? (
                        <div className="flex items-center gap-1 px-1">
                            <div
                                {...attributes}
                                {...listeners}
                                className="cursor-grab active:cursor-grabbing p-1 text-stone-300 hover:text-stone-500 transition-colors"
                            >
                                <GripVertical size={14} />
                            </div>
                            <div className="w-3.5 h-3.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 hover:border-stone-400 cursor-pointer" />
                        </div>
                    ) : (
                        renderCellContent(col, row)
                    )}
                </div>
            ))}

            {/* Fixed Actions Column (Delete) */}
            <div className="w-8 h-full flex items-center justify-center text-stone-300 border-s border-stone-100/50 dark:border-stone-800">
                <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-600 rounded transition-all"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

// --- Main RoomTable Component ---

const RoomTable: React.FC<RoomTableProps> = ({ roomId, viewId, dashboardConfig, onDashboardUpdate, defaultColumns, renderCustomActions, enableColumnReorder }) => {
    // Keys for persistence
    // Keys for persistence
    const storageKeyColumns = `room-table-columns-v3-${roomId}-${viewId}`;
    // Use separate storage for DataTable to avoid overwriting main board tasks
    const storageKeyRows = viewId.includes('datatable') ? `datatable-rows-${roomId}-${viewId}` : `board-tasks-${roomId}`;
    const storageKeyStatuses = `board-statuses-${roomId}`; // Shared Status Definitions

    // Shared Statuses State
    const [sharedStatuses, setSharedStatuses] = useState<string[]>(['To Do', 'In Progress', 'Done']);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKeyStatuses);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Handle both simple string[] and object[] formats (future proofing)
                if (Array.isArray(parsed)) {
                    if (typeof parsed[0] === 'string') setSharedStatuses(parsed);
                    else if (typeof parsed[0] === 'object') setSharedStatuses(parsed.map((s: any) => s.id || s.title));
                }
            }
        } catch (e) {
            console.error('Failed to load shared statuses', e);
        }
    }, [storageKeyStatuses]);

    const handleAddSharedStatus = (newStatus: string) => {
        if (!sharedStatuses.includes(newStatus)) {
            const updated = [...sharedStatuses, newStatus];
            setSharedStatuses(updated);
            localStorage.setItem(storageKeyStatuses, JSON.stringify(updated));
        }
    };

    // --- State ---

    const [columns, setColumns] = useState<Column[]>(() => {

        try {
            const saved = localStorage.getItem(storageKeyColumns);
            // If we have saved columns, use them.
            if (saved) {
                return JSON.parse(saved);
            }
            // If defaultColumns prop is provided, use it as the default.
            if (defaultColumns) {
                return defaultColumns;
            }
            // Otherwise use the standard default.
            return [
                { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false, pinned: true },
                { id: 'name', label: 'Name', type: 'text', width: 320, minWidth: 200, resizable: true, pinned: true },
                { id: 'assignees', label: 'Person', type: 'person', width: 140, minWidth: 60, resizable: true },
                { id: 'status', label: 'Status', type: 'status', width: 140, minWidth: 100, resizable: true },
                { id: 'dueDate', label: 'Due date', type: 'date', width: 140, minWidth: 100, resizable: true },
                { id: 'priority', label: 'Priority', type: 'priority', width: 140, minWidth: 100, resizable: true },
            ];
        } catch {
            return defaultColumns || [
                { id: 'select', label: '', type: 'select', width: 40, minWidth: 40, resizable: false, pinned: true },
                { id: 'name', label: 'Name', type: 'text', width: 200, minWidth: 100, resizable: true, pinned: true },
                { id: 'assignees', label: 'Person', type: 'person', width: 140, minWidth: 60, resizable: true },
                { id: 'status', label: 'Status', type: 'status', width: 140, minWidth: 100, resizable: true },
                { id: 'dueDate', label: 'Due date', type: 'date', width: 140, minWidth: 100, resizable: true },
                { id: 'priority', label: 'Priority', type: 'priority', width: 140, minWidth: 100, resizable: true },
            ];
        }
    });

    const [rows, setRows] = useState<Row[]>(() => {
        try {
            const saved = localStorage.getItem(storageKeyRows);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [newTaskName, setNewTaskName] = useState('');
    const [activeCell, setActiveCell] = useState<{ rowId: string, colId: string, rect?: DOMRect } | null>(null);
    const [activeColumnMenu, setActiveColumnMenu] = useState<{ rect: DOMRect } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, colId: string } | null>(null);
    const [dropdownConfig, setDropdownConfig] = useState<{ isOpen: boolean; type: string; defaultLabel: string }>({ isOpen: false, type: '', defaultLabel: '' });
    const [showAIMenu, setShowAIMenu] = useState<{ rect: DOMRect } | null>(null);
    const [showChartBuilder, setShowChartBuilder] = useState(false);
    const [localDashboardConfig, setLocalDashboardConfig] = useState<DashboardConfig | null>(null);

    // Effective config (Prop takes precedence)
    const effectiveDashboardConfig = dashboardConfig || localDashboardConfig;
    const handleSetDashboardConfig = (config: DashboardConfig) => {
        if (onDashboardUpdate) {
            onDashboardUpdate(config);
        } else {
            setLocalDashboardConfig(config);
        }
    };

    const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
    const [tempColName, setTempColName] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Search, User Filter, Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    // --- Derived State ---

    const filteredRows = React.useMemo(() => {
        return rows.filter(row => {
            // Search
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const matchesSearch = columns.some(col =>
                    String(row[col.id] || '').toLowerCase().includes(searchLower)
                );
                if (!matchesSearch) return false;
            }

            // Advanced Filters
            if (activeFilters.length > 0) {
                return activeFilters.every(filter => {
                    const col = columns.find(c => c.id === filter.columnId);
                    if (!col) return true;
                    return checkFilterMatch(row[filter.columnId], filter.operator, filter.value, col.type);
                });
            }
            return true;
        });
    }, [rows, searchQuery, activeFilters, columns]);

    const sortedRows = React.useMemo(() => {
        if (!sortConfig) return filteredRows;
        return [...filteredRows].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredRows, sortConfig]);

    const paginatedRows = React.useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        // Effect-like check for page out of bounds
        if (currentPage > 1 && sortedRows.length > 0 && startIndex >= sortedRows.length) {
            // We can't set state directly in useMemo, but we can return the last page? 
            // Ideally use useEffect for this sync, but for now just clamp.
            return sortedRows.slice(0, pageSize);
        }
        return sortedRows.slice(startIndex, startIndex + pageSize);
    }, [sortedRows, currentPage, pageSize]);

    // Sync page if out of bounds (safe side effect)
    useEffect(() => {
        const startIndex = (currentPage - 1) * pageSize;
        if (currentPage > 1 && filteredRows.length > 0 && startIndex >= filteredRows.length) {
            setCurrentPage(1);
        }
    }, [filteredRows.length, currentPage, pageSize]);

    // Drag & Drop State (dnd-kit)
    // We separate logic for Row Drag vs Column Drag to avoid conflicts.
    // Row Drag State
    const [activeRowDragId, setActiveRowDragId] = useState<string | null>(null);

    // Column Drag State
    const [activeColDragId, setActiveColDragId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // slight tolerance
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );


    // Column Resize State
    const resizingColId = useRef<string | null>(null);
    const startX = useRef<number>(0);
    const startWidth = useRef<number>(0);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem(storageKeyColumns, JSON.stringify(columns));
    }, [columns, storageKeyColumns]);

    useEffect(() => {
        localStorage.setItem(storageKeyRows, JSON.stringify(rows));
    }, [rows, storageKeyRows]);

    // Force migration of Person column width
    useEffect(() => {
        setColumns(cols => cols.map(c => {
            if (c.id === 'assignees' && c.width < 140) {
                return { ...c, width: 140 };
            }
            return c;
        }));
    }, []);

    // Force unpin 'name' column in Data Table (enableColumnReorder mode) to ensure it is draggable.
    // This fixes the issue where 'name' is pinned by default/import and thus locked.
    useEffect(() => {
        if (enableColumnReorder) {
            setColumns(cols => {
                const needsUpdate = cols.some(c => c.id === 'name' && c.pinned);
                if (needsUpdate) {
                    return cols.map(c => c.id === 'name' ? { ...c, pinned: false } : c);
                }
                return cols;
            });
        }
    }, [enableColumnReorder]);

    // Click Outside logic is now handled by components themselves or dedicated hooks, 
    // but we can add a global one if we want to ensure everything clears on "blank" clicks
    // For now, let's keep it simple and rely on the components closing themselves.
    // However, the original code had a global listener for activeCell. Let's replicate that pattern with the hook if needed,
    // but the `activeCell` is tricky because it's state-driven.
    // Instead of a global listener on window, we can just ensure that if the user clicks "anywhere else" (on the table body/container), we clear it.
    // BUT, the requirement is "clicking anywhere cancels".
    // So let's attach a listener to the document to clear activeCell if the click is NOT inside an active cell content.

    // We can't easily use useClickOutside for activeCell because activeCell is not a single Ref, it's rendered conditionally.
    // The previous implementation was:
    // window.addEventListener('click', handleClickOutside);
    // where handleClickOutside just set activeCell(null).
    // This relied on stopPropagation in the cell content.
    // Let's keep that simple pattern for activeCell specifically as it's the most robust way to handle "click anywhere else" without Ref management hell for dynamic cells.

    // Click Outside logic is handled by InlineCellEditor and PortalPopup components.
    // The previous manual listener was removed as it failed to capture clicks on elements that stop propagation (like Sidebar).


    // --- Handlers ---

    const handleAddTask = () => {
        if (!newTaskName.trim()) return;
        const newRow: Row = {
            id: Date.now().toString(),
            name: newTaskName,
            status: 'To Do',
            dueDate: null,
            priority: null,
            assignees: ['M'] // Default assignee
        };
        // Initialize other columns with null/empty
        columns.forEach(col => {
            if (!['select', 'name', 'status', 'dueDate', 'priority', 'assignees'].includes(col.id)) {
                newRow[col.id] = null;
            }
        });

        setRows([...rows, newRow]);
        setNewTaskName('');
    };

    const handleUpdateRow = (id: string, updates: Partial<Row>) => {
        setRows(rows.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const handleDeleteRow = (id: string) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const toggleCell = (e: React.MouseEvent, rowId: string, colId: string) => {
        e.stopPropagation();
        if (activeCell?.rowId === rowId && activeCell?.colId === colId) {
            setActiveCell(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveCell({ rowId, colId, rect });
        }
    };

    const handleAddColumn = (type: string, label: string, options?: any[]) => {
        const newCol: Column = {
            id: label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
            label: label,
            type: type,
            width: 150,
            minWidth: 100,
            resizable: true,
            options: options
        };
        setColumns([...columns, newCol]);
        // Immediately start renaming the new column
        setRenamingColumnId(newCol.id);
        setTempColName(label);
    };

    // --- Row DnD Handlers ---
    const handleRowDragStart = (event: DragStartEvent) => {
        setActiveRowDragId(String(event.active.id));
    };

    const handleRowDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setRows((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveRowDragId(null);
    };

    // --- Column DnD Handlers ---
    const handleColDragStart = (event: DragStartEvent) => {
        setActiveColDragId(String(event.active.id));
    };

    const handleColDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) {
            setActiveColDragId(null);
            return;
        }

        if (active.id !== over.id) {
            // Reorder Columns
            const activeIdStr = String(active.id);
            setColumns((cols) => {
                const oldIndex = cols.findIndex(c => c.id === activeIdStr);
                const newIndex = cols.findIndex(c => c.id === over.id);
                return arrayMove(cols, oldIndex, newIndex);
            });
        }
        setActiveColDragId(null);
    };

    // Helper for Column resizing to stop propagation
    const handleResizeMouseDown = (e: React.MouseEvent, colId: string, width: number) => {
        // Stop bubbling so dnd-kit doesn't think we are dragging the header
        e.stopPropagation();
        startResize(e, colId, width);
    };

    // Legacy Native DnD Removed


    // Column Resize
    const startResize = (e: React.MouseEvent, colId: string, currentWidth: number) => {
        e.preventDefault();
        e.stopPropagation();
        resizingColId.current = colId;
        startX.current = e.clientX;
        startWidth.current = currentWidth;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    const handleDeleteColumn = (id: string) => {
        setColumns(columns.filter(c => c.id !== id));
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingColId.current) return;
        const diff = e.clientX - startX.current;
        const newWidth = startWidth.current + diff;
        setColumns(cols => cols.map(col => {
            if (col.id === resizingColId.current) {
                return { ...col, width: Math.max(col.minWidth, newWidth) };
            }
            return col;
        }));
    }, []);



    const onMouseUp = useCallback(() => {
        resizingColId.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'default';
    }, [onMouseMove]);

    const handleChartSave = (config: ChartBuilderConfig) => {
        // Transform the config into an ECharts option immediately
        const data = ChartDataTransformer.transformData(rows, config);
        const option = ChartDataTransformer.generateOption(data, config);

        const newChart: ChartConfig = {
            id: Date.now().toString(),
            title: config.title,
            type: config.chartType as any,
            data: option
        };

        const currentConfig = effectiveDashboardConfig || { kpis: [], charts: [] };
        handleSetDashboardConfig({
            ...currentConfig,
            charts: [...(currentConfig.charts || []), newChart]
        });

        setShowChartBuilder(false);
    };

    const handleColumnAction = (action: string, colId: string) => {
        setContextMenu(null);
        if (action === 'delete') {
            handleDeleteColumn(colId);
        } else if (action === 'pin') {
            setColumns(prev => {
                // Toggle pin state
                const newCols = prev.map(c => c.id === colId ? { ...c, pinned: !c.pinned } : c);
                // Ensure 'select' is always pinned? It's hardcoded pinned: true in state init, but let's enforce or let it be. 
                return newCols;
            });
        } else if (action === 'rename') {
            setRenamingColumnId(colId);
            const col = columns.find(c => c.id === colId);
            setTempColName(col?.label || '');
        } else if (action === 'sort') {
            handleSort(colId);
        }
    };

    const handleSort = (colId: string) => {
        setSortConfig(current => {
            if (current?.key === colId && current.direction === 'asc') {
                return { key: colId, direction: 'desc' };
            }
            return { key: colId, direction: 'asc' };
        });
    };

    const handleRenameSubmit = () => {
        if (renamingColumnId && tempColName.trim()) {
            setColumns(cols => cols.map(c => c.id === renamingColumnId ? { ...c, label: tempColName.trim() } : c));
        }
        setRenamingColumnId(null);
    };

    // calculate sticky offsets
    const getStickyStyle = (colId: string) => {
        const colIndex = columns.findIndex(c => c.id === colId);
        if (colIndex === -1) return {};
        const col = columns[colIndex];

        if (!col.pinned && col.id !== 'select') return {};

        let left = 0;
        for (let i = 0; i < colIndex; i++) {
            if (columns[i].pinned || columns[i].id === 'select') {
                left += columns[i].width;
            }
        }

        return {
            position: 'sticky' as const,
            left: left,
            zIndex: col.id === 'select' ? 30 : 20, // Select higher z-index if needed, or equal.
        };
    };

    // SortableRow Component
    interface SortableRowProps {
        row: Row;
        columns: Column[];
        getStickyStyle: (colId: string) => React.CSSProperties;
        renderCellContent: (col: Column, row: Row) => React.ReactNode;
        handleDeleteRow: (id: string) => void;
        activeCell: { rowId: string, colId: string, rect?: DOMRect } | null;
    }

    const SortableRowComponent: React.FC<SortableRowProps> = ({
        row,
        columns,
        getStickyStyle,
        renderCellContent,
        handleDeleteRow,
        activeCell,
    }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: row.id, data: { type: 'row', row } });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? 100 : 'auto',
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                className="group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors focus-within:bg-stone-50 dark:focus-within:bg-stone-800/50 min-w-max"
            >
                {columns.map((col) => (
                    <div
                        key={col.id}
                        style={{ width: col.width, ...getStickyStyle(col.id) }}
                        className={`
                            h-full flex items-center shrink-0
                            ${(col.id === 'select' || col.pinned) ? 'bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800' : ''}
                            ${col.id === 'select' ? 'justify-center' : ''}
                            ${activeCell?.rowId === row.id && activeCell?.colId === col.id ? 'z-30' : ''}
                        `}
                    >
                        {col.id === 'select' ? (
                            <div className="flex items-center justify-center w-full h-full relative group/handle cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                                <div className="absolute left-1 opacity-0 group-hover/handle:opacity-100 text-stone-300 transition-opacity">
                                    <GripVertical size={14} />
                                </div>
                                <div className="w-4 h-4 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 flex items-center justify-center hover:border-indigo-500 transition-colors z-10">
                                    {/* Checkbox visualization - placeholder or functional? Native checkbox style match */}
                                </div>
                            </div>
                        ) : (
                            renderCellContent(col, row)
                        )}
                    </div>
                ))}
                <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-600 rounded transition-all"
                    title="Delete Row"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        );
    };

    // --- Sortable Header Component ---
    interface SortableHeaderProps {
        col: Column;
        index: number;
        getStickyStyle: (colId: string) => React.CSSProperties;
        handleResizeMouseDown: (e: React.MouseEvent, colId: string, width: number) => void;
        handleHeaderClick: (colId: string) => void;
        renamingColumnId: string | null;
        setRenamingColumnId: (id: string | null) => void;
        tempColName: string;
        setTempColName: (name: string) => void;
        handleRenameSubmit: () => void;
        handleDeleteColumn: (id: string) => void;
        handleSort: (id: string) => void;
        sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
        setContextMenu: (e: React.MouseEvent, colId: string) => void;
        enableColumnReorder?: boolean;
    }

    const SortableHeader: React.FC<SortableHeaderProps> = ({
        col,
        index,
        getStickyStyle,
        handleResizeMouseDown,
        renamingColumnId,
        setRenamingColumnId,
        tempColName,
        setTempColName,
        handleRenameSubmit,
        handleDeleteColumn,
        handleSort,
        sortConfig,
        setContextMenu,
        enableColumnReorder
    }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({
            id: col.id,
            data: { type: 'col', col },
            // Enable reorder by default unless explicitly disabled, or if column is locked (select/pinned)
            disabled: (enableColumnReorder === false) || col.id === 'select' || col.pinned
        });

        const style = {
            transform: CSS.Translate.toString(transform),
            transition,
            opacity: isDragging ? 0.3 : 1,
            zIndex: isDragging ? 50 : (col.id === 'select' || col.pinned ? 30 : 'auto'),
            width: col.width,
            ...getStickyStyle(col.id)
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`
                  h-full flex items-center text-xs font-sans font-medium text-stone-500 dark:text-stone-400 shrink-0
                  ${(col.id === 'select' || col.pinned) ? 'bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800' : 'px-3'}
                  border-e border-stone-200/50 dark:border-stone-800
                  ${col.id === 'select' ? 'justify-center' : ''}
                  hover:bg-stone-100 dark:hover:bg-stone-800 cursor-default transition-colors select-none relative group
                `}
                onContextMenu={(e) => setContextMenu(e, col.id)}
                {...attributes}
                /* Remove global listeners from container, apply only to handle for unpinned cols */
                {...(col.id === 'select' || col.pinned ? listeners : {})}
            >
                {col.id === 'select' && (
                    <div className="w-3.5 h-3.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 hover:border-stone-400 transition-colors" />
                )}

                {col.id !== 'select' && (
                    <div className="flex items-center justify-between w-full px-3">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {/* Drag Handle for Unpinned Columns */}
                            {!col.pinned && (
                                <div
                                    {...listeners}
                                    className="cursor-grab active:cursor-grabbing p-0.5 text-stone-300 hover:text-stone-500 transition-colors rounded hover:bg-stone-100 dark:hover:bg-stone-800"
                                >
                                    <GripVertical size={12} />
                                </div>
                            )}

                            {renamingColumnId === col.id ? (
                                <input
                                    type="text"
                                    autoFocus
                                    value={tempColName}
                                    onChange={(e) => setTempColName(e.target.value)}
                                    onBlur={handleRenameSubmit}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameSubmit();
                                        if (e.key === 'Escape') setRenamingColumnId(null);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()} // Allow clicking input without drag
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-white dark:bg-stone-800 border border-indigo-500 rounded px-1 py-0.5 text-xs text-stone-700 dark:text-stone-200 focus:outline-none"
                                />
                            ) : (
                                <span
                                    className="truncate cursor-text font-medium text-stone-600 dark:text-stone-300"
                                    onDoubleClick={(e) => {
                                        setRenamingColumnId(col.id);
                                        setTempColName(col.label);
                                    }}
                                    title="Double click to rename"
                                >
                                    {col.label}
                                </span>
                            )}
                            <button
                                onClick={(e) => { handleSort(col.id); }}
                                className={`p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${sortConfig?.key === col.id ? 'opacity-100 text-stone-600 dark:text-stone-300' : 'opacity-0 group-hover:opacity-100 text-stone-300'}`}
                            >
                                <ArrowUpDown size={12} />
                            </button>
                        </div>
                        {!['name', 'select'].includes(col.id) && (
                            <button
                                onClick={(e) => { handleDeleteColumn(col.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-600 rounded transition-all"
                                title="Delete Column"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                )}

                {col.resizable && (
                    <div
                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-stone-400/50 dark:hover:bg-stone-600/50 z-10"
                        onMouseDown={(e) => handleResizeMouseDown(e, col.id, col.width)}
                    />
                )}
            </div>
        );
    };

    // --- Rendering Helpers ---

    const renderCellContent = (col: Column, row: Row) => {
        const value = row[col.id];

        if (col.type === 'person') {
            return (
                <div className="relative w-full h-full flex items-center justify-center p-1">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm" title="Assignee: Max">
                        M
                    </div>
                </div>
            );
        }

        if (col.type === 'status') {
            return (
                <div className="relative w-full h-full">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                    >
                        {value ? (
                            <div className="flex items-center gap-2 truncate">
                                {getStatusIcon(value)}
                                <span className="text-sm font-sans text-stone-600 dark:text-stone-300 truncate">{value}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-stone-400">Set Status</span>
                        )}
                    </button>
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.rect && (
                        <PortalPopup
                            triggerRef={{ current: { getBoundingClientRect: () => activeCell.rect! } } as any}
                            onClose={() => setActiveCell(null)}
                            side="bottom"
                        >
                            <StatusPicker
                                current={value}
                                onSelect={(s) => handleUpdateRow(row.id, { [col.id]: s })}
                                onClose={() => setActiveCell(null)}
                                statuses={sharedStatuses}
                                onAddStatus={handleAddSharedStatus}
                            />
                        </PortalPopup>
                    )}
                </div>
            );
        }

        if (col.type === 'date') {
            return (
                <div className="relative w-full h-full">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                    >
                        <span className={`text-sm font-sans truncate ${value ? 'text-stone-600 dark:text-stone-300' : 'text-stone-400'}`}>
                            {formatDate(value) || 'Set Date'}
                        </span>
                    </button>
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.rect && (
                        <PortalPopup
                            triggerRef={{ current: { getBoundingClientRect: () => activeCell.rect! } } as any}
                            onClose={() => setActiveCell(null)}
                            side="bottom"
                        >
                            <SharedDatePicker
                                selectedDate={value}
                                onSelectDate={(date) => {
                                    handleUpdateRow(row.id, { [col.id]: date.toISOString() });
                                    setActiveCell(null);
                                }}
                                onClose={() => setActiveCell(null)}
                            />
                        </PortalPopup>
                    )}
                </div>
            );
        }

        if (col.type === 'number') {
            const isEditing = activeCell?.rowId === row.id && activeCell?.colId === col.id;

            if (isEditing) {
                return (
                    <InlineCellEditor onClose={() => setActiveCell(null)}>
                        <div className="h-full w-full">
                            <input
                                type="number"
                                autoFocus
                                onBlur={() => setActiveCell(null)}
                                onKeyDown={(e) => { if (e.key === 'Enter') setActiveCell(null); }}
                                value={value || ''}
                                onChange={(e) => handleUpdateRow(row.id, { [col.id]: e.target.value })}
                                className="w-full h-full bg-stone-50 dark:bg-stone-800 border-none outline-none px-3 text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400"
                            />
                        </div>
                    </InlineCellEditor>
                );
            }

            return (
                <div className="relative w-full h-full">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                    >
                        {value ? (
                            <span className="text-sm font-sans text-stone-600 dark:text-stone-300 truncate">
                                {Number(value).toLocaleString()}
                            </span>
                        ) : (
                            <span className="text-xs text-stone-400">Add value</span>
                        )}
                    </button>
                </div>
            );
        }



        if (col.type === 'dropdown' || col.type === 'select') { // Handle both types
            const selectedOption = col.options?.find(o => o.label === value);
            const colorValue = selectedOption?.color || 'bg-stone-500';
            const isHex = colorValue.startsWith('#');

            return (
                <div className="relative w-full h-full p-1">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className={`w-full h-full rounded flex items-center justify-center px-2 hover:opacity-80 transition-opacity ${!value ? 'hover:bg-stone-100 dark:hover:bg-stone-800/50' : ''} ${value && !isHex ? colorValue : ''}`}
                        style={value && isHex ? { backgroundColor: colorValue } : {}}
                    >
                        {value ? (
                            <span className="text-xs font-medium text-white truncate">{value}</span>
                        ) : (
                            <span className="text-xs text-stone-400">Select Option</span>
                        )}
                    </button>
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.rect && (
                        <PortalPopup
                            triggerRef={{ current: { getBoundingClientRect: () => activeCell.rect! } } as any}
                            onClose={() => setActiveCell(null)}
                            side="bottom"
                        >
                            <SelectPicker
                                options={col.options || []}
                                current={value}
                                onSelect={(s) => handleUpdateRow(row.id, { [col.id]: s })}
                                onClose={() => setActiveCell(null)}
                            />
                        </PortalPopup>
                    )}
                </div>
            );
        }

        if (col.type === 'priority') {
            return (
                <div className="relative w-full h-full">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                    >
                        {value ? (
                            <div className="flex items-center gap-2 truncate">
                                <Flag size={14} className={getPriorityColor(value)} fill="currentColor" />
                                <span className="text-sm font-sans text-stone-600 dark:text-stone-300 truncate">{value}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-stone-400">Set Priority</span>
                        )}
                    </button>
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.rect && (
                        <PortalPopup
                            triggerRef={{ current: { getBoundingClientRect: () => activeCell.rect! } } as any}
                            onClose={() => setActiveCell(null)}
                            side="bottom"
                        >
                            <PriorityPicker
                                current={value}
                                onSelect={(p) => handleUpdateRow(row.id, { [col.id]: p })}
                                onClose={() => setActiveCell(null)}
                            />
                        </PortalPopup>
                    )}
                </div>
            );
        }

        // 'name' column now falls through to default text cell for editing capabilities

        // Default Text Cell
        if (activeCell?.rowId === row.id && activeCell?.colId === col.id) {
            return (
                <InlineCellEditor onClose={() => setActiveCell(null)}>
                    <div className="h-full w-full">
                        <input
                            type="text"
                            autoFocus
                            value={value || ''}
                            onChange={(e) => handleUpdateRow(row.id, { [col.id]: e.target.value })}
                            onBlur={() => setActiveCell(null)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setActiveCell(null); }}
                            className="w-full h-full bg-stone-50 dark:bg-stone-800 border-none outline-none px-3 text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400 focus:bg-stone-50 dark:focus:bg-stone-800/50 transition-colors"
                        />
                    </div>
                </InlineCellEditor>
            );
        }

        // Default Text Cell (Display Mode)
        return (
            <div
                onClick={(e) => toggleCell(e, row.id, col.id)}
                className="h-full w-full flex items-center px-3 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors cursor-text overflow-hidden"
            >
                {value ? <span className="text-sm font-sans text-stone-700 dark:text-stone-300 truncate">{value}</span> : <span className="text-xs text-stone-400">Add text</span>}
            </div>
        )
    };

    // --- Resize Observer for Sticky Header ---
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [headerWidth, setHeaderWidth] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (!scrollContainerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setHeaderWidth(entry.contentRect.width);
            }
        });
        resizeObserver.observe(scrollContainerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div className="flex flex-col w-full h-full bg-stone-50 dark:bg-stone-900/50 font-sans overflow-hidden">


            {/* Secondary Toolbar (Group/Subtasks) */}
            <div className="flex items-center justify-between py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 shrink-0">
                {/* Left Tools */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-2 py-0.5 text-[12px] font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <Layers size={12} />
                        <span>Group: None</span>
                    </button>
                    <button className="flex items-center gap-2 px-2 py-0.5 text-[12px] font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <ListTree size={12} />
                        <span>Subtasks</span>
                    </button>

                    <button
                        onClick={() => setShowChartBuilder(true)}
                        className="flex items-center gap-2 px-2 py-0.5 text-[12px] font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors mr-2"
                    >
                        <Sparkles size={12} className="text-indigo-500" />
                        <span>New Report</span>
                    </button>

                    <button
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setShowAIMenu(showAIMenu ? null : { rect });
                        }}
                        className={`flex items-center gap-2 px-2 py-0.5 text-[12px] font-medium border rounded-full transition-all ${showAIMenu
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
                            : 'text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                    >
                        <Sparkles size={12} className={showAIMenu ? 'fill-current' : ''} />
                        <span>AI</span>
                    </button>

                    {showAIMenu && (
                        <PortalPopup
                            triggerRef={{ current: { getBoundingClientRect: () => showAIMenu.rect } } as any}
                            onClose={() => setShowAIMenu(null)}
                            side="bottom"
                            align="start"
                        >
                            <NevaAssistant
                                onGenerate={(config) => handleSetDashboardConfig(config)}
                                columns={columns.map(c => ({ id: c.id, label: c.label, type: c.type }))}
                                rows={rows}
                            />
                        </PortalPopup>
                    )}
                </div>

                {/* Right Tools */}
                <div className="flex items-center gap-2">
                    {/* Custom Actions */}
                    {renderCustomActions && renderCustomActions({ setRows, setColumns, rows, columns })}

                    <TableFilter
                        columns={columns}
                        filters={activeFilters}
                        onChange={setActiveFilters}
                    />

                    <button className="flex items-center gap-2 px-2 py-0.5 text-[12px] font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <CheckCircle2 size={12} />
                        <span>Closed</span>
                    </button>
                    <button className="flex items-center gap-2 px-2 py-0.5 text-[12px] font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <Users size={12} />
                        <span>Assignee</span>
                    </button>

                    <div className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white text-[9px] font-semibold rounded-full cursor-pointer hover:opacity-90 transition-opacity">
                        M
                    </div>

                    <div className="h-6 w-px bg-stone-200 dark:bg-stone-800 mx-1" />

                    <div className="flex items-center gap-2 px-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded transition-colors">
                        <Search size={13} className="text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-[12px] text-stone-600 dark:text-stone-300 placeholder:text-stone-400 w-24 focus:w-40 transition-all font-sans"
                        />
                    </div>
                </div>
            </div>

            {/* Table Body */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-auto bg-white dark:bg-stone-900 relative overscroll-y-contain"
            >

                {/* Dashboard Section (Inside Scroll) */}
                {effectiveDashboardConfig && (
                    <div
                        className="sticky left-0 z-10 bg-stone-50/50 dark:bg-stone-900/50 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800"
                        style={{ width: headerWidth ? `${headerWidth}px` : '100%' }}
                    >
                        <DashboardHeader config={effectiveDashboardConfig} />
                    </div>
                )}

                {/* Table Header Section with Column DndContext */}
                <DndContext
                    id="cols-dnd-context"
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleColDragStart}
                    onDragEnd={handleColDragEnd}
                >
                    <div className="flex items-center border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 h-10 flex-shrink-0 sticky top-0 z-20 min-w-max">
                        <SortableContext
                            items={columns.map(c => c.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {columns.map((col, index) => (
                                <SortableHeader
                                    key={col.id}
                                    col={col}
                                    index={index}
                                    getStickyStyle={getStickyStyle}
                                    handleResizeMouseDown={handleResizeMouseDown}
                                    handleHeaderClick={() => { }}
                                    renamingColumnId={renamingColumnId}
                                    setRenamingColumnId={setRenamingColumnId}
                                    tempColName={tempColName}
                                    setTempColName={setTempColName}
                                    handleRenameSubmit={handleRenameSubmit}
                                    handleDeleteColumn={handleDeleteColumn}
                                    handleSort={handleSort}
                                    sortConfig={sortConfig}
                                    setContextMenu={(e, colId) => {
                                        e.preventDefault();
                                        setContextMenu({ x: e.clientX, y: e.clientY, colId: colId });
                                    }}
                                    enableColumnReorder={enableColumnReorder}
                                />
                            ))}
                        </SortableContext>

                        {/* Add Column Button */}
                        <div className="relative h-full flex flex-col justify-center shrink-0">
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveColumnMenu({ rect });
                                }}
                                className="flex items-center justify-center w-8 h-full border-s border-stone-200/50 dark:border-stone-800 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            >
                                <PlusIcon size={14} />
                            </button>

                            {activeColumnMenu && (
                                <PortalPopup
                                    triggerRef={{ current: { getBoundingClientRect: () => activeColumnMenu.rect } } as any}
                                    onClose={() => setActiveColumnMenu(null)}
                                    side="bottom"
                                    align="end"
                                >
                                    <ColumnMenu
                                        onSelect={(type, label, options) => {
                                            handleAddColumn(type, label, options);
                                            setActiveColumnMenu(null);
                                        }}
                                        onClose={() => setActiveColumnMenu(null)}
                                    />
                                </PortalPopup>
                            )}
                        </div>
                    </div>
                    <DragOverlay>
                        {activeColDragId ? (
                            <div className="h-10 px-3 bg-indigo-500 text-white flex items-center rounded opacity-80 text-xs font-medium border border-indigo-600 shadow-lg cursor-grabbing">
                                {columns.find(c => c.id === activeColDragId)?.label || 'Column'}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* Tasks Section with Row DndContext */}
                <DndContext
                    id="rows-dnd-context"
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleRowDragStart}
                    onDragEnd={handleRowDragEnd}
                >
                    <SortableContext
                        items={filteredRows.map(r => r.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col min-w-max">
                            {
                                paginatedRows.map((row, index) => (
                                    <SortableRowComponent
                                        key={row.id}
                                        row={row}
                                        columns={columns}
                                        getStickyStyle={getStickyStyle}
                                        renderCellContent={renderCellContent}
                                        handleDeleteRow={handleDeleteRow}
                                        activeCell={activeCell}
                                    />
                                ))
                            }

                            {/* Input Row */}
                            <div className="sticky bottom-0 z-20 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors focus-within:bg-stone-50 dark:focus-within:bg-stone-800/50 min-w-max">
                                {columns.map(col => {
                                    if (col.id === 'select') {
                                        return (
                                            <div key={col.id} style={{ width: col.width, ...getStickyStyle(col.id), zIndex: 30 }} className="h-full flex items-center justify-center border-e border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 group-hover:bg-stone-50 dark:group-hover:bg-stone-800/30">
                                                <PlusIcon size={14} className="text-stone-400 dark:text-stone-500" />
                                            </div>
                                        );
                                    }
                                    if (col.id === 'name') {
                                        return (
                                            <div key={col.id} style={{ width: col.width, ...getStickyStyle(col.id) }} className={`h-full flex items-center px-3 border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800 ${col.pinned ? 'bg-white dark:bg-stone-900 group-hover:bg-stone-50 dark:group-hover:bg-stone-800/30 border-r border-stone-200 dark:border-stone-800' : ''}`}>
                                                <input
                                                    type="text"
                                                    value={newTaskName}
                                                    onChange={(e) => setNewTaskName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                                    placeholder=""
                                                    className="w-full bg-transparent border-none outline-none text-sm font-serif placeholder:text-stone-400 text-stone-800 dark:text-stone-200 p-0"
                                                />
                                            </div>
                                        );
                                    }
                                    // Empty placeholder for other columns
                                    return (
                                        <div key={col.id} style={{ width: col.width, ...getStickyStyle(col.id) }} className={`h-full border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800 ${col.pinned ? 'bg-white dark:bg-stone-900 group-hover:bg-stone-50 dark:group-hover:bg-stone-800/30 border-r border-stone-200 dark:border-stone-800' : ''}`} />
                                    );
                                })}

                                <div className="w-8 h-full border-s border-stone-100/50 dark:border-stone-800" />
                            </div>
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeRowDragId ? (
                            <div className="opacity-80 bg-white ring-1 ring-indigo-500 shadow-xl">
                                <div className="flex items-center h-10 border-b border-stone-100 bg-white dark:bg-stone-900 pl-2">
                                    <div className="flex items-center gap-2">
                                        <GripVertical size={14} className="text-stone-400" />
                                        <span className="text-sm">
                                            {filteredRows.find(r => r.id === activeRowDragId)?.name || 'Moving Item'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>





            </div > {/* This closes the main scrollable div for the table content */}

            < TablePagination
                totalItems={filteredRows.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
            />


            {/* Dropdown Config Modal */}
            {
                dropdownConfig.isOpen && createPortal(
                    <DropdownConfigModal
                        isOpen={dropdownConfig.isOpen}
                        onClose={() => setDropdownConfig({ ...dropdownConfig, isOpen: false })}
                        onSave={(label, options) => {
                            handleAddColumn(dropdownConfig.type, label, options);
                            setDropdownConfig({ ...dropdownConfig, isOpen: false });
                        }}
                    />,
                    document.body
                )
            }

            {/* Context Menu */}
            {
                contextMenu && createPortal(
                    <>
                        <div
                            className="fixed inset-0 z-[100]"
                            onMouseDown={() => setContextMenu(null)}
                            onContextMenu={(e) => e.preventDefault()}
                        />
                        <div
                            className="fixed z-[101]"
                            style={{
                                top: contextMenu.y,
                                left: Math.min(contextMenu.x, window.innerWidth - 240) // Prevent right overflow (240px approx menu width)
                            }}
                        >
                            <ColumnContextMenu
                                columnId={contextMenu.colId}
                                onClose={() => setContextMenu(null)}
                                onAction={(action) => handleColumnAction(action, contextMenu.colId)}
                            />
                        </div>
                    </>,
                    document.body
                )
            }
            {
                showChartBuilder && (
                    <ChartBuilderModal
                        isOpen={showChartBuilder}
                        onClose={() => setShowChartBuilder(false)}
                        onSave={handleChartSave}
                        columns={columns}
                        rows={rows}
                    />
                )
            }
        </div >
    );
};

export default React.memo(RoomTable);
