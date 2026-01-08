import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { ChartBuilderModal } from '../../components/chart-builder/ChartBuilderModal';
import { AIReportModal } from '../../components/AIReportModal';
import { SharedDatePicker } from '../../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import {
    Plus,
    CircleDashed,
    Flag,
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    Circle,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    GripVertical,
    Trash2,
    X,
    Layers,
    ListTree,
    Users,
    Filter,
    Search,
    Bell,
    Download,
    BarChart3,
    Sparkles,
    LayoutGrid,
} from 'lucide-react';
import { ColumnMenu } from '../../components/ColumnMenu';
import { getPriorityClasses, normalizePriority, PRIORITY_LEVELS, PriorityLevel, comparePriority } from '../../../priorities/priorityUtils';
import { useReminders } from '../../../reminders/reminderStore';
import { ReminderPanel } from '../../../reminders/ReminderPanel';
import { ChartBuilderConfig } from '../../components/chart-builder/types';
import { AIChartCard } from '../../components/AIChartCard';

// --- Types ---
export interface Column {
    id: string;
    label: string;
    type: string;
    width: number;
    minWidth: number;
    resizable: boolean;
    options?: { id: string; label: string; color: string }[]; // For status/priority/select
}

export interface Row {
    id: string;
    [key: string]: any;
}

interface RoomTableProps {
    roomId: string;
    viewId: string;
    defaultColumns?: Column[];
    tasks?: any[];
    columns?: Column[];
    onUpdateTasks?: (tasks: any[]) => void;
}

// --- Helpers ---
const formatDate = (date: string | null): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date; // Return raw string if invalid instead of crashing
        return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(d);
    } catch (e) {
        return date || '';
    }
};

const formatPriorityLabel = (value: string | null): PriorityLevel | null => normalizePriority(value);
const getPriorityColor = (priority: string | null) => getPriorityClasses(priority).text;
const getPriorityDot = (priority: string | null) => getPriorityClasses(priority).dot;

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
    onSelect: (p: PriorityLevel | null) => void;
    onClose: () => void;
    current: string | null;
}> = ({ onSelect, onClose, current }) => {
    const normalizedCurrent = formatPriorityLabel(current);

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
            <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400">Task Priority</span>
            </div>
            <div className="p-1">
                {PRIORITY_LEVELS.map((label) => {
                    const colors = getPriorityClasses(label);
                    const isActive = normalizedCurrent === label;
                    return (
                        <button
                            key={label}
                            onClick={() => { onSelect(label); onClose(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-start rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${isActive ? 'bg-stone-50 dark:bg-stone-800/50' : ''}`}
                        >
                            <Flag size={16} className={colors.text} fill="currentColor" fillOpacity={isActive ? 1 : 0.3} />
                            <span className="text-stone-700 dark:text-stone-200">{label}</span>
                        </button>
                    );
                })}
                <div className="h-px bg-stone-100 dark:bg-stone-800 my-1"></div>
                <button
                    onClick={() => { onSelect(null); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-start rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                    <Flag size={16} className="text-stone-400" />
                    <span className="text-stone-700 dark:text-stone-200">No priority</span>
                </button>
            </div>
        </div>
    );
};

const StatusPicker: React.FC<{
    onSelect: (s: string) => void;
    onClose: () => void;
    current: string;
}> = ({ onSelect, onClose, current }) => {
    const [customStatus, setCustomStatus] = useState('');
    const [statuses, setStatuses] = useState(['To Do', 'In Progress', 'Done']);

    const handleAddStatus = (e: React.FormEvent) => {
        e.preventDefault();
        if (customStatus.trim()) {
            setStatuses([...statuses, customStatus.trim()]);
            onSelect(customStatus.trim());
            setCustomStatus('');
            onClose();
        }
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
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
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-2 w-[220px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 p-2 gap-2"
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
                    filteredOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => { onSelect(opt.label); onClose(); }}
                            className={`w-full py-1.5 px-3 rounded text-xs font-medium text-white transition-transform active:scale-95 ${opt.color || 'bg-stone-500'}`}
                        >
                            {opt.label}
                        </button>
                    ))
                ) : (
                    <div className="py-2 text-center text-xs text-stone-400">
                        No options found
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main RoomTable Component ---
const RoomTable: React.FC<RoomTableProps> = ({ roomId, viewId, defaultColumns, tasks: externalTasks, columns: externalColumns, onUpdateTasks }) => {
    // Keys for persistence
    const storageKeyColumns = `room-table-columns-v4-${roomId}-${viewId}`;
    const storageKeyRows = `room-table-rows-v4-${roomId}-${viewId}`;

    // --- State ---
    const [columns, setColumns] = useState<Column[]>(() => {
        if (externalColumns && externalColumns.length > 0) return externalColumns;
        try {
            const saved = localStorage.getItem(storageKeyColumns);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.length > 0) return parsed;
            }

            return defaultColumns || [
                { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false },
                { id: 'name', label: 'Name', type: 'text', width: 320, minWidth: 200, resizable: true },
                { id: 'status', label: 'Status', type: 'status', width: 140, minWidth: 100, resizable: true },
                { id: 'dueDate', label: 'Due date', type: 'date', width: 140, minWidth: 100, resizable: true },
                { id: 'priority', label: 'Priority', type: 'priority', width: 140, minWidth: 100, resizable: true, options: PRIORITY_LEVELS.map(p => ({ id: p.toLowerCase(), label: p, color: getPriorityDot(p) })) },
            ];
        } catch {
            return defaultColumns || [
                { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false },
                { id: 'name', label: 'Name', type: 'text', width: 320, minWidth: 200, resizable: true },
                { id: 'status', label: 'Status', type: 'status', width: 140, minWidth: 100, resizable: true },
                { id: 'dueDate', label: 'Due date', type: 'date', width: 140, minWidth: 100, resizable: true },
                { id: 'priority', label: 'Priority', type: 'priority', width: 140, minWidth: 100, resizable: true, options: PRIORITY_LEVELS.map(p => ({ id: p.toLowerCase(), label: p, color: getPriorityDot(p) })) },
            ];
        }
    });

    const [rows, setRows] = useState<Row[]>(() => {
        if (externalTasks && externalTasks.length > 0) return externalTasks;
        try {
            const saved = localStorage.getItem(storageKeyRows);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Pinned Charts State
    const storageKeyPinnedCharts = `room-table-pinned-charts-${roomId}-${viewId}`;
    const [pinnedCharts, setPinnedCharts] = useState<ChartBuilderConfig[]>(() => {
        try {
            const saved = localStorage.getItem(storageKeyPinnedCharts);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Persist Pinned Charts
    useEffect(() => {
        localStorage.setItem(storageKeyPinnedCharts, JSON.stringify(pinnedCharts));
    }, [pinnedCharts, storageKeyPinnedCharts]);

    // Reset pagination when rows change length significantly (optional, but good UX)
    useEffect(() => {
        if (currentPage > 1 && rows.length < (currentPage - 1) * rowsPerPage) {
            setCurrentPage(1);
        }
    }, [rows.length, rowsPerPage, currentPage]);

    // Sync from props if they change (only if they are actually different to avoid focus loss)
    useEffect(() => {
        if (externalColumns && externalColumns.length > 0) {
            setColumns(prev => {
                const isSame = JSON.stringify(prev) === JSON.stringify(externalColumns);
                return isSame ? prev : externalColumns;
            });
        }
    }, [externalColumns]);

    useEffect(() => {
        if (externalTasks) {
            setRows(prev => {
                // If the pointer is the same, do nothing. 
                // If contents are effectively managed by parent, this prop update 
                // ensures we stay in sync without triggering focus loss if React 
                // is smart enough, but deep comparison or strict reference checking 
                // is safer.
                return prev === externalTasks ? prev : externalTasks;
            });
        }
    }, [externalTasks]);

    const { groupedByItem: remindersByItem, addReminder, updateReminder, deleteReminder } = useReminders(roomId);
    const [activeReminderTarget, setActiveReminderTarget] = useState<{ rowId: string; rect: DOMRect } | null>(null);
    const activeReminderRow = useMemo(() => activeReminderTarget ? rows.find(r => r.id === activeReminderTarget.rowId) : null, [activeReminderTarget, rows]);
    const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
    const [sortConfig, setSortConfig] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null);

    const [newTaskName, setNewTaskName] = useState('');
    const [activeCell, setActiveCell] = useState<{ rowId: string, colId: string, rect?: DOMRect } | null>(null);
    const [activeColumnMenu, setActiveColumnMenu] = useState<{ rect: DOMRect } | null>(null);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    const [isAIReportModalOpen, setIsAIReportModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag & Drop State
    const dragItem = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dropTarget, setDropTarget] = useState<{ index: number, position: 'top' | 'bottom' } | null>(null);

    // Column Resize State
    const resizingColId = useRef<string | null>(null);
    const startX = useRef<number>(0);
    const startWidth = useRef<number>(0);

    // Persistence Effects
    useEffect(() => {
        if (!externalColumns) {
            localStorage.setItem(storageKeyColumns, JSON.stringify(columns));
        }
    }, [columns, storageKeyColumns, externalColumns]);

    useEffect(() => {
        if (!externalTasks) {
            localStorage.setItem(storageKeyRows, JSON.stringify(rows));
        }
    }, [rows, storageKeyRows, externalTasks]);

    // Click Outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveCell(null);
        };
        if (activeCell) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [activeCell]);

    const filteredRows = useMemo(() => {
        return rows.filter(r => priorityFilter === 'all' || formatPriorityLabel(r.priority) === priorityFilter);
    }, [rows, priorityFilter]);

    const sortedRows = useMemo(() => {
        if (!sortConfig) return filteredRows;
        return [...filteredRows].sort((a, b) => {
            const aVal = a[sortConfig.columnId];
            const bVal = b[sortConfig.columnId];

            if (sortConfig.columnId === 'priority') {
                const result = comparePriority(aVal, bVal);
                return sortConfig.direction === 'asc' ? result : -result;
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredRows, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return sortedRows.slice(start, start + rowsPerPage);
    }, [sortedRows, currentPage, rowsPerPage]);

    const handleAddPinnedChart = (config: ChartBuilderConfig) => {
        setPinnedCharts(prev => [...prev, config]);
        // Ideally show a toast here
    };

    const handleDeletePinnedChart = (index: number) => {
        setPinnedCharts(prev => prev.filter((_, i) => i !== index));
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Handlers ---

    // --- Handlers ---
    const handleAddTask = () => {
        if (!newTaskName.trim()) return;

        // Find the "primary" column to put the task name in
        const primaryCol = columns.find(c => c.id === 'name') || columns.find(c => c.id !== 'select') || { id: 'name' };

        const newRow: Row = {
            id: Date.now().toString(),
            [primaryCol.id]: newTaskName,
            status: 'To Do',
            dueDate: null,
            priority: null
        };

        // Initialize other columns with null/empty
        columns.forEach(col => {
            if (col.id !== 'select' && !newRow.hasOwnProperty(col.id)) {
                newRow[col.id] = null;
            }
        });
        const updatedRows = [...rows, newRow];
        setRows(updatedRows);
        setNewTaskName('');
        if (onUpdateTasks) onUpdateTasks(updatedRows);
    };


    const handleUpdateRow = (id: string, updates: Partial<Row>) => {
        // Clear any pending debounced updates to ensure we send the latest state immediately
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }
        const updatedRows = rows.map(r => r.id === id ? { ...r, ...updates } : r);
        setRows(updatedRows);
        if (onUpdateTasks) onUpdateTasks(updatedRows);
    };

    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTextChange = (id: string, colId: string, value: string) => {
        const updatedRows = rows.map(r => r.id === id ? { ...r, [colId]: value } : r);
        setRows(updatedRows);

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
            if (onUpdateTasks) onUpdateTasks(updatedRows);
        }, 800);
    };

    const handleDeleteRow = (id: string) => {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        const updatedRows = rows.filter(r => r.id !== id);
        setRows(updatedRows);
        if (onUpdateTasks) onUpdateTasks(updatedRows);
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
    };

    // Drag and Drop
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (dragItem.current === null || dragItem.current === index) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const mid = (rect.bottom - rect.top) / 2;
        const clientY = e.clientY - rect.top;
        const position = clientY < mid ? 'top' : 'bottom';

        if (dropTarget?.index !== index || dropTarget?.position !== position) {
            setDropTarget({ index, position });
        }
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        setIsDragging(false);
        setDropTarget(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (dragItem.current !== null && dropTarget) {
            const copy = [...rows];
            const [draggedItem] = copy.splice(dragItem.current, 1);

            let insertIndex = dropTarget.index;
            if (dropTarget.position === 'bottom') insertIndex += 1;
            if (dragItem.current < insertIndex) insertIndex -= 1;

            copy.splice(insertIndex, 0, draggedItem);
            setRows(copy);
            if (onUpdateTasks) onUpdateTasks(copy);
        }
        handleDragEnd();
    };

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

    const handleSort = (colId: string) => {
        if (sortConfig?.columnId === colId) {
            setSortConfig({
                columnId: colId,
                direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
            });
        } else {
            setSortConfig({ columnId: colId, direction: 'asc' });
        }
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // 1. Get ALL data as an array of arrays.
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (!rawData || rawData.length === 0) {
                    alert("The file appears to be empty.");
                    return;
                }

                // 2. Scan for the Header Row
                let headerRowIndex = -1;
                let maxMatches = 0;

                // Scan first 20 rows
                for (let i = 0; i < Math.min(20, rawData.length); i++) {
                    const row = rawData[i];
                    if (!Array.isArray(row)) continue;

                    let matches = 0;
                    row.forEach((cell: any) => {
                        if (cell && typeof cell === 'string') {
                            const cellVal = cell.trim().toLowerCase();
                            if (columns.some(col =>
                                col.id.toLowerCase() === cellVal ||
                                col.label.toLowerCase() === cellVal
                            )) {
                                matches++;
                            }
                        }
                    });

                    if (matches > maxMatches) {
                        maxMatches = matches;
                        headerRowIndex = i;
                    }
                }

                // If no strong match found, default to 0
                if (headerRowIndex === -1) headerRowIndex = 0;

                // 3. Extract Headers and Data
                const headerRow = rawData[headerRowIndex] || [];
                const dataRows = rawData.slice(headerRowIndex + 1);

                if (dataRows.length === 0) {
                    alert(`Found header at row ${headerRowIndex + 1}, but no data rows followed it.`);
                    return;
                }

                // 4. Build Column Mapping (Try to match logic)
                const columnMapping: Record<string, number> = {};
                const unmatchedHeaderIndices: number[] = [];

                // Track which existing columns have been matched
                const matchedColIds = new Set<string>();

                headerRow.forEach((headerVal: any, index: number) => {
                    let matchedColId: string | null = null;
                    const hStr = String(headerVal).trim();
                    const hLower = hStr.toLowerCase();

                    // Match against existing columns
                    for (const col of columns) {
                        if (col.id === 'select') continue;
                        if (col.id.toLowerCase() === hLower || col.label.toLowerCase() === hLower) {
                            matchedColId = col.id;
                            break;
                        }
                    }

                    if (matchedColId) {
                        columnMapping[matchedColId] = index;
                        matchedColIds.add(matchedColId);
                    } else {
                        unmatchedHeaderIndices.push(index);
                    }
                });


                let newColumns = [...columns];
                let isBlindImport = false;

                // If FEW matches were found (blind-ish import), or user requested "expand/rename mode" behavior (implicit)
                // We will reuse existing columns in order, RENAMING them if they weren't strictly matched.

                if (matchedColIds.size === 0 && headerRow.length > 0) {
                    isBlindImport = true;
                    // Reset mapping for blind import
                    const blindMapping: Record<string, number> = {};

                    // Filter out 'select' from consideration for mapping
                    const visualColumns = columns.filter(c => c.id !== 'select');

                    headerRow.forEach((hVal: any, i: number) => {
                        const headerLabel = String(hVal || `Column ${i + 1}`).trim();

                        if (i < visualColumns.length) {
                            // Map to EXISTING column, and RENAME it
                            const existingCol = visualColumns[i];
                            blindMapping[existingCol.id] = i;

                            // Update the column definition to have the new label
                            newColumns = newColumns.map(c =>
                                c.id === existingCol.id
                                    ? { ...c, label: headerLabel }
                                    : c
                            );
                        } else {
                            // Create NEW column
                            const newId = headerLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '') + '_' + Date.now() + '_' + i;
                            const newCol: Column = {
                                id: newId,
                                label: headerLabel,
                                type: 'text',
                                width: 150,
                                minWidth: 100,
                                resizable: true
                            };
                            newColumns.push(newCol);
                            blindMapping[newId] = i;
                        }
                    });

                    // Use the blind mapping
                    Object.assign(columnMapping, blindMapping);
                } else {
                    // Standard Import with potential Expansion
                    // For any file header that didn't match an existing column, create a NEW column
                    unmatchedHeaderIndices.forEach(idx => {
                        const headerLabel = String(headerRow[idx] || `Column ${idx + 1}`).trim();
                        // Skip empty headers unless they have data? 
                        if (!headerLabel) return;

                        const newId = headerLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '') + '_' + Date.now() + '_' + idx;
                        const newCol: Column = {
                            id: newId,
                            label: headerLabel,
                            type: 'text',
                            width: 150,
                            minWidth: 100,
                            resizable: true
                        };
                        newColumns.push(newCol);
                        columnMapping[newId] = idx;
                    });
                }

                // 5. Create Rows
                const newRows: Row[] = [];
                dataRows.forEach((rowArray, index) => {
                    if (!rowArray || rowArray.length === 0) return;
                    if (rowArray.every((cell: any) => cell == null || cell === '')) return;

                    const row: Row = { id: (Date.now() + index).toString() };
                    let hasData = false;

                    newColumns.forEach(col => {
                        if (col.id === 'select') return;

                        const colIndex = columnMapping[col.id];
                        if (colIndex !== undefined && rowArray[colIndex] !== undefined) {
                            row[col.id] = rowArray[colIndex];
                            hasData = true;
                        } else {
                            row[col.id] = null;
                        }
                    });

                    if (hasData) {
                        newRows.push(row);
                    }
                });

                if (newRows.length > 0) {
                    if (isBlindImport) {
                        const confirmBlind = window.confirm(
                            `We couldn't match valid columns, so we renamed your existing columns and added new ones to match the file.\n\n` +
                            `Detected Headers: ${headerRow.join(', ')}\n\n` +
                            `Proceed?`
                        );
                        if (!confirmBlind) return;
                    }

                    setColumns(newColumns); // Update columns first
                    const updatedRows = [...rows, ...newRows];
                    setRows(updatedRows);
                    if (onUpdateTasks) onUpdateTasks(updatedRows);
                    alert(`Successfully imported ${newRows.length} rows and updated columns.`);
                } else {
                    alert("No valid data rows found.");
                }

            } catch (error) {
                console.error("Import failed:", error);
                alert("Failed to parse file. Please ensure it is a valid Excel or CSV file.");
            }
        };
        reader.onerror = () => {
            alert("Error reading file.");
        };
        reader.readAsArrayBuffer(file);
        // Reset input
        e.target.value = '';
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

    // --- Rendering Helpers ---
    const renderCellContent = (col: Column, row: Row) => {
        const value = row[col.id];

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
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && (
                        <StatusPicker
                            current={value}
                            onSelect={(s) => handleUpdateRow(row.id, { [col.id]: s })}
                            onClose={() => setActiveCell(null)}
                        />
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
                        >
                            <SharedDatePicker
                                selectedDate={value}
                                onSelectDate={(dueDate) => handleUpdateRow(row.id, { [col.id]: dueDate.toISOString() })}
                                onClear={() => handleUpdateRow(row.id, { [col.id]: null })}
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

        if (col.type === 'dropdown') {
            const selectedOption = col.options?.find(o => o.label === value);
            const bgColor = selectedOption?.color || 'bg-stone-500';

            return (
                <div className="relative w-full h-full p-1">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className={`w-full h-full rounded flex items-center justify-center px-2 hover:opacity-80 transition-opacity ${value ? bgColor : 'hover:bg-stone-100 dark:hover:bg-stone-800/50'}`}
                    >
                        {value ? (
                            <span className="text-xs font-medium text-white truncate">{value}</span>
                        ) : (
                            <span className="text-xs text-stone-400">Select Option</span>
                        )}
                    </button>
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && (
                        <SelectPicker
                            options={col.options || []}
                            current={value}
                            onSelect={(s) => handleUpdateRow(row.id, { [col.id]: s })}
                            onClose={() => setActiveCell(null)}
                        />
                    )}
                </div>
            );
        }

        if (col.type === 'priority') {
            const normalized = formatPriorityLabel(value);
            const classes = getPriorityClasses(value);
            return (
                <div className="relative w-full h-full">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden"
                    >
                        {normalized ? (
                            <div className="flex items-center gap-2 truncate">
                                <span className={`w-2 h-2 rounded-full ${classes.dot}`} />
                                <span className={`text-sm font-sans truncate ${classes.text}`}>{normalized}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-stone-400">Set Priority</span>
                        )}
                    </button>
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && (
                        <PriorityPicker
                            current={normalized}
                            onSelect={(p) => handleUpdateRow(row.id, { [col.id]: p || null })}
                            onClose={() => setActiveCell(null)}
                        />
                    )}
                </div>
            );
        }

        if (col.id === 'name') {
            return (
                <div className="h-full flex items-center px-3 overflow-hidden gap-1.5 w-full">
                    {row.priority && <span className={`shrink-0 w-2 h-2 rounded-full mt-0.5 ${getPriorityDot(row.priority)}`} />}
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleTextChange(row.id, col.id, e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm font-sans text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:bg-stone-50 dark:focus:bg-stone-800/50 transition-colors py-1"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveReminderTarget({ rowId: row.id, rect: e.currentTarget.getBoundingClientRect() });
                        }}
                        className={`shrink-0 p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${remindersByItem[row.id]?.length ? 'text-amber-600' : 'text-stone-300'}`}
                        title={remindersByItem[row.id]?.length ? 'Manage reminders' : 'Add reminder'}
                    >
                        <div className="relative flex items-center">
                            <Bell size={13} />
                            {remindersByItem[row.id]?.length ? (
                                <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${remindersByItem[row.id].some(r => r.status === 'triggered') ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            ) : null}
                        </div>
                    </button>
                </div>
            )
        }

        // Default Text Cell
        return (
            <div className="h-full w-full">
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => handleTextChange(row.id, col.id, e.target.value)}
                    className="w-full h-full bg-transparent border-none outline-none px-3 text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400 focus:bg-stone-50 dark:focus:bg-stone-800/50 transition-colors"
                />
            </div>
        )
    };

    return (
        <div className="flex flex-col w-full h-full bg-stone-50 dark:bg-stone-900/50 font-sans">
            {/* Secondary Toolbar */}
            <div className="flex items-center justify-between h-12 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4">
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <Layers size={14} className="text-stone-400" />
                        <span>Group: None</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <ListTree size={14} className="text-stone-400" />
                        <span>Subtasks</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    >
                        <Download size={14} className="text-stone-400" />
                        <span>Import</span>
                    </button>
                    <button
                        onClick={() => setIsChartModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                        <BarChart3 size={13} />
                        <span>Generate Chart</span>
                    </button>
                    <button
                        onClick={() => setIsAIReportModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm shadow-indigo-200"
                    >
                        <Sparkles size={13} />
                        <span>AI Report</span>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <Filter size={14} className="text-stone-400" />
                        <span>Filter</span>
                    </button>
                    <div className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full px-2 py-1.5 bg-white dark:bg-stone-900">
                        <span className="px-1 text-[11px] uppercase tracking-wide text-stone-400">Priority</span>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as any)}
                            className="bg-transparent outline-none border-none text-xs text-stone-700 dark:text-stone-200"
                        >
                            <option value="all">All</option>
                            {PRIORITY_LEVELS.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <CheckCircle2 size={14} className="text-stone-400" />
                        <span>Closed</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <Users size={14} className="text-stone-400" />
                        <span>Assignee</span>
                    </button>
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-stone-900">
                        M
                    </div>
                    <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 mx-2" />
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-8 pr-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 bg-transparent border border-stone-200 dark:border-stone-700 rounded-lg w-40 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors"
                        />
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-stone-400" size={14} />
                    </div>
                </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto overflow-x-auto bg-white dark:bg-stone-900 relative overscroll-y-contain">
                {/* Pinned Charts Section */}
                {pinnedCharts.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-stone-50/50 dark:bg-stone-900/30 border-b border-stone-100 dark:border-stone-800">
                        {pinnedCharts.map((config, idx) => (
                            <AIChartCard
                                key={idx}
                                config={config}
                                columns={columns}
                                rows={rows}
                                onDelete={() => handleDeletePinnedChart(idx)}
                            />
                        ))}
                    </div>
                )}

                {/* Table Header */}
                <div className="flex items-center border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 h-10 flex-shrink-0 sticky top-0 z-20 min-w-max">
                    {columns.map((col, index) => (
                        <div
                            key={col.id}
                            style={{ width: col.width }}
                            className={`
              h-full flex items-center text-xs font-sans font-medium text-stone-500 dark:text-stone-400 shrink-0
              ${col.id === 'select' ? 'justify-center px-0' : 'px-3'}
              ${index !== columns.length - 1 ? 'border-e border-stone-200/50 dark:border-stone-800' : ''}
              hover:bg-stone-100 dark:hover:bg-stone-800 ${col.id === 'priority' ? 'cursor-pointer' : 'cursor-default'} transition-colors select-none relative group
            `}
                            onClick={() => col.id === 'priority' ? handleSort(col.id) : undefined}
                        >
                            {col.id === 'select' && (
                                <div className="w-3.5 h-3.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 hover:border-stone-400 transition-colors" />
                            )}
                            {col.id !== 'select' && (
                                <div className="flex items-center justify-between w-full px-2">
                                    <span className="truncate flex-1">{col.label}</span>
                                    {col.id === 'priority' && (
                                        <ArrowUpDown size={12} className={`${sortConfig?.columnId === col.id ? 'text-stone-600 dark:text-stone-200' : 'text-stone-400'}`} />
                                    )}
                                    {!['name', 'select'].includes(col.id) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.id); }}
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
                                    onMouseDown={(e) => startResize(e, col.id, col.width)}
                                />
                            )}
                        </div>
                    ))}
                    {/* Add Column Button */}
                    <div className="relative h-full flex flex-col justify-center shrink-0">
                        <button
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveColumnMenu({ rect });
                            }}
                            className="flex items-center justify-center w-8 h-full border-s border-stone-200/50 dark:border-stone-800 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                        {activeColumnMenu && createPortal(
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-[90] bg-transparent"
                                    onClick={() => setActiveColumnMenu(null)}
                                />
                                {/* Dropdown Menu */}
                                <div
                                    className="fixed z-[100]"
                                    style={{
                                        top: `${activeColumnMenu.rect.bottom + 8}px`,
                                        right: `${window.innerWidth - activeColumnMenu.rect.right}px`,
                                    }}
                                >
                                    <ColumnMenu
                                        onClose={() => setActiveColumnMenu(null)}
                                        onSelect={(type, label, options) => handleAddColumn(type, label, options)}
                                    />
                                </div>
                            </>,
                            document.body
                        )}
                    </div>
                </div>

                {/* Tasks */}
                {
                    paginatedRows.map((row, index) => (
                        <div
                            key={row.id}
                            className={`
                group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 
                hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors relative min-w-max
                ${isDragging && dragItem.current === index ? 'opacity-40' : ''}
             `}
                            onDrop={handleDrop}
                            onDragOver={(e) => handleDragOver(e, index)}
                        >
                            {/* Drop Indicators */}
                            {isDragging && dropTarget?.index === index && (
                                <div
                                    className={`absolute left-0 right-0 h-[2px] bg-stone-900 dark:bg-stone-100 z-50 pointer-events-none ${dropTarget.position === 'top' ? 'top-0' : 'bottom-0'}`}
                                >
                                    <div className="absolute left-0 w-1.5 h-1.5 bg-stone-900 dark:bg-stone-100 rounded-full -translate-x-1/2 -translate-y-[1px]" />
                                </div>
                            )}

                            {columns.map(col => (
                                <div
                                    key={col.id}
                                    style={{ width: col.width }}
                                    draggable={col.id === 'select'}
                                    onDragStart={(e) => {
                                        if (col.id === 'select') handleDragStart(e, index);
                                    }}
                                    onDragEnd={handleDragEnd}
                                    className={`h-full border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800 ${col.id === 'select' ? 'flex items-center justify-center cursor-grab active:cursor-grabbing' : ''}`}
                                >
                                    {col.id === 'select' ? (
                                        <>
                                            <div className="hidden group-hover:flex text-stone-300">
                                                <GripVertical size={14} />
                                            </div>
                                            <div className="group-hover:hidden w-3.5 h-3.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 hover:border-stone-400 cursor-pointer" />
                                        </>
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
                    ))
                }

                {/* Input Row */}
                <div className="group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors focus-within:bg-stone-50 dark:focus-within:bg-stone-800/50 min-w-max">
                    <div style={{ width: columns[0].width }} className="h-full flex items-center justify-center border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800">
                        <Plus size={14} className="text-stone-300 dark:text-stone-600" />
                    </div>
                    <div style={{ width: columns[1].width }} className="h-full flex items-center px-3 border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800">
                        <input
                            type="text"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            placeholder="Start typing..."
                            className="w-full bg-transparent border-none outline-none text-sm font-serif placeholder:text-stone-400 text-stone-800 dark:text-stone-200 p-0"
                        />
                    </div>
                    {/* Empty cells for Input Row */}
                    {columns.slice(2).map(col => (
                        <div key={col.id} style={{ width: col.width }} className="h-full border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800" />
                    ))}
                    <div className="w-8 h-full border-s border-stone-100/50 dark:border-stone-800" />
                    <div className="w-8 h-full border-s border-stone-100/50 dark:border-stone-800" />
                </div>

            </div >

            {/* Pagination Footer */}
            <div className="flex items-center justify-between p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-stone-500 dark:text-stone-400">Rows per page:</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <div className="flex items-center gap-4 text-stone-600 dark:text-stone-400">
                    <span>
                        Page {currentPage} of {Math.max(1, totalPages)}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
            {activeReminderTarget && (
                <PortalPopup
                    triggerRef={{ current: { getBoundingClientRect: () => activeReminderTarget.rect } } as any}
                    onClose={() => setActiveReminderTarget(null)}
                    side="bottom"
                >
                    <ReminderPanel
                        itemId={activeReminderTarget.rowId}
                        itemTitle={activeReminderRow?.name}
                        reminders={remindersByItem[activeReminderTarget.rowId] || []}
                        onAdd={(remindAt, kind, label) => addReminder({
                            itemId: activeReminderTarget.rowId,
                            boardId: roomId,
                            itemTitle: activeReminderRow?.name,
                            remindAt,
                            kind,
                            relativeLabel: label
                        })}
                        onDelete={deleteReminder}
                        onUpdateStatus={(id, status) => updateReminder(id, { status })}
                    />
                </PortalPopup>
            )}

            <ChartBuilderModal
                isOpen={isChartModalOpen}
                onClose={() => setIsChartModalOpen(false)}
                columns={columns}
                rows={rows}
                onSave={(config) => {
                    console.log('Chart Config Saved:', config);
                    setIsChartModalOpen(false);
                }}
            />

            <AIReportModal
                isOpen={isAIReportModalOpen}
                onClose={() => setIsAIReportModalOpen(false)}
                columns={columns}
                rows={rows}
                onAddChart={handleAddPinnedChart}
            />
        </div >
    );
};

export default RoomTable;
