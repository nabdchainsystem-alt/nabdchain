import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { ChartBuilderModal } from '../../components/chart-builder/ChartBuilderModal';
import { AIReportModal } from '../../components/AIReportModal';
import { SharedDatePicker } from '../../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import { PeoplePicker } from '../../components/cells/PeoplePicker';
import { SaveToVaultModal } from '../../../dashboard/components/SaveToVaultModal';
import { vaultService } from '../../../../services/vaultService';
import { VaultItem } from '../../../vault/types';
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
    ChevronDown,
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
    FileText,
    UploadCloud,
    ExternalLink,
    CalendarRange,
    EyeOff,
    UserCircle,
    MoreHorizontal
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
    pinned?: boolean;
    options?: { id: string; label: string; color: string }[]; // For status/priority/select
}

const DEFAULT_COLUMNS: Column[] = [
    { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false },
    { id: 'name', label: 'Name', type: 'text', width: 320, minWidth: 200, resizable: true },
    { id: 'people', label: 'People', type: 'people', width: 120, minWidth: 100, resizable: true },
    { id: 'status', label: 'Status', type: 'status', width: 140, minWidth: 100, resizable: true },
    { id: 'priority', label: 'Priority', type: 'priority', width: 140, minWidth: 100, resizable: true },
    { id: 'date', label: 'Date', type: 'date', width: 140, minWidth: 120, resizable: true },
    { id: 'dueDate', label: 'Due Date', type: 'date', width: 140, minWidth: 120, resizable: true },
];

export interface Row {
    id: string;
    [key: string]: any;
}

interface RoomTableProps {
    roomId: string;
    viewId: string;
    defaultColumns?: Column[];
    tasks?: any[];
    name?: string;
    columns?: Column[];
    onUpdateTasks?: (tasks: any[]) => void;
    onNavigate?: (view: string) => void;
    renderCustomActions?: (props: {
        setRows: React.Dispatch<React.SetStateAction<Row[]>>;
        setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
        setIsChartModalOpen: (open: boolean) => void;
        setIsAIReportModalOpen: (open: boolean) => void;
    }) => React.ReactNode;
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
            className="fixed z-[9999] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 min-w-[180px]"
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
const RoomTable: React.FC<RoomTableProps> = ({ roomId, viewId, defaultColumns, tasks: externalTasks, columns: externalColumns, onUpdateTasks, renderCustomActions, onNavigate }) => {
    // Keys for persistence
    const storageKeyColumns = `room-table-columns-v7-${roomId}-${viewId}`;
    const storageKeyRows = `room-table-rows-v7-${roomId}-${viewId}`;

    // --- DnD Sensors ---
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts prevents accidental drags on clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- State ---
    const [columns, setColumns] = useState<Column[]>(() => {
        if (externalColumns && externalColumns.length > 0) return externalColumns;
        try {
            const saved = localStorage.getItem(storageKeyColumns);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.length > 0) return parsed;
            }
            return DEFAULT_COLUMNS;
        } catch {
            return DEFAULT_COLUMNS;
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
    const [activeCell, setActiveCell] = useState<{ rowId: string, colId: string, trigger?: HTMLElement } | null>(null);
    const [activeColumnMenu, setActiveColumnMenu] = useState<{ rect: DOMRect } | null>(null);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    const [isAIReportModalOpen, setIsAIReportModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // File Upload State
    const [activeUploadCell, setActiveUploadCell] = useState<{ rowId: string, colId: string } | null>(null);
    const [activeUploadFile, setActiveUploadFile] = useState<File | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const hiddenFileInputRef = useRef<HTMLInputElement>(null);

    // Drag & Drop State
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    // Column Resize State
    const resizingColId = useRef<string | null>(null);
    const startX = useRef<number>(0);
    const startWidth = useRef<number>(0);

    // Toolbar State
    const [isBodyVisible, setIsBodyVisible] = useState(true);

    // Virtualization State
    const [scrollTop, setScrollTop] = useState(0);
    const tableBodyRef = useRef<HTMLDivElement>(null);
    const ROW_HEIGHT = 40; // h-10 = 40px

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
    const isAllRows = rowsPerPage === -1;
    const totalPages = isAllRows ? 1 : Math.ceil(sortedRows.length / rowsPerPage);
    const paginatedRows = useMemo(() => {
        if (isAllRows) return sortedRows;
        const start = (currentPage - 1) * rowsPerPage;
        return sortedRows.slice(start, start + rowsPerPage);
    }, [sortedRows, currentPage, rowsPerPage, isAllRows]);

    // Virtualization Calculation
    const { visibleRows, paddingTop, paddingBottom } = useMemo(() => {
        const totalRows = paginatedRows.length;
        const containerHeight = tableBodyRef.current?.clientHeight || 800; // Estimate
        const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5); // 5 rows buffer above
        const endIndex = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + 5); // 5 rows buffer below

        const visible = paginatedRows.slice(startIndex, endIndex);
        const paddingTop = startIndex * ROW_HEIGHT;
        const paddingBottom = (totalRows - endIndex) * ROW_HEIGHT;

        return { visibleRows: visible, paddingTop, paddingBottom };
    }, [paginatedRows, scrollTop]);

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
    const handleCellAction = (action: string, rowId: string, colId: string, value?: any) => {
        if (action === 'navigate') {
            // Navigate to Vault with folder/highlight
            const row = rows.find(r => r.id === rowId);
            if (!row) return;
            const fileData = row[colId];

            const targetFolderId = fileData?.folderId || 'root';
            const targetHighlightId = fileData?.id;

            const params = new URLSearchParams();
            if (targetFolderId) params.set('folder', targetFolderId);
            if (targetHighlightId) params.set('highlight', targetHighlightId);

            const url = `/vault?${params.toString()}`;

            if (onNavigate) {
                window.history.pushState({}, '', url);
                onNavigate('vault');
            } else {
                window.location.href = url;
            }
        } else if (action === 'upload') {
            const row = rows.find(r => r.id === rowId);
            if (!row) return;
            setActiveUploadCell({ rowId, colId });
            setActiveUploadFile(null); // Reset
            setIsUploadModalOpen(true);
        }
    };

    const handleHiddenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setActiveUploadFile(e.target.files[0]);
            setIsUploadModalOpen(true);
        }
        // Reset input value so same file can be selected again
        e.target.value = '';
    };

    const handleSaveVaultSuccess = (item: VaultItem) => {
        if (activeUploadCell) {
            handleUpdateRow(activeUploadCell.rowId, { [activeUploadCell.colId]: item });
        }
        setIsUploadModalOpen(false);
        setActiveUploadCell(null);
        setActiveUploadFile(null);
    };



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
            date: new Date().toISOString(),
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
            const trigger = e.currentTarget as HTMLElement;
            const triggerRect = trigger.getBoundingClientRect();

            // Find the column to check if it's a date/timeline type
            const col = columns.find(c => c.id === colId);
            const isDateColumn = col?.type === 'date' || col?.type === 'timeline' || col?.type === 'dueDate';

            // Check if calendar would overflow (calendar is ~420px wide)
            const CALENDAR_WIDTH = 420;
            const VIEWPORT_PADDING = 20;
            const availableSpace = window.innerWidth - triggerRect.left;

            // If it's a date column near the right edge, auto-scroll the table
            if (isDateColumn && availableSpace < CALENDAR_WIDTH + VIEWPORT_PADDING && tableBodyRef.current) {
                const scrollAmount = CALENDAR_WIDTH - availableSpace + VIEWPORT_PADDING + 50; // Extra 50px buffer

                // Smooth scroll the table to the left
                tableBodyRef.current.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });

                // Delay setting activeCell to allow scroll animation to complete
                setTimeout(() => {
                    setActiveCell({ rowId, colId, trigger });
                }, 150);
            } else {
                setActiveCell({ rowId, colId, trigger });
            }
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

    const handleDragStart = (event: DragStartEvent) => {
        if (sortConfig) return; // Disable DnD when sorting is active
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id !== over.id) {
            setRows((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                // If indices found
                if (oldIndex !== -1 && newIndex !== -1) {
                    const newRows = arrayMove(items, oldIndex, newIndex);
                    if (onUpdateTasks) onUpdateTasks(newRows);
                    return newRows;
                }
                return items;
            });
        }
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
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.trigger && (
                        <PortalPopup
                            triggerRef={{ current: activeCell.trigger } as any}
                            align={columns.findIndex(c => c.id === col.id) > (columns.length / 2) ? 'end' : 'start'}
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

        // --- RENDER CELL CONTENT ---
        // This is the actual renderCellContent function that is used.
        // The previous one was incomplete and followed by the misplaced handleCellAction.

        if (col.type === 'people') {
            return (
                <div className="relative w-full h-full">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden group"
                    >
                        {value ? (
                            <div className="flex items-center gap-2 truncate">
                                {value.avatar && <img src={value.avatar} alt={value.name} className="w-5 h-5 rounded-full object-cover bg-stone-200" />}
                                <span className="text-sm font-sans text-stone-700 dark:text-stone-300 truncate">{value.name}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-stone-400 group-hover:text-stone-500 transition-colors">Assign</span>
                        )}
                    </button>
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.trigger && (
                        <div className="fixed z-[9999]" style={{ top: activeCell.trigger.getBoundingClientRect().bottom + 4, left: activeCell.trigger.getBoundingClientRect().left }}>
                            <PeoplePicker
                                current={value}
                                onSelect={(person) => handleUpdateRow(row.id, { [col.id]: person })}
                                onClose={() => setActiveCell(null)}
                            />
                            <div className="fixed inset-0 -z-10" onClick={() => setActiveCell(null)} />
                        </div>
                    )}
                </div>
            );
        }

        if (col.type === 'files') {
            const hasFile = !!value; // Value could be file metadata or just truthy
            const fileName = value?.title || (hasFile ? 'File attached' : null);

            // Helper to get file icon based on type/extension
            const getFileIcon = (filename: string, mimeType?: string) => {
                const ext = filename?.split('.').pop()?.toLowerCase();
                const mime = mimeType?.toLowerCase() || '';

                if (ext === 'pdf' || mime.includes('pdf')) {
                    return <FileText size={14} className="text-red-500 shrink-0" />;
                } else if (['doc', 'docx'].includes(ext || '') || mime.includes('word')) {
                    return <FileText size={14} className="text-blue-600 shrink-0" />;
                } else if (['xls', 'xlsx', 'csv'].includes(ext || '') || mime.includes('spreadsheet') || mime.includes('excel')) {
                    return <FileText size={14} className="text-emerald-600 shrink-0" />;
                } else if (['ppt', 'pptx'].includes(ext || '') || mime.includes('presentation')) {
                    return <FileText size={14} className="text-orange-500 shrink-0" />;
                } else if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
                    return <FileText size={14} className="text-purple-500 shrink-0" />;
                }
                return <FileText size={14} className="text-indigo-500 shrink-0" />;
            };

            // Get short name (truncate long filenames)
            const getShortName = (name: string) => {
                if (!name) return 'File';
                if (name.length <= 15) return name;
                const ext = name.split('.').pop();
                const baseName = name.slice(0, name.lastIndexOf('.'));
                return baseName.slice(0, 10) + '...' + (ext ? '.' + ext : '');
            };

            return (
                <div className="relative w-full h-full flex items-center">
                    {hasFile ? (
                        <div className="flex items-center gap-2 w-full px-3" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCellAction('navigate', row.id, col.id);
                                }}
                                className="flex-1 flex items-center gap-2 min-w-0 p-1 hover:bg-stone-100 dark:hover:bg-stone-800/50 rounded transition-colors text-start"
                                title={`View in Vault: ${fileName}`}
                            >
                                {getFileIcon(fileName, value?.metadata?.mimeType)}
                                <span className="text-xs truncate text-stone-600 dark:text-stone-300 hover:underline decoration-stone-300 dark:decoration-stone-700 underline-offset-2">
                                    {getShortName(fileName)}
                                </span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Trigger hidden file input - file selection first, then modal opens
                                setActiveUploadCell({ rowId: row.id, colId: col.id });
                                hiddenFileInputRef.current?.click();
                            }}
                            className="w-full h-full flex items-center px-3 text-stone-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors gap-1.5"
                            title="Upload file"
                        >
                            <UploadCloud size={14} />
                            <span className="text-[10px] uppercase font-semibold tracking-wide">Upload</span>
                        </button>
                    )}
                </div>
            )
        }
        if (col.type === 'timeline') {
            // Value expected to be { start: string, end: string } or null
            // Or maybe just a string? Previous requirements said Timeline is a date range.
            // Value might be stored as object or JSON string? Let's assume object {start, end} for now or handles parsing
            // Or if it's new, we define it.
            // Standard: row[col.id] = { start: ISO, end: ISO } or null.
            const val = row[col.id];
            const startDate = val?.start ? new Date(val.start) : null;
            const endDate = val?.end ? new Date(val.end) : null;

            const label = startDate && endDate
                ? `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                : (startDate ? startDate.toLocaleDateString() : null);

            return (
                <div className="relative w-full h-full">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden group"
                    >
                        <CalendarRange size={14} className={`mr-2 shrink-0 ${val ? 'text-stone-500' : 'text-stone-300 group-hover:text-stone-400'}`} />
                        <span className={`text-sm font-sans truncate ${val ? 'text-stone-600 dark:text-stone-300' : 'text-stone-400'}`}>
                            {label || 'Set Timeline'}
                        </span>
                    </button>
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.trigger && (
                        <PortalPopup
                            triggerRef={{ current: activeCell.trigger } as any}
                            align={activeCell.trigger.getBoundingClientRect().left > window.innerWidth / 2 ? "end" : "start"}
                            onClose={() => setActiveCell(null)}
                        >
                            <SharedDatePicker
                                mode="range"
                                startDate={startDate || undefined}
                                endDate={endDate || undefined}
                                onSelectRange={(start, end) => handleUpdateRow(row.id, {
                                    [col.id]: { start: start?.toISOString(), end: end?.toISOString() }
                                })}
                                onClose={() => setActiveCell(null)}
                            />
                        </PortalPopup>
                    )}
                </div>
            );
        }

        if (col.type === 'timeline') {
            // Value expected to be { start: string, end: string } or null
            const startDate = value?.start ? new Date(value.start) : null;
            const endDate = value?.end ? new Date(value.end) : null;

            const label = startDate && endDate
                ? `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                : (startDate ? startDate.toLocaleDateString() : null);

            return (
                <div className="relative w-full h-full">
                    <button
                        onClick={(e) => toggleCell(e, row.id, col.id)}
                        className="w-full h-full flex items-center px-3 text-start hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors overflow-hidden group"
                    >
                        {label ? (
                            <div className="flex items-center gap-2 truncate">
                                <CalendarRange size={13} className="text-indigo-500" />
                                <span className="text-sm font-sans text-stone-600 dark:text-stone-300 truncate">{label}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-stone-400 group-hover:text-stone-500 transition-colors">Set Range</span>
                        )}
                    </button>
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.trigger && (
                        <PortalPopup
                            triggerRef={{ current: activeCell.trigger } as any}
                            align={activeCell.trigger.getBoundingClientRect().left > window.innerWidth / 2 ? "end" : "start"}
                            onClose={() => setActiveCell(null)}
                        >
                            <SharedDatePicker
                                mode="range"
                                startDate={startDate}
                                endDate={endDate}
                                onSelectRange={(start, end) => {
                                    handleUpdateRow(row.id, {
                                        [col.id]: {
                                            start: start?.toISOString(),
                                            end: end?.toISOString()
                                        }
                                    });
                                    // Only close if we have both? Or user clicks Done. The DatePicker handles calling onClose usually when done, 
                                    // OR we just update state and let user close.
                                    // The updated SharedDatePicker has "Done" button.
                                }}
                                onClose={() => setActiveCell(null)}
                                onClear={() => handleUpdateRow(row.id, { [col.id]: null })}
                            />
                        </PortalPopup>
                    )}
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
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.trigger && (
                        <div className="fixed z-[9999]" style={{ top: activeCell.trigger.getBoundingClientRect().bottom + 4, left: activeCell.trigger.getBoundingClientRect().left }}>
                            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden min-w-[200px]">
                                {(col.options || []).length > 0 ? (
                                    col.options!.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { handleUpdateRow(row.id, { [col.id]: opt.label }); setActiveCell(null); }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                                        >
                                            {opt.label}
                                        </button>
                                    ))
                                ) : (
                                    // Default Status Options if none provided
                                    ['To Do', 'In Progress', 'Done'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => { handleUpdateRow(row.id, { [col.id]: s }); setActiveCell(null); }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-2"
                                        >
                                            {getStatusIcon(s)}
                                            {s}
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="fixed inset-0 -z-10" onClick={() => setActiveCell(null)} />
                        </div>
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
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.trigger && (
                        <PortalPopup
                            triggerRef={{ current: activeCell.trigger } as any}
                            align={activeCell.trigger.getBoundingClientRect().left > window.innerWidth / 2 ? "end" : "start"}
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
                    {activeCell?.rowId === row.id && activeCell?.colId === col.id && activeCell.trigger && (
                        <div className="fixed z-[9999]" style={{ top: activeCell.trigger.getBoundingClientRect().bottom + 4, left: activeCell.trigger.getBoundingClientRect().left }}>
                            {/* Simple inline dropdown for generic options */}
                            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden min-w-[150px]">
                                {(col.options || []).map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { handleUpdateRow(row.id, { [col.id]: opt.label }); setActiveCell(null); }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-2"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${opt.color}`}></span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="fixed inset-0 -z-10" onClick={() => setActiveCell(null)} />
                        </div>
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

    const renderRowContent = (row: Row, dragListeners?: any, isOverlay = false) => {
        return (
            <>
                {/* Columns */}
                {columns.map((col, index) => {
                    const isSticky = (index === 0 || index === 1) && !isOverlay;
                    const leftPos = index === 0 ? 0 : index === 1 ? columns[0].width : undefined;
                    return (
                        <div
                            key={col.id}
                            style={{ width: col.width, ...(isSticky && { left: leftPos, position: 'sticky' }) }}
                            className={`h-full border-e border-transparent ${!isOverlay ? 'group-hover:border-stone-100 dark:group-hover:border-stone-800' : ''} ${col.id === 'select' ? 'flex items-center justify-center cursor-default' : ''} ${isSticky ? 'z-10 bg-white dark:bg-stone-900' : ''} ${index === 1 && !isOverlay ? 'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:shadow-[2px_0_4px_rgba(0,0,0,0.08)]' : ''}`}
                        >
                            {col.id === 'select' ? (
                                <div
                                    {...dragListeners}
                                    className="cursor-grab text-stone-300 hover:text-stone-600 flex items-center justify-center p-1 rounded hover:bg-stone-200/50 active:cursor-grabbing"
                                >
                                    <GripVertical size={14} />
                                </div>
                            ) : (
                                renderCellContent(col, row)
                            )}
                        </div>
                    );
                })}

                {/* Fixed Actions Column (Delete) */}
                <div className="w-8 h-full flex items-center justify-center text-stone-300 border-s border-stone-100/50 dark:border-stone-800">
                    {!isOverlay && (
                        <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-600 rounded transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </>
        );
    };

    const renderSummaryRow = () => {
        return (
            <div className="flex items-center h-10 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 min-w-max">
                {/* Spacer for Select - Sticky */}
                <div style={{ width: columns[0].width, left: 0, position: 'sticky' }} className="h-full border-e border-transparent z-10 bg-stone-50/50 dark:bg-stone-900/50" />
                {/* Name Column Spacer - Sticky */}
                <div style={{ width: columns[1].width, left: columns[0].width, position: 'sticky' }} className="h-full border-e border-transparent flex items-center px-3 z-10 bg-stone-50/50 dark:bg-stone-900/50 after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:shadow-[2px_0_4px_rgba(0,0,0,0.08)]">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Summary</span>
                </div>

                {columns.slice(2).map(col => {
                    if (col.type === 'status' || col.type === 'priority') {
                        // Calculate distribution
                        const counts: Record<string, number> = {};
                        let total = 0;
                        rows.forEach(r => {
                            const val = r[col.id];
                            if (val) {
                                const key = col.type === 'priority' ? formatPriorityLabel(val) || 'None' : val;
                                counts[key] = (counts[key] || 0) + 1;
                                total++;
                            }
                        });

                        return (
                            <div key={col.id} style={{ width: col.width }} className="h-full border-e border-transparent px-2 flex items-center">
                                {total > 0 ? (
                                    <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800">
                                        {Object.entries(counts).map(([key, count], idx) => {
                                            const width = (count / total) * 100;
                                            let color = 'bg-stone-400';
                                            if (col.type === 'priority') {
                                                const pClasses = getPriorityClasses(key);
                                                // Extract bg color from classes if possible, or use hardcoded map. 
                                                // getPriorityClasses returns text/dot/bg. dot usually has text color.
                                                // Let's use a mapping based on key
                                                if (key === 'Urgent') color = 'bg-rose-500';
                                                else if (key === 'High') color = 'bg-amber-500';
                                                else if (key === 'Medium') color = 'bg-blue-500';
                                                else if (key === 'Low') color = 'bg-stone-500';
                                            } else {
                                                if (key === 'Done') color = 'bg-emerald-500';
                                                else if (key === 'In Progress') color = 'bg-amber-500';
                                                else if (key === 'To Do') color = 'bg-stone-400';
                                            }

                                            return (
                                                <div key={key} style={{ width: `${width}%` }} className={`h-full ${color}`} title={`${key}: ${count}`} />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-stone-300">No data</span>
                                )}
                            </div>
                        );
                    }
                    return <div key={col.id} style={{ width: col.width }} className="h-full border-e border-transparent" />;
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full h-full bg-stone-50 dark:bg-stone-900/50 font-sans">
            {/* Header Actions - Optional if needed, currently empty/handled by parent view */}

            {/* Scrollable Container */}
            <div className="flex-1 flex flex-col min-h-0 relative">

                {/* Secondary Toolbar */}
                <div className="flex items-center justify-end h-12 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4">
                    <div className="flex items-center gap-2">
                        {renderCustomActions && renderCustomActions({
                            setRows,
                            setColumns,
                            setIsChartModalOpen,
                            setIsAIReportModalOpen
                        })}
                    </div>
                </div>

                {/* Table Body */}
                <div
                    ref={tableBodyRef}
                    onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                    className="flex-1 overflow-y-auto overflow-x-auto bg-white dark:bg-stone-900 relative overscroll-y-contain"
                >
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
                        {columns.map((col, index) => {
                            const isSticky = index === 0 || index === 1;
                            const leftPos = index === 0 ? 0 : index === 1 ? columns[0].width : undefined;
                            return (
                                <div
                                    key={col.id}
                                    style={{ width: col.width, ...(isSticky && { left: leftPos, position: 'sticky' }) }}
                                    className={`
              h-full flex items-center text-xs font-sans font-medium text-stone-500 dark:text-stone-400 shrink-0
              ${col.id === 'select' ? 'justify-center px-0' : 'px-3'}
              ${index !== columns.length - 1 ? 'border-e border-stone-200/50 dark:border-stone-800' : ''}
              hover:bg-stone-100 dark:hover:bg-stone-800 ${col.id !== 'select' ? 'cursor-pointer' : 'cursor-default'} transition-colors select-none relative group
              ${isSticky ? 'z-30 bg-stone-50 dark:bg-stone-900' : ''}
              ${index === 1 ? 'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:shadow-[2px_0_4px_rgba(0,0,0,0.1)]' : ''}
            `}
                                    onClick={() => col.id !== 'select' ? handleSort(col.id) : undefined}
                                >
                                    {col.id === 'select' && (
                                        <div className="w-3.5 h-3.5 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800 hover:border-stone-400 transition-colors" />
                                    )}
                                    {col.id !== 'select' && (
                                        <div className="flex items-center justify-between w-full px-2">
                                            <span className="truncate flex-1">{col.label}</span>
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
                            );
                        })}
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

                    {/* Spacer Top */}
                    <div style={{ height: paddingTop }} />

                    {/* Tasks */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={visibleRows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                            {visibleRows.map((row) => (
                                <SortableRow
                                    key={row.id}
                                    row={row}
                                    className={`
                                    group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 
                                    hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors relative min-w-max bg-white dark:bg-stone-900
                                    ${activeDragId === row.id ? 'opacity-30' : ''}
                                `}
                                >
                                    {(dragListeners, isRowDragging) => renderRowContent(row, dragListeners, isRowDragging)}
                                </SortableRow>
                            ))}
                        </SortableContext>

                        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                            {activeDragId ? (
                                <div className="flex items-center h-10 border border-indigo-500 bg-white dark:bg-stone-800 shadow-xl rounded pointer-events-none opacity-90 scale-105 overflow-hidden min-w-max">
                                    {(() => {
                                        const row = rows.find(r => r.id === activeDragId);
                                        if (!row) return null;
                                        return renderRowContent(row, null, true);
                                    })()}
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>

                    {/* Spacer Bottom */}
                    <div style={{ height: paddingBottom }} />

                    {/* Input Row */}
                    <div className="group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors focus-within:bg-stone-50 dark:focus-within:bg-stone-800/50 min-w-max bg-white dark:bg-stone-900">
                        <div style={{ width: columns[0].width, left: 0, position: 'sticky' }} className="h-full flex items-center justify-center border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800 z-10 bg-white dark:bg-stone-900">
                            <Plus size={14} className="text-stone-300 dark:text-stone-600" />
                        </div>
                        <div style={{ width: columns[1].width, left: columns[0].width, position: 'sticky' }} className="h-full flex items-center px-3 border-e border-transparent group-hover:border-stone-100 dark:group-hover:border-stone-800 z-10 bg-white dark:bg-stone-900 after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:shadow-[2px_0_4px_rgba(0,0,0,0.08)]">
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
                    </div>

                    <div className="h-12" />

                </div >

                {/* Pagination Footer */}
                <div className="flex items-center justify-between p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm z-30">
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
                            <option value={-1}>All</option>
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

                <SaveToVaultModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    file={activeUploadFile}
                    onSuccess={handleSaveVaultSuccess}
                />
                <input
                    type="file"
                    ref={hiddenFileInputRef}
                    className="hidden"
                    onChange={handleHiddenFileChange}
                />
            </div>
        </div>
    );
};

// --- Sortable Row Wrapper ---
interface SortableRowProps {
    row: Row;
    children: (dragListeners: any, isRowDragging: boolean) => React.ReactNode;
    className: string;
}

const SortableRow: React.FC<SortableRowProps> = ({ row, children, className }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: row.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={className} {...attributes}>
            {children(listeners, isDragging)}
        </div>
    );
};

export default RoomTable;
