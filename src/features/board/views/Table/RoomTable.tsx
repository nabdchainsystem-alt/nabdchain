import React, { useState, useRef, useCallback, useEffect, useMemo, memo, useTransition } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { boardLogger } from '../../../../utils/logger';
import { useAppContext } from '../../../../contexts/AppContext';
import { ChartBuilderModal } from '../../components/chart-builder/ChartBuilderModal';
import { AIReportModal } from '../../components/AIReportModal';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import { SharedDatePicker } from '../../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import { PeoplePicker } from '../../components/cells/PeoplePicker';
import { UrlPicker } from '../../components/cells/UrlPicker'; // Import UrlPicker
import { DocPicker } from '../../components/cells/DocPicker'; // Import DocPicker
import { ConfirmModal } from '../../components/ConfirmModal';
import { SaveToVaultModal } from '../../../dashboard/components/SaveToVaultModal';
// Force refresh
import { vaultService } from '../../../../services/vaultService';
import { VaultItem } from '../../../vault/types';
import { useToast } from '../../../marketplace/components/Toast';
import {
    Plus,
    Flag,
    CalendarBlank as CalendarIcon,
    Link as Link2,
    PushPin as Pin,
    MapPin,
    CaretLeft as ChevronLeft,
    CaretRight as ChevronRight,
    CaretDown as ChevronDown,
    DotsSixVertical as GripVertical,
    Trash,
    X,
    TreeStructure as ListTree,
    Users,
    Bell,
    DownloadSimple as Download,
    ChartBar as BarChart3,
    Sparkle as Sparkles,
    SquaresFour as LayoutGrid,
    FileText,
    UploadSimple as UploadCloud,
    ArrowSquareOut as ExternalLink,
    CalendarBlank as CalendarRange,
    DotsThree as MoreHorizontal,
    ArrowsOut as Maximize2,
    MagnifyingGlass,
    UserCircle,
    Funnel,
    ArrowsDownUp,
    EyeSlash,
    Stack,
    Copy,
    Export,
    Archive,
} from 'phosphor-react';
import { RowDetailPanel } from '../../components/RowDetailPanel';
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
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { ColumnMenu } from '../../components/ColumnMenu';
import { ExcelImportModal } from '../../components/ExcelImportModal';
import { PriorityLevel, comparePriority, normalizePriority } from '../../../priorities/priorityUtils';
import { useReminders } from '../../../reminders/reminderStore';
import { ReminderPanel } from '../../../reminders/ReminderPanel';
import { ChartBuilderConfig } from '../../components/chart-builder/types';
import { AIChartCard } from '../../components/AIChartCard';
import {
    TextCellContextMenu,
    HeaderContextMenu,
    TablePagination,
    TableHeaderCell,
    SortableRow,
    GroupDragContext,
    SortableGroupWrapper,
    GroupDragHandle,
    EditableName,
    PersonAvatarItem,
    TableCell,
    TableRowContent,
} from './components';

import {
    formatPriorityLabel,
    getPriorityDot,
    DEFAULT_CHECKBOX_COLOR,
} from './utils';

// Import from centralized types and hooks
import {
    Column,
    Row,
    TableGroup,
    GroupColor,
    FilterRule,
    SortRule,
    StatusOption,
    GROUP_COLORS,
    DEFAULT_COLUMNS,
    STATUS_STYLES,
    PRIORITY_STYLES,
    GENERIC_COLORS,
    DEFAULT_STATUSES,
    getGroupColor,
    isDoneStatus,
    sortRowsWithDoneAtBottom,
    formatDate,
} from './types';

import {
    useTableFiltering,
    useTableSelection,
    useTablePagination,
    useTableDragDrop,
    getConditionsForType,
} from './hooks';

import {
    PriorityPicker,
    StatusPicker,
    SelectPicker,
    CheckboxColorPicker,
} from './components/pickers';

// Re-export types for consumers
export type { Column, Row, TableGroup, GroupColor, FilterRule, SortRule };

interface RoomTableProps {
    roomId: string;
    viewId: string;
    defaultColumns?: Column[];
    tasks?: any[];
    name?: string;
    columns?: Column[];
    onUpdateTasks?: (tasks: any[]) => void;
    onDeleteTask?: (groupId: string, taskId: string) => void;
    onNavigate?: (view: string) => void;

    onAddGroup?: (id: string, title: string, color?: string) => void;
    onUpdateGroup?: (id: string, title: string) => void;
    onDeleteGroup?: (id: string) => void;
    onRename?: (newName: string) => void;
    renderCustomActions?: (props: {
        setRows: React.Dispatch<React.SetStateAction<Row[]>>;
        setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
        setIsChartModalOpen: (open: boolean) => void;
        setIsAIReportModalOpen: (open: boolean) => void;
    }) => React.ReactNode;
    enableImport?: boolean;
    hideGroupHeader?: boolean;
    showPagination?: boolean;
    tasksVersion?: string;
}

// --- Main RoomTable Component ---
const RoomTable: React.FC<RoomTableProps> = ({ roomId, viewId, defaultColumns, tasks: externalTasks, name: initialName, columns: externalColumns, onUpdateTasks, onDeleteTask, renderCustomActions, onRename, onNavigate, onAddGroup, onUpdateGroup, onDeleteGroup, enableImport, hideGroupHeader, showPagination, tasksVersion }) => {
    const { t, dir } = useAppContext();
    const isRTL = dir === 'rtl';
    const { showToast } = useToast();
    // Keys for persistence
    const storageKeyColumns = `room-table-columns-v7-${roomId}-${viewId}`;
    const storageKeyRows = `room-table-rows-v7-${roomId}-${viewId}`;
    const storageKeyName = `room-table-name-v7-${roomId}-${viewId}`;

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

    const [activeColorMenu, setActiveColorMenu] = useState<{ rect: DOMRect; colId?: string; rowId?: string } | null>(null);
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<{ colId: string; position: { x: number; y: number } } | null>(null);
    const [renamingColId, setRenamingColId] = useState<string | null>(null);
    const creationRowInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // --- State ---
    const [columns, setColumns] = useState<Column[]>(() => {
        if (externalColumns && externalColumns.length > 0) return externalColumns;
        try {
            const saved = localStorage.getItem(storageKeyColumns);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.length > 0) {
                    // Ensure select and name are pinned (migration)
                    // Also ensure Data 2 label is in English
                    return parsed.map((col: Column) => {
                        if (col.id === 'select' || col.id === 'name') {
                            return { ...col, pinned: true };
                        }
                        if (col.id === 'data2' && col.label === 'بيانات 2') {
                            return { ...col, label: 'Data 2' };
                        }
                        return col;
                    });
                }
            }
            // Use prop defaultColumns if available, otherwise internal default
            return defaultColumns && defaultColumns.length > 0 ? defaultColumns : DEFAULT_COLUMNS;
        } catch {
            return defaultColumns && defaultColumns.length > 0 ? defaultColumns : DEFAULT_COLUMNS;
        }
    });

    // TableGroups State (multiple groups with their own rows)
    const storageKeyGroups = `room-table-groups-v1-${roomId}-${viewId}`;

    const [tableGroups, setTableGroups] = useState<TableGroup[]>(() => {
        // Core Logic:
        // 1. If we have externalTasks, they are the SOURCE OF TRUTH for data (rows).
        // 2. We use localStorage ONLY for view states (isCollapsed, colors, order of groups?).
        // 3. We merge them.

        // Load saved view state
        let savedGroupsMap: Record<string, Partial<TableGroup>> = {};
        try {
            const savedGroups = localStorage.getItem(storageKeyGroups);
            if (savedGroups) {
                const parsed = JSON.parse(savedGroups);
                if (Array.isArray(parsed)) {
                    parsed.forEach((g: TableGroup) => {
                        savedGroupsMap[g.id] = {
                            isCollapsed: g.isCollapsed,
                            color: g.color,
                            isPinned: g.isPinned,
                            // If we are in standalone mode (no externalTasks), we MUST trust the saved name and rows
                            name: g.name,
                            rows: g.rows,
                        };
                    });
                }
            }
        } catch (e) {
            boardLogger.warn('Failed to load saved groups from localStorage', e);
        }

        // If external source exists with tasks, sync with it
        // Note: We check length > 0 to differentiate from empty array (controlled mode with no tasks yet)
        if (externalTasks && externalTasks.length > 0) {
            // CRITICAL FIX: Create a map of saved row data by ID to preserve cell values
            // (time_tracking, tags, dependencies, phone, etc.) that might not be in externalTasks
            const savedRowsMap = new Map<string, Row>();
            Object.values(savedGroupsMap).forEach((saved: any) => {
                if (saved.rows && Array.isArray(saved.rows)) {
                    saved.rows.forEach((r: Row) => savedRowsMap.set(r.id, r));
                }
            });

            const tasksByGroup: Record<string, Row[]> = {};
            // Keep track of order found in tasks if possible, or just unique IDs
            const uniqueGroupIds: string[] = [];

            externalTasks.forEach(t => {
                const gid = t.groupId || 'default-group';
                if (!tasksByGroup[gid]) {
                    tasksByGroup[gid] = [];
                    uniqueGroupIds.push(gid);
                }
                // Merge with saved row data to preserve cell values
                const savedRow = savedRowsMap.get(t.id);
                if (savedRow) {
                    // Merge: savedRow has cell data, t has latest core data (name, status, etc.)
                    // Cell data from saved takes precedence for special column types
                    tasksByGroup[gid].push({
                        ...savedRow, ...t, ...Object.fromEntries(
                            Object.entries(savedRow).filter(([key]) =>
                                // Preserve saved cell data for complex column types
                                typeof savedRow[key as keyof Row] === 'object' && savedRow[key as keyof Row] !== null
                            )
                        )
                    });
                } else {
                    tasksByGroup[gid].push(t);
                }
            });

            // We want to preserve the ORDER from specific savedGroups if possible?
            // Or just use the order of appearance / existing savedGroups keys?
            // Best attempt: Use savedGroups order for existing ones, append new ones.

            // Get all known IDs from saved items + new items
            const savedIds = Object.keys(savedGroupsMap);
            // We can't easily know the original sorted order of savedIds unless we parse array.
            // Let's re-parse array order.
            let orderedIds: string[] = [];
            try {
                const saved = localStorage.getItem(storageKeyGroups);
                if (saved) {
                    orderedIds = JSON.parse(saved).map((g: any) => g.id);
                }
            } catch (e) {
                boardLogger.warn('Failed to parse saved groups order from localStorage', e);
            }

            // Merge with found IDs
            const allIds = Array.from(new Set([...orderedIds, ...uniqueGroupIds]));

            return allIds
                .filter(id => tasksByGroup[id] !== undefined || savedGroupsMap[id] !== undefined) // Only show if has tasks or existed
                .filter(id => tasksByGroup[id] && tasksByGroup[id].length > 0)
                .filter(id => tasksByGroup[id] !== undefined)
                .map((id, idx) => {
                    const saved = savedGroupsMap[id] || {};
                    return {
                        id: id,
                        name: saved.name || `Group ${idx + 1}`,
                        rows: tasksByGroup[id] || [],
                        isCollapsed: saved.isCollapsed || false,
                        color: saved.color || getGroupColor(idx),
                        isPinned: saved.isPinned || false
                    };
                });
        }

        // STANDALONE MODE: If no external tasks are provided, load purely from LocalStorage
        // This is crucial for "Data Table" import persistence.
        if (!externalTasks) {
            try {
                const savedGroupsStr = localStorage.getItem(storageKeyGroups);
                if (savedGroupsStr) {
                    const parsed = JSON.parse(savedGroupsStr);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            } catch (e) {
                boardLogger.error("Failed to load generic table data", e);
            }
            // Standalone mode default - use 'group-1' for local-only tables
            return [{
                id: 'group-1',
                name: 'Group 1',
                rows: [],
                isCollapsed: false,
                color: GROUP_COLORS[0]
            }];
        }

        // CONTROLLED MODE with empty tasks: externalTasks is defined but empty
        // Use 'default-group' to match what the parent hook expects for orphan tasks
        // Also try to load saved view state (colors, collapsed state) from localStorage
        let savedViewState: Partial<TableGroup> = {};
        try {
            const savedGroupsStr = localStorage.getItem(storageKeyGroups);
            if (savedGroupsStr) {
                const parsed = JSON.parse(savedGroupsStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    savedViewState = parsed[0];
                }
            }
        } catch (e) {
            // Ignore errors, use defaults
        }

        return [{
            id: 'default-group',
            name: savedViewState.name || 'Tasks',
            rows: [],
            isCollapsed: savedViewState.isCollapsed || false,
            color: savedViewState.color || GROUP_COLORS[0]
        }];
    });

    // Derived rows from all groups (for backward compatibility with filtering, sorting, reminders etc.)
    const rows = useMemo(() => tableGroups.flatMap(g => g.rows), [tableGroups]);


    // Wrapper setRows that updates the first group (for backward compatibility with some handlers)
    const setRows: React.Dispatch<React.SetStateAction<Row[]>> = useCallback((action) => {
        setTableGroups(prev => {
            const newRows = typeof action === 'function' ? action(prev[0]?.rows || []) : action;
            if (prev.length === 0) {
                return [{ id: 'group-1', name: 'Group 1', rows: newRows, isCollapsed: false, color: GROUP_COLORS[0] }];
            }
            return prev.map((g, idx) => idx === 0 ? { ...g, rows: newRows } : g);
        });
    }, []);

    // Pagination State with transition for smooth navigation
    const [isPending, startTransition] = useTransition();
    const [currentPage, setCurrentPageRaw] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(showPagination ? 50 : -1);

    // Wrap page changes in transition for smoother UX
    const setCurrentPage = useCallback((page: number) => {
        startTransition(() => {
            setCurrentPageRaw(page);
        });
    }, []);

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

    // Sync externalTasks to tableGroups if they change
    // Sync externalTasks to tableGroups if they change
    useEffect(() => {
        // If externalTasks is undefined, we assume we are in standalone mode or loading?
        if (externalTasks === undefined) return;

        setTableGroups(prevGroups => {
            // Group external tasks
            const tasksByGroup: Record<string, Row[]> = {};
            externalTasks.forEach(t => {
                const gid = t.groupId || 'default-group';
                if (!tasksByGroup[gid]) tasksByGroup[gid] = [];
                tasksByGroup[gid].push(t);
            });

            // If we have existing groups, we update their rows
            const updatedGroups = prevGroups.map(g => {
                const groupTasks = tasksByGroup[g.id] || [];
                // Check if rows actually changed to avoid unnecessary re-renders or state updates?
                // But setTableGroups replacement always triggers render unless we return same object ref.
                // For deep check, we can skip if identical. But for now, simple replacement is safer for sync.
                return { ...g, rows: groupTasks };
            });

            // Identify any NEW groups that appeared in tasks but are not in our list
            const existingIds = new Set(prevGroups.map(g => g.id));
            const newIds = Object.keys(tasksByGroup).filter(id => !existingIds.has(id));

            if (newIds.length > 0) {
                // If we have a single placeholder group ('group-1' or 'default-group') that is empty,
                // and we receive EXACTLY one new group ID, we assume it's the initial "conversion"
                // from local placeholder to the actual group ID from the parent.
                const isPlaceholderGroup = updatedGroups[0].id === 'group-1' || updatedGroups[0].id === 'default-group';
                if (updatedGroups.length === 1 && isPlaceholderGroup &&
                    (!updatedGroups[0].rows || updatedGroups[0].rows.length === 0) &&
                    newIds.length === 1) {
                    const gid = newIds[0];
                    return [{
                        ...updatedGroups[0],
                        id: gid,
                        rows: tasksByGroup[gid]
                    }];
                }

                const newGroups = newIds.map((gid, idx) => ({
                    id: gid,
                    name: 'New Group', // We rely on Board for names, but here we don't have metadata prop.
                    rows: tasksByGroup[gid],
                    isCollapsed: false,
                    color: GROUP_COLORS[(updatedGroups.length + idx) % GROUP_COLORS.length]
                }));
                return [...updatedGroups, ...newGroups];
            }

            return updatedGroups;
        });

    }, [externalTasks, tasksVersion]);

    const { groupedByItem: remindersByItem, addReminder, updateReminder, deleteReminder } = useReminders(roomId);
    const [activeReminderTarget, setActiveReminderTarget] = useState<{ rowId: string; rect: DOMRect } | null>(null);
    const activeReminderRow = useMemo(() => activeReminderTarget ? rows.find(r => r.id === activeReminderTarget.rowId) : null, [activeReminderTarget, rows]);
    const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
    const [sortConfig, setSortConfig] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null);

    const [newTaskName, setNewTaskName] = useState('');

    const [activeCell, setActiveCell] = useState<{ rowId: string, colId: string, trigger?: HTMLElement, rect?: DOMRect } | null>(null);
    const [activeTextMenu, setActiveTextMenu] = useState<{ rowId: string; colId: string; position: { x: number; y: number } } | null>(null);
    const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean; title: string; description?: string; onConfirm: () => void } | null>(null);
    const [activeRowDetail, setActiveRowDetail] = useState<Row | null>(null);
    const [activeKpiFilter, setActiveKpiFilter] = useState<{ type: 'status' | 'priority', value: string } | null>(null);
    const [activeColumnMenu, setActiveColumnMenu] = useState<{ rect: DOMRect } | null>(null);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    const [isAIReportModalOpen, setIsAIReportModalOpen] = useState(false);
    const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

    // File Upload State
    const [activeUploadCell, setActiveUploadCell] = useState<{ rowId: string, colId: string } | null>(null);
    const [activeUploadFile, setActiveUploadFile] = useState<File | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const hiddenFileInputRef = useRef<HTMLInputElement>(null);

    // Drag & Drop State
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeColumnDragId, setActiveColumnDragId] = useState<string | null>(null);
    const [columnDragMousePos, setColumnDragMousePos] = useState<{ x: number; y: number } | null>(null);
    const columnDragAutoScrollRef = useRef<number | null>(null);
    const lastColumnDragMouseX = useRef<number>(0);

    // Column Resize State
    const resizingColId = useRef<string | null>(null);
    const startX = useRef<number>(0);
    const startWidth = useRef<number>(0);
    const justFinishedResizing = useRef<boolean>(false);

    // Toolbar State
    const [isBodyVisible, setIsBodyVisible] = useState(true);

    // Toolbar Panel States
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
    const [personFilter, setPersonFilter] = useState<string | null>(null);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [filters, setFilters] = useState<FilterRule[]>([]);
    const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);
    const [sortRules, setSortRules] = useState<SortRule[]>([]);
    const [isHideColumnsOpen, setIsHideColumnsOpen] = useState(false);
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
    const [columnSearchQuery, setColumnSearchQuery] = useState('');

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Clear Data State
    const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

    // Custom Statuses State (Unified with Kanban)
    const [customStatuses, setCustomStatuses] = useState<StatusOption[]>([]);
    const storageKeyStatuses = `board-statuses-${roomId}`; // Changed to match KanbanBoard

    // Default Statuses (Source of Truth for Fallback)
    const DEFAULT_STATUSES: StatusOption[] = [
        { id: 'To Do', title: t('to_do'), color: 'gray' },
        { id: 'In Progress', title: t('in_progress'), color: 'blue' },
        { id: 'Done', title: t('done'), color: 'emerald' },
        { id: 'Stuck', title: t('stuck'), color: 'orange' },
        { id: 'Rejected', title: t('rejected'), color: 'rose' }
    ];

    // Load custom statuses on mount
    useEffect(() => {
        const saved = localStorage.getItem(storageKeyStatuses);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Handle schema migration: if array of strings, convert to objects
                if (Array.isArray(parsed) && parsed.length > 0) {
                    if (typeof parsed[0] === 'string') {
                        const migrated = parsed.map((s: string) => {
                            // Basic color inference
                            const lower = s.toLowerCase();
                            let color = 'gray';
                            if (lower.includes('done')) color = 'emerald';
                            else if (lower.includes('progress')) color = 'blue';
                            else if (lower.includes('stuck')) color = 'orange';
                            else if (lower.includes('rejected')) color = 'rose';
                            return { id: s, title: s, color };
                        });
                        setCustomStatuses(migrated);
                    } else {
                        setCustomStatuses(parsed);
                    }
                } else {
                    setCustomStatuses(DEFAULT_STATUSES);
                }
            } catch (e) {
                boardLogger.error("Failed to parse board statuses", e);
                setCustomStatuses(DEFAULT_STATUSES);
            }
        } else {
            // Initialize with defaults if nothing saved
            setCustomStatuses(DEFAULT_STATUSES);
        }
    }, [storageKeyStatuses]);

    // Handler to add custom status
    const handleAddCustomStatus = useCallback((newStatusTitle: string) => {
        setCustomStatuses(prev => {
            // Check if exists
            if (prev.find(s => s.title.toLowerCase() === newStatusTitle.toLowerCase())) return prev;

            // Assign cyclical color
            const COLORS = ['gray', 'blue', 'emerald', 'orange', 'rose', 'purple', 'yellow', 'pink'];
            const nextColor = COLORS[prev.length % COLORS.length];

            const newOption: StatusOption = {
                id: newStatusTitle,
                title: newStatusTitle,
                color: nextColor
            };

            const updated = [...prev, newOption];
            localStorage.setItem(storageKeyStatuses, JSON.stringify(updated));
            return updated;
        });
    }, [storageKeyStatuses]);

    // Handler to delete custom status
    const handleDeleteCustomStatus = useCallback((statusIdToDelete: string) => {
        setCustomStatuses(prev => {
            const updated = prev.filter(s => s.id !== statusIdToDelete);
            localStorage.setItem(storageKeyStatuses, JSON.stringify(updated));
            return updated;
        });
    }, [storageKeyStatuses]);



    // Select All / Deselect All Handler
    const handleSelectAll = useCallback((checked: boolean) => {
        const primaryCol = columns.find(c => c.id === 'name') || { id: 'name' };

        // We only want to select/deselect 'real' rows? The user requested "main checkbox activate it when user clicks all will be marked".
        // This implies selecting ALL items.
        // We need to iterate over all groups and their rows.

        // But tableGroups is state. We need to update ALL rows in ALL groups.
        // Wait, handleUpdateRow updates a single row. We should probably do a bulk update or just update local state if performance allows.
        // Actually, handleUpdateRow updates local state `tableGroups`.

        setTableGroups(prevGroups => {
            return prevGroups.map(group => ({
                ...group,
                rows: group.rows.map(row => ({
                    ...row,
                    [columns.find(c => c.id === 'select')?.id || 'select']: checked
                }))
            }));
        });
    }, [columns]);

    // Export Handler
    const handleExportTable = useCallback(() => {
        // Gather data
        // If anything is selected, export ONLY selected. Else export select all.
        // Check selection across all groups
        let allRows: Row[] = [];
        tableGroups.forEach(g => {
            allRows = [...allRows, ...g.rows];
        });

        const selectedRows = allRows.filter(r => !!r['select']);
        const rowsToExport = selectedRows.length > 0 ? selectedRows : allRows;

        if (rowsToExport.length === 0) {
            alert(t('no_data_to_export'));
            return;
        }

        // Format data for Excel
        const data = rowsToExport.map(r => {
            const rowObj: any = {};
            columns.forEach(c => {
                if (c.id === 'select') return; // Skip select column
                let val = r[c.id];
                // Format values if needed
                if (c.type === 'people' && val) val = (val as any).name;
                if (c.type === 'files' && val) val = (val as any).title || 'File';
                // Doc, Date, etc are strings or simple enough
                rowObj[c.label] = val;
            });
            return rowObj;
        });

        // Generate Sheet
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Board Export");
        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `Table_Export_${dateStr}.xlsx`);
        XLSX.writeFile(wb, `Table_Export_${dateStr}.xlsx`);
    }, [tableGroups, columns]);

    // Clear Table Handler
    const handleClearTable = useCallback(() => {
        // Clear all rows from all groups
        setTableGroups(prev => prev.map(g => ({ ...g, rows: [] })));

        // Clear creation rows buffer
        setCreationRows({});

        // Persist immediately
        // Note: The persistence effect will trigger automatically due to state change

        showToast(t('table_cleared_successfully'), 'success');
        setIsClearDataModalOpen(false);

        if (onUpdateTasks) {
            onUpdateTasks([]);
        }
    }, [onUpdateTasks, showToast]);

    // creationRowInputRef is already defined at line 854
    const tableBodyRef = useRef<HTMLDivElement>(null);

    // Persistence Effects
    useEffect(() => {
        if (!externalColumns) {
            localStorage.setItem(storageKeyColumns, JSON.stringify(columns));
        }
    }, [columns, storageKeyColumns, externalColumns]);

    // Persist tableGroups to localStorage (Always persist, even if externalTasks are present)
    useEffect(() => {
        localStorage.setItem(storageKeyGroups, JSON.stringify(tableGroups));
    }, [tableGroups, storageKeyGroups]);

    // Handler to add a new table group
    const handleAddTableGroup = useCallback((param?: string | React.MouseEvent) => {
        const nameToUse = typeof param === 'string' ? param : t('new_group');

        setTableGroups(prev => {
            const newGroupId = `group-${Date.now()}`;
            const colorIndex = prev.length % GROUP_COLORS.length;
            const color = GROUP_COLORS[colorIndex];
            const newGroup: TableGroup = {
                id: newGroupId,
                name: nameToUse,
                rows: [],
                isCollapsed: false,
                color: color
            };

            // Sync with parent
            if (onAddGroup) {
                // Pass a hash or undefined for color to let parent decide, or pass string if parent supports it
                onAddGroup(newGroupId, nameToUse, undefined);
            }

            return [...prev, newGroup];
        });
    }, []);

    // Handler to update a group's name
    const handleUpdateGroupName = useCallback((groupId: string, newName: string) => {
        setTableGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, name: newName } : g
        ));
        if (onUpdateGroup) {
            onUpdateGroup(groupId, newName);
        }
    }, []);

    // Handler to toggle group collapse
    const handleToggleGroupCollapse = useCallback((groupId: string) => {
        setTableGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
        ));
    }, []);

    // Handler to toggle group pin
    const handleToggleGroupPin = useCallback((groupId: string) => {
        setTableGroups(prev => {
            const updated = prev.map(g =>
                g.id === groupId ? { ...g, isPinned: !g.isPinned } : g
            );
            return updated;
        });
    }, []);

    // Handler to delete a group
    const handleDeleteGroup = useCallback((groupId: string) => {
        setTableGroups(prev => {
            if (prev.length <= 1) {
                alert(t('cannot_delete_last_group'));
                return prev;
            }
            return prev.filter(g => g.id !== groupId);
        });
        if (onDeleteGroup) {
            onDeleteGroup(groupId);
        }
    }, []);

    // Handler to add a row to a specific group
    const handleAddRowToGroup = useCallback((groupId: string, rowName?: string) => {
        const nameToAdd = rowName?.trim() || t('new_item');
        const primaryCol = columns.find(c => c.id === 'name') || columns.find(c => c.id !== 'select') || { id: 'name' };

        const newRow: Row = {
            id: Date.now().toString(),
            groupId: groupId,
            [primaryCol.id]: nameToAdd,
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

        // Clear sorting so new item appears at top (natural order)
        setSortRules([]);
        setSortConfig(null);

        setTableGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, rows: [newRow, ...g.rows] } : g
        ));
    }, [columns]);

    // --- Creation Row Logic ---
    const CREATION_ROW_ID = 'creation-row-temp-id';
    // Creation Row State - separate buffer for EACH group to avoid sync issues
    const [creationRows, setCreationRows] = useState<Record<string, Partial<Row>>>({});

    const handleUpdateCreationRow = (groupId: string, updates: Partial<Row>) => {
        setCreationRows(prev => ({
            ...prev,
            [groupId]: { ...(prev[groupId] || {}), ...updates }
        }));
    };

    const handleCommitCreationRow = (groupId: string) => {
        const groupCreationRow = creationRows[groupId] || {};

        if (!groupCreationRow.name && !Object.keys(groupCreationRow).length) return; // Prevent empty commits if strictly empty

        // Use the existing add logic, but merge our creationRow data
        const primaryCol = columns.find(c => c.id === 'name') || columns.find(c => c.id !== 'select') || { id: 'name' };
        const nameToUse = groupCreationRow[primaryCol.id] || t('new_item');

        // We need to pass the FULL creation row data, not just the name.
        // handleAddRowToGroup currently takes (groupId, rowName). We should update it or manually do it here.
        // Let's refactor the adding logic slightly or just use the logic inline here to be safe and support all fields.

        const newRow: Row = {
            id: Date.now().toString(),
            groupId: groupId,
            status: 'To Do',
            dueDate: null,
            date: new Date().toISOString(),
            priority: null,
            ...groupCreationRow, // Spread valid fields
            [primaryCol.id]: nameToUse, // Ensure name is set
        };

        // Initialize missing columns
        columns.forEach(col => {
            if (col.id !== 'select' && !newRow.hasOwnProperty(col.id)) {
                newRow[col.id] = null;
            }
        });

        setSortRules([]);
        setSortConfig(null);


        const updatedGroups = tableGroups.map(g =>
            g.id === groupId ? { ...g, rows: [newRow, ...g.rows] } : g
        );

        setTableGroups(updatedGroups);

        // Explicitly sync with parent (Kanban/Board)
        if (onUpdateTasks) {
            const allRows = updatedGroups.flatMap(g => g.rows);
            onUpdateTasks(allRows);
        }

        // Reset creation row for THIS group
        setCreationRows(prev => {
            const next = { ...prev };
            delete next[groupId];
            return next;
        });

        // Keep focus on the creation row input for continuous entry
        requestAnimationFrame(() => {
            const inputEl = creationRowInputRefs.current[groupId];
            if (inputEl) {
                inputEl.focus();
            }
        });
    };


    // Handler to delete a row from groups
    const handleDeleteRowFromGroup = useCallback((rowId: string) => {
        setTableGroups(prev => prev.map(g => ({
            ...g,
            rows: g.rows.filter(r => r.id !== rowId)
        })));
    }, []);

    // --- Import Functionality ---
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        setIsExcelImportModalOpen(true);
    };

    // Handle import from the ExcelImportModal
    const handleExcelImport = useCallback((importedRows: Row[], newColumns?: Column[]) => {
        if (newColumns && newColumns.length > 0) {
            setColumns(prev => [...prev, ...newColumns]);
        }

        // Add rows to the first group
        setTableGroups(prev => {
            if (prev.length === 0) {
                return [{
                    id: 'group-1',
                    name: 'Group 1',
                    rows: importedRows,
                    isCollapsed: false,
                    color: GROUP_COLORS[0]
                }];
            }
            return prev.map((g, idx) =>
                idx === 0 ? { ...g, rows: [...g.rows, ...importedRows] } : g
            );
        });

        if (onUpdateTasks) {
            const allRows = [...rows, ...importedRows];
            onUpdateTasks(allRows);
        }

        showToast(t('import_success')?.replace('{0}', String(importedRows.length)) || `Successfully imported ${importedRows.length} rows`, 'success');
    }, [rows, onUpdateTasks, showToast, t]);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Get raw data (array of arrays)
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (!rawData || rawData.length === 0) {
                showToast(t('file_appears_empty'), 'error');
                return;
            }

            // Smart header row detection - scan first 20 rows for the best candidate
            let headerRowIndex = 0;
            let maxNonEmptyCells = 0;

            for (let i = 0; i < Math.min(20, rawData.length); i++) {
                const row = rawData[i];
                if (!Array.isArray(row)) continue;

                // Count non-empty string cells (headers are usually strings)
                const nonEmptyCells = row.filter((cell: any) =>
                    cell != null &&
                    String(cell).trim() !== '' &&
                    typeof cell === 'string'
                ).length;

                // Prefer rows with more non-empty string cells
                if (nonEmptyCells > maxNonEmptyCells) {
                    maxNonEmptyCells = nonEmptyCells;
                    headerRowIndex = i;
                }
            }

            const headerRow = rawData[headerRowIndex] || [];
            const dataRows = rawData.slice(headerRowIndex + 1);

            if (dataRows.length === 0) {
                showToast(t('found_headers_no_data').replace('{0}', String(headerRowIndex + 1)), 'error');
                return;
            }

            // Helper to detect column type from header name
            const detectColumnType = (headerName: string): string => {
                const lower = headerName.toLowerCase();
                if (lower === 'status' || lower.includes('status')) return 'status';
                if (lower === 'priority' || lower.includes('priority')) return 'priority';
                if (lower.includes('date') || lower.includes('due') || lower.includes('deadline')) return 'date';
                if (lower.includes('people') || lower.includes('assignee') || lower.includes('owner') || lower.includes('person')) return 'people';
                return 'text';
            };

            // Track used IDs to handle duplicates
            const usedIds = new Set<string>();

            const newColumns: Column[] = headerRow.map((header: any, index: number) => {
                const headerStr = header != null ? String(header).trim() : '';
                const colType = detectColumnType(headerStr);

                // Generate unique ID - handle duplicates by appending index
                let baseId = headerStr.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '') || `col_${index}`;
                let id = baseId;
                let suffix = 1;
                while (usedIds.has(id)) {
                    id = `${baseId}_${suffix}`;
                    suffix++;
                }
                usedIds.add(id);

                return {
                    id,
                    label: headerStr || `Column ${index + 1}`,
                    type: colType,
                    width: colType === 'status' || colType === 'priority' ? 140 : 150,
                    pinned: index === 0,
                    minWidth: 100,
                    resizable: true,
                };
            });

            // Add select column at start
            newColumns.unshift({ id: 'select', label: '', type: 'text', width: 40, pinned: true, minWidth: 40, resizable: false });

            // Find or create 'name' column - required for table functionality
            let nameColIndex = newColumns.findIndex(c =>
                c.id === 'name' ||
                c.label.toLowerCase() === 'name' ||
                c.label.toLowerCase() === 'title' ||
                c.label.toLowerCase() === 'task' ||
                c.label.toLowerCase() === 'item'
            );

            if (nameColIndex === -1) {
                // Use first non-select column as name
                nameColIndex = newColumns.findIndex(c => c.id !== 'select');
            }

            if (nameColIndex !== -1 && newColumns[nameColIndex].id !== 'name') {
                newColumns[nameColIndex] = { ...newColumns[nameColIndex], id: 'name', pinned: true };
            }

            // Get data columns (excluding select) - these map 1:1 with Excel columns
            const dataColumns = newColumns.filter(c => c.id !== 'select');

            // Helper to normalize status values
            const normalizeStatus = (value: any): string => {
                if (!value) return 'To Do';
                const lower = String(value).toLowerCase().trim();
                if (lower === 'done' || lower === 'completed' || lower === 'complete') return 'Done';
                if (lower === 'in progress' || lower === 'in-progress' || lower === 'inprogress' || lower === 'working' || lower === 'working on it') return 'In Progress';
                if (lower === 'stuck' || lower === 'blocked') return 'Stuck';
                if (lower === 'rejected' || lower === 'cancelled' || lower === 'canceled') return 'Rejected';
                if (lower === 'to do' || lower === 'todo' || lower === 'pending' || lower === 'not started') return 'To Do';
                return String(value).trim();
            };

            const newRows: Row[] = [];
            const baseTimestamp = Date.now();

            dataRows.forEach((rowArray: any[], rowIndex: number) => {
                // Skip empty rows - check for null, undefined, empty string, or whitespace-only
                if (!rowArray || rowArray.length === 0) return;
                const hasData = rowArray.some((cell: any) => {
                    if (cell == null) return false;
                    const strVal = String(cell).trim();
                    return strVal !== '' && strVal !== 'undefined' && strVal !== 'null';
                });
                if (!hasData) return;

                const rowData: any = {
                    id: `${baseTimestamp}_${rowIndex}`,
                    groupId: tableGroups[0]?.id || 'group-1',
                    status: 'To Do',
                    priority: null,
                };

                rowArray.forEach((cellValue, idx) => {
                    if (idx < dataColumns.length) {
                        const col = dataColumns[idx];
                        let normalizedValue = cellValue;

                        // Normalize based on column type
                        if (col.type === 'status' || col.id === 'status') {
                            normalizedValue = normalizeStatus(cellValue);
                        } else if (col.type === 'priority' || col.id === 'priority') {
                            normalizedValue = normalizePriority(cellValue != null ? String(cellValue) : null);
                        } else if (col.type === 'date' && cellValue) {
                            const dateVal = new Date(cellValue);
                            normalizedValue = !isNaN(dateVal.getTime()) ? dateVal.toISOString() : cellValue;
                        }

                        rowData[col.id] = normalizedValue;
                    }
                });

                newRows.push(rowData as Row);
            });

            if (newRows.length === 0) {
                showToast('No valid data rows found in the file.', 'error');
                return;
            }

            // Update state
            setColumns(newColumns);

            const baseGroup = tableGroups[0] || {
                id: 'group-1',
                name: 'Group 1',
                isCollapsed: false,
                color: '#6366f1'
            };
            const newGroups = [{ ...baseGroup, rows: newRows }];
            setTableGroups(newGroups);

            // Reset filters/sorts
            setSortRules([]);
            setSortConfig(null);

            showToast(`Successfully imported ${newRows.length} rows from ${headerRow.length} columns`, 'success');

        } catch (error) {
            boardLogger.error("Import failed:", error);
            showToast('Import failed. Please check the file format.', 'error');
        } finally {
            if (e.target) e.target.value = '';
        }
    };

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
        let result = rows;

        // Apply priority filter (existing)
        if (priorityFilter !== 'all') {
            result = result.filter(r => formatPriorityLabel(r.priority) === priorityFilter);
        }

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(row => {
                return Object.values(row).some(val => {
                    if (typeof val === 'string') {
                        return val.toLowerCase().includes(query);
                    }
                    return false;
                });
            });
        }

        // Apply person filter
        if (personFilter) {
            result = result.filter(row => {
                const peopleRaw = row.people;
                const people = Array.isArray(peopleRaw) ? peopleRaw : (peopleRaw ? [peopleRaw] : []);
                return people.some((p: any) => (p?.name || p) === personFilter);
            });
        }

        // Apply advanced filters
        if (filters.length > 0) {
            result = result.filter(row => {
                return filters.every(filter => {
                    if (!filter.column || !filter.condition) return true;

                    const cellValue = row[filter.column];
                    const filterValue = filter.value?.toLowerCase() || '';

                    switch (filter.condition) {
                        case 'contains':
                            return String(cellValue || '').toLowerCase().includes(filterValue);
                        case 'equals':
                            return String(cellValue || '').toLowerCase() === filterValue;
                        case 'not_contains':
                            return !String(cellValue || '').toLowerCase().includes(filterValue);
                        case 'is_empty':
                            return !cellValue || cellValue === '';
                        case 'is_not_empty':
                            return cellValue && cellValue !== '';
                        case 'is':
                            return String(cellValue || '').toLowerCase() === filterValue;
                        case 'is_not':
                            return String(cellValue || '').toLowerCase() !== filterValue;
                        case 'is_after':
                            if (!cellValue || !filter.value) return true;
                            return new Date(cellValue) > new Date(filter.value);
                        case 'is_before':
                            if (!cellValue || !filter.value) return true;
                            return new Date(cellValue) < new Date(filter.value);
                        default:
                            return true;
                    }
                });
            });
        }

        return result;
    }, [rows, priorityFilter, searchQuery, personFilter, filters]);

    const sortedRows = useMemo(() => {
        let result = filteredRows;

        // Apply sortRules (new toolbar sort)
        if (sortRules.length > 0) {
            result = [...result].sort((a, b) => {
                for (const rule of sortRules) {
                    if (!rule.column) continue;

                    const aVal = a[rule.column] || '';
                    const bVal = b[rule.column] || '';

                    // Handle priority special case
                    if (rule.column === 'priority') {
                        const comp = comparePriority(aVal, bVal);
                        if (comp !== 0) return rule.direction === 'desc' ? -comp : comp;
                        continue;
                    }

                    let comparison = 0;
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        comparison = aVal.localeCompare(bVal);
                    } else {
                        comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                    }

                    if (comparison !== 0) {
                        return rule.direction === 'desc' ? -comparison : comparison;
                    }
                }
                return 0;
            });
        } else if (sortConfig) {
            // Fallback to old sortConfig if no sortRules
            result = [...result].sort((a, b) => {
                const aVal = a[sortConfig.columnId];
                const bVal = b[sortConfig.columnId];

                if (sortConfig.columnId === 'priority') {
                    const r = comparePriority(aVal, bVal);
                    return sortConfig.direction === 'asc' ? r : -r;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [filteredRows, sortConfig, sortRules]);

    // Visible columns (excluding hidden ones)
    const visibleColumns = useMemo(() => {
        return columns.filter(col => !hiddenColumns.has(col.id));
    }, [columns, hiddenColumns]);

    // Helper function to filter rows
    const filterRow = useCallback((row: Row): boolean => {
        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesSearch = Object.values(row).some(val => {
                if (typeof val === 'string') {
                    return val.toLowerCase().includes(query);
                }
                return false;
            });
            if (!matchesSearch) return false;
        }

        // Apply person filter
        if (personFilter) {
            const peopleRaw = row.people;
            const people = Array.isArray(peopleRaw) ? peopleRaw : (peopleRaw ? [peopleRaw] : []);
            const matchesPerson = people.some((p: any) => (p?.name || p) === personFilter);
            if (!matchesPerson) return false;
        }

        if (activeKpiFilter) {
            if (activeKpiFilter.type === 'status') {
                const rowStatus = row.status || 'To Do';
                if (rowStatus !== activeKpiFilter.value) return false;
            } else if (activeKpiFilter.type === 'priority') {
                const rowPriority = formatPriorityLabel(row.priority) || 'No Priority';
                if (rowPriority !== activeKpiFilter.value) return false;
            }
        }

        // Apply advanced filters
        if (filters.length > 0) {
            const matchesFilters = filters.every(filter => {
                if (!filter.column || !filter.condition) return true;

                const cellValue = row[filter.column];
                const filterValue = filter.value?.toLowerCase() || '';

                switch (filter.condition) {
                    case 'contains':
                        return String(cellValue || '').toLowerCase().includes(filterValue);
                    case 'equals':
                        return String(cellValue || '').toLowerCase() === filterValue;
                    case 'not_contains':
                        return !String(cellValue || '').toLowerCase().includes(filterValue);
                    case 'is_empty':
                        return !cellValue || cellValue === '';
                    case 'is_not_empty':
                        return cellValue && cellValue !== '';
                    case 'is':
                        return String(cellValue || '').toLowerCase() === filterValue;
                    case 'is_not':
                        return String(cellValue || '').toLowerCase() !== filterValue;
                    case 'is_after':
                        if (!cellValue || !filter.value) return true;
                        return new Date(cellValue) > new Date(filter.value);
                    case 'is_before':
                        if (!cellValue || !filter.value) return true;
                        return new Date(cellValue) < new Date(filter.value);
                    default:
                        return true;
                }
            });
            if (!matchesFilters) return false;
        }

        return true;
    }, [searchQuery, personFilter, filters, activeKpiFilter]);

    // Filtered table groups - applies filters to each group's rows
    const filteredTableGroups = useMemo(() => {
        const hasActiveFilters = searchQuery.trim() || personFilter || filters.length > 0 || activeKpiFilter;

        if (!hasActiveFilters && sortRules.length === 0) {
            return tableGroups;
        }

        return tableGroups.map(group => {
            // Filter rows
            let filteredGroupRows = group.rows.filter(filterRow);

            if (sortRules.length > 0) {
                filteredGroupRows = [...filteredGroupRows].sort((a, b) => {
                    for (const rule of sortRules) {
                        if (!rule.column) continue;

                        const aVal = a[rule.column] || '';
                        const bVal = b[rule.column] || '';

                        if (rule.column === 'priority') {
                            const comp = comparePriority(aVal, bVal);
                            if (comp !== 0) return rule.direction === 'desc' ? -comp : comp;
                            continue;
                        }

                        let comparison = 0;
                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                            comparison = aVal.localeCompare(bVal);
                        } else {
                            comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                        }

                        if (comparison !== 0) {
                            return rule.direction === 'desc' ? -comparison : comparison;
                        }
                    }
                    return 0;
                });
            } else if (sortConfig) {
                filteredGroupRows = [...filteredGroupRows].sort((a, b) => {
                    const aVal = a[sortConfig.columnId];
                    const bVal = b[sortConfig.columnId];
                    // ... (existing sortConfig logic could be here, but let's assume it's handled or we can simplify)
                    // For brevity in this replacement, we assume sortRules is primary. 
                    // To be safe, let's keep the map structure but just add the SORTING OF THE GROUPS themselves at the end.
                    if (sortConfig.columnId === 'priority') {
                        const r = comparePriority(aVal, bVal);
                        return sortConfig.direction === 'asc' ? r : -r;
                    }
                    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            return { ...group, rows: filteredGroupRows };
        }).sort((a, b) => {
            // Sort by Pinned status first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0; // Existing order typically roughly creation order or alphabetical if we added name sort
        });


    }, [tableGroups, filterRow, sortRules]);

    // Click outside handler for toolbar panels
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Don't close if clicking inside a panel or on a toolbar button
            const isInsidePanel = target.closest('[data-toolbar-panel]');
            const isToolbarButton = target.closest('[data-toolbar-button]');

            if (!isInsidePanel && !isToolbarButton) {
                setIsPersonFilterOpen(false);
                setIsFilterPanelOpen(false);
                setIsSortPanelOpen(false);
                setIsHideColumnsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Pagination Logic
    const isAllRows = rowsPerPage === -1;
    const totalPages = isAllRows ? 1 : Math.ceil(sortedRows.length / rowsPerPage);

    const paginatedRows = useMemo(() => {
        if (isAllRows) return sortedRows;
        const start = (currentPage - 1) * rowsPerPage;
        return sortedRows.slice(start, start + rowsPerPage);
    }, [sortedRows, currentPage, rowsPerPage, isAllRows]);

    // Paginated Groups - ensure we only show the rows that belong to the current page
    const paginatedGroups = useMemo(() => {
        if (isAllRows) return filteredTableGroups;

        const paginatedRowIds = new Set(paginatedRows.map(r => r.id));

        return filteredTableGroups.map(group => ({
            ...group,
            rows: group.rows.filter(r => paginatedRowIds.has(r.id))
        })).filter(group => group.rows.length > 0 || group.isPinned || hideGroupHeader);
    }, [filteredTableGroups, paginatedRows, isAllRows, hideGroupHeader]);

    // Priority Summary Calculation
    const priorityStats = useMemo(() => {
        const total = rows.length;
        if (total === 0) return null;

        const counts = {
            Urgent: 0,
            High: 0,
            Medium: 0,
            Low: 0,
            None: 0
        };

        rows.forEach(r => {
            const p = r.priority;
            if (p === 'Urgent') counts.Urgent++;
            else if (p === 'High') counts.High++;
            else if (p === 'Medium') counts.Medium++;
            else if (p === 'Low') counts.Low++;
            else counts.None++;
        });

        // Use colors matching the image concept approximately
        return {
            total,
            segments: [
                { label: 'Urgent', count: counts.Urgent, color: 'bg-orange-500' }, // Orange
                { label: 'High', count: counts.High, color: 'bg-yellow-400' },   // Yellowish
                { label: 'Medium', count: counts.Medium, color: 'bg-blue-400' },     // Blueish
                { label: 'Low', count: counts.Low, color: 'bg-stone-300' },      // Grey
                { label: 'None', count: counts.None, color: 'bg-stone-200' }     // Light Grey
            ].filter(s => s.count > 0)
        };
    }, [rows]);





    const handleAddPinnedChart = (config: ChartBuilderConfig) => {
        setPinnedCharts(prev => [...prev, config]);
        // Ideally show a toast here
    };

    const handleDeletePinnedChart = (index: number) => {
        setPinnedCharts(prev => prev.filter((_, i) => i !== index));
    };

    const handleToggleColumnFreeze = useCallback((colId: string) => {
        setColumns(prev => prev.map(col => {
            if (col.id === colId) {
                return { ...col, pinned: !col.pinned };
            }
            return col;
        }));
    }, []);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Handlers ---
    const handleCellAction = (action: string, rowId: string, colId: string, value?: any) => {
        if (action === 'navigate') {
            // Navigate to Vault
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
            // Store only essential reference properties, not the full base64 content
            // This prevents localStorage quota exceeded errors
            const fileReference = {
                id: item.id,
                title: item.title,
                type: item.type,
                folderId: item.folderId,
                metadata: item.metadata,
                // Don't store previewUrl or content - they're too large for localStorage
            };

            // Find current files in the cell and append the new file
            const currentRow = rows.find(r => r.id === activeUploadCell.rowId);
            const currentValue = currentRow?.[activeUploadCell.colId];
            const existingFiles = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
            const updatedFiles = [...existingFiles, fileReference];

            handleUpdateRow(activeUploadCell.rowId, { [activeUploadCell.colId]: updatedFiles });
        }
        setIsUploadModalOpen(false);
        setActiveUploadCell(null);
        setActiveUploadFile(null);
    };

    const handleAddTask = () => {
        const nameToAdd = newTaskName.trim() || 'New Item';

        // Find the "primary" column to put the task name in
        const primaryCol = columns.find(c => c.id === 'name') || columns.find(c => c.id !== 'select') || { id: 'name' };

        const newRow: Row = {
            id: Date.now().toString(),
            [primaryCol.id]: nameToAdd,
            status: 'To Do',
            dueDate: new Date().toISOString(),
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


    const handleUpdateRow = (id: string, updates: Partial<Row>, groupId?: string) => {
        if (id === CREATION_ROW_ID) {
            if (groupId) {
                handleUpdateCreationRow(groupId, updates);
            }
            return;
        }

        // Clear any pending debounced updates to ensure we send the latest state immediately
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Check if this update marks the task as "Done"
        // Find ALL status columns and check if any update key matches
        const statusColumnIds = columns
            .filter(col => col.type === 'status' || col.id.toLowerCase().includes('status'))
            .map(col => col.id);

        // Check if any of the update keys is a status column with a "Done" value
        let isDoneStatus = false;
        for (const key of Object.keys(updates)) {
            if (statusColumnIds.includes(key) || key.toLowerCase().includes('status')) {
                const value = updates[key];
                if (value && (
                    value === 'Done' || value === 'منجز' ||
                    String(value).toLowerCase() === 'done' ||
                    String(value).toLowerCase() === 'completed'
                )) {
                    isDoneStatus = true;
                    break;
                }
            }
        }

        // Find and update the row in the correct group
        setTableGroups(prevGroups => {
            return prevGroups.map(group => {
                const rowIndex = group.rows.findIndex(r => r.id === id);
                if (rowIndex === -1) return group;

                const currentRow = group.rows[rowIndex];
                const updatedRow = { ...currentRow, ...updates };

                // If marked as Done, move to the end of the group
                if (isDoneStatus && rowIndex < group.rows.length - 1) {
                    const newRows = [...group.rows];
                    newRows.splice(rowIndex, 1); // Remove from current position
                    newRows.push(updatedRow); // Add to end
                    return {
                        ...group,
                        rows: newRows
                    };
                }

                // Normal update without reordering
                return {
                    ...group,
                    rows: group.rows.map(r => r.id === id ? updatedRow : r)
                };
            });
        });

        // Also call onUpdateTasks with all rows for backward compatibility
        const updatedRows = rows.map(r => r.id === id ? { ...r, ...updates } : r);
        if (onUpdateTasks) onUpdateTasks(updatedRows);
    };

    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTextChange = (id: string, colId: string, value: string, groupId?: string) => {
        if (id === CREATION_ROW_ID) {
            if (groupId) {
                handleUpdateCreationRow(groupId, { [colId]: value });
            }
            return;
        }

        // Update the row in the correct group
        setTableGroups(prevGroups => {
            return prevGroups.map(group => {
                const rowExists = group.rows.some(r => r.id === id);
                if (rowExists) {
                    return {
                        ...group,
                        rows: group.rows.map(r => r.id === id ? { ...r, [colId]: value } : r)
                    };
                }
                return group;
            });
        });

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
            // Use setTableGroups callback to access latest state and avoid stale closure
            setTableGroups(currentGroups => {
                const currentRows = currentGroups.flatMap(g => g.rows);
                const updatedRows = currentRows.map(r => r.id === id ? { ...r, [colId]: value } : r);
                if (onUpdateTasks) onUpdateTasks(updatedRows);
                return currentGroups; // Return unchanged - we're just reading
            });
        }, 800);
    };

    const handleDeleteRow = (id: string) => {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

        // Find the group AND the row
        const group = tableGroups.find(g => g.rows.some(r => r.id === id));
        const row = group?.rows.find(r => r.id === id);

        // Preference: Use Board Group ID from externalTasks -> row.groupId -> group.id (Table Group)
        // We look in externalTasks because RoomTable might strip groupId during sync
        const externalTask = externalTasks?.find(t => t.id === id);
        const targetGroupId = externalTask?.groupId || row?.groupId || group?.id;

        // Use the explicit delete handler if available (Preferred)
        if (onDeleteTask && targetGroupId) {
            onDeleteTask(targetGroupId, id);
        }

        // Optimistically delete locally to update UI immediately
        setTableGroups(prevGroups => {
            return prevGroups.map(group => {
                const rowExists = group.rows.some(r => r.id === id);
                if (rowExists) {
                    return {
                        ...group,
                        rows: group.rows.filter(r => r.id !== id)
                    };
                }
                return group;
            });
        });

        // Only trigger onUpdateTasks if we DIDN'T use onDeleteTask (Legacy fallback)
        if (!onDeleteTask) {
            const updatedRows = rows.filter(r => r.id !== id);
            if (onUpdateTasks) onUpdateTasks(updatedRows);
        }
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
                // Delay setting activeCell to allow scroll animation to complete
                setTimeout(() => {
                    const newRect = trigger.getBoundingClientRect(); // re-measure after scroll
                    setActiveCell({ rowId, colId, trigger, rect: newRect });
                }, 150);
            } else {
                setActiveCell({ rowId, colId, trigger, rect: triggerRect });
            }
        }
    };

    // Navigate to next cell when Enter is pressed
    const navigateToNextCell = (currentRowId: string, currentColId: string, groupId?: string) => {
        // If this is the creation row, commit it instead of navigating
        if (currentRowId === CREATION_ROW_ID && groupId) {
            handleCommitCreationRow(groupId);
            return;
        }

        // For existing rows, navigate to the creation row ("Start typing to add") to add a new task
        // Find the primary column (the "name" column or first non-select column)
        const primaryCol = visibleColumns.find(col => col.id === 'name') || visibleColumns.find(col => col.id !== 'select');
        if (!primaryCol) {
            setActiveCell(null);
            return;
        }

        // Find the first group's creation row and focus it
        const firstGroup = tableGroups[0];
        if (!firstGroup) {
            setActiveCell(null);
            return;
        }

        // Focus the creation row's primary column
        setTimeout(() => {
            const cellSelector = `[data-row-id="${CREATION_ROW_ID}"][data-col-id="${primaryCol.id}"]`;
            const creationCellElement = document.querySelector(cellSelector) as HTMLElement;

            if (creationCellElement) {
                const rect = creationCellElement.getBoundingClientRect();
                setActiveCell({ rowId: CREATION_ROW_ID, colId: primaryCol.id, trigger: creationCellElement, rect });

                // Focus the input after a brief delay
                setTimeout(() => {
                    const input = creationCellElement.querySelector('input');
                    if (input) input.focus();
                }, 50);
            } else {
                // If no element found, just set active cell state
                setActiveCell({ rowId: CREATION_ROW_ID, colId: primaryCol.id });
            }
        }, 10);
    };

    const handleAddColumn = (type: string, label: string, options?: any[], _currency?: string, config?: { currency?: { code: string; symbol: string } }) => {
        const newCol: Column = {
            id: label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
            label: label,
            type: type,
            width: type === 'currency' ? 140 : 150,
            minWidth: 100,
            resizable: true,
            options: options,
            ...(config?.currency && { currency: config.currency })
        };
        setColumns([...columns, newCol]);

        // Auto-scroll to show the new column (end of table)
        setTimeout(() => {
            if (tableBodyRef.current) {
                const el = tableBodyRef.current;
                // In RTL, new columns appear on the left (end), scrollLeft 0 is rightmost
                // Use scrollWidth - clientWidth to get the maximum scroll distance
                const maxScroll = el.scrollWidth - el.clientWidth;
                el.scrollTo({
                    left: isRTL ? -maxScroll : maxScroll,
                    behavior: 'smooth'
                });
            }
        }, 100); // Small delay to allow DOM to update
    };

    const handleAddColumnOption = (colId: string, optionLabel: string) => {
        setColumns(prevCols => {
            return prevCols.map(col => {
                if (col.id === colId) {
                    const existingOptions = col.options || [];
                    if (existingOptions.some(o => o.label.toLowerCase() === optionLabel.toLowerCase())) return col;

                    const COLORS = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];
                    const nextColor = COLORS[existingOptions.length % COLORS.length];

                    const newOption = {
                        id: optionLabel, // Simple ID for now
                        label: optionLabel,
                        color: nextColor
                    };

                    return { ...col, options: [...existingOptions, newOption] };
                }
                return col;
            });
        });

        // Also update the row that triggered this to select the new option
        if (activeCell?.rowId && activeCell?.colId === colId) {
            handleUpdateRow(activeCell.rowId, { [colId]: optionLabel }, activeCell.rowId === CREATION_ROW_ID ? 'group-1' : undefined); // Group ID handling might need check but usually undefined works for standard rows if we find them
        }
    };

    const handleEditColumnOption = (colId: string, optionId: string, newLabel: string, newColor: string) => {
        setColumns(prevCols => {
            return prevCols.map(col => {
                if (col.id === colId) {
                    const existingOptions = col.options || [];
                    const oldOption = existingOptions.find(o => o.id === optionId);
                    const oldLabel = oldOption?.label;

                    const updatedOptions = existingOptions.map(opt =>
                        opt.id === optionId ? { ...opt, label: newLabel, color: newColor } : opt
                    );

                    // Update any rows that had the old label
                    if (oldLabel && oldLabel !== newLabel) {
                        setRows(prevRows => prevRows.map(row =>
                            row[colId] === oldLabel ? { ...row, [colId]: newLabel } : row
                        ));
                    }

                    return { ...col, options: updatedOptions };
                }
                return col;
            });
        });
    };

    const handleDeleteColumnOption = (colId: string, optionId: string) => {
        setColumns(prevCols => {
            return prevCols.map(col => {
                if (col.id === colId) {
                    const existingOptions = col.options || [];
                    const optionToDelete = existingOptions.find(o => o.id === optionId);
                    const labelToDelete = optionToDelete?.label;

                    // Clear any rows that had this option
                    if (labelToDelete) {
                        setRows(prevRows => prevRows.map(row =>
                            row[colId] === labelToDelete ? { ...row, [colId]: '' } : row
                        ));
                    }

                    return { ...col, options: existingOptions.filter(opt => opt.id !== optionId) };
                }
                return col;
            });
        });
    };

    // Drag & Drop Handlers (Rows)
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id !== over.id) {
            // Find which group contains the dragged row
            setTableGroups(prevGroups => {
                const updatedGroups = prevGroups.map(group => {
                    const oldIndex = group.rows.findIndex(row => row.id === active.id);
                    const newIndex = group.rows.findIndex(row => row.id === over.id);

                    // Only update if both rows are in this group
                    if (oldIndex !== -1 && newIndex !== -1) {
                        const newRows = arrayMove(group.rows, oldIndex, newIndex);
                        return { ...group, rows: newRows };
                    }
                    return group;
                });

                // Call onUpdateTasks with all rows
                if (onUpdateTasks) {
                    const allRows = updatedGroups.flatMap(g => g.rows);
                    onUpdateTasks(allRows);
                }

                return updatedGroups;
            });
        }
    };

    // Drag & Drop Handlers (Columns & Groups)
    const handleStructureDragStart = (event: DragStartEvent) => {
        const activeId = event.active.id as string;

        // Check if group drag
        if (tableGroups.some(g => g.id === activeId)) {
            // Group drag - nothing special for now
            return;
        }

        // Column drag
        // ID format: "groupId__colId" or just "colId" if we change strategy
        const colId = activeId.includes('__') ? activeId.split('__')[1] : activeId;
        setActiveColumnDragId(colId);

        // Track initial mouse position for ghost overlay
        const activatorEvent = event.activatorEvent as MouseEvent | TouchEvent;
        if (activatorEvent) {
            const clientX = 'touches' in activatorEvent ? activatorEvent.touches[0].clientX : activatorEvent.clientX;
            const clientY = 'touches' in activatorEvent ? activatorEvent.touches[0].clientY : activatorEvent.clientY;
            setColumnDragMousePos({ x: clientX, y: clientY });
            lastColumnDragMouseX.current = clientX;
        }
    };

    const handleStructureDragOver = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        // Group Drag Over
        const isGroupDrag = tableGroups.some(g => g.id === activeId);
        if (isGroupDrag) {
            // Reordering groups logic - done in DragEnd usually for simple lists,
            // but can do here for live preview if arrayMove is fast enough
            // Let's do it in DragEnd for stability or here for responsiveness?
            // sortableKeyboardCoordinates defaults handle sort preview.
            // But we need to update state if we want real-time preview if using SortableContext
            if (activeId !== overId) {
                setTableGroups((groups) => {
                    const oldIndex = groups.findIndex((g) => g.id === activeId);
                    const newIndex = groups.findIndex((g) => g.id === overId);
                    if (oldIndex !== -1 && newIndex !== -1) {
                        return arrayMove(groups, oldIndex, newIndex);
                    }
                    return groups;
                });
            }
            return;
        }

        // Column Drag Over
        const activeColId = activeId.includes('__') ? activeId.split('__')[1] : activeId;
        const overColId = overId.includes('__') ? overId.split('__')[1] : overId;

        if (activeColId !== overColId) {
            setColumns((items) => {
                const oldIndex = items.findIndex((item) => item.id === activeColId);
                const newIndex = items.findIndex((item) => item.id === overColId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    return arrayMove(items, oldIndex, newIndex);
                }
                return items;
            });
        }
    };

    const handleStructureDragEnd = (event: DragEndEvent) => {
        setActiveColumnDragId(null);
        setColumnDragMousePos(null);
        // Cancel any pending auto-scroll
        if (columnDragAutoScrollRef.current) {
            cancelAnimationFrame(columnDragAutoScrollRef.current);
            columnDragAutoScrollRef.current = null;
        }
    };

    // Auto-scroll during column drag
    useEffect(() => {
        if (!activeColumnDragId || !tableBodyRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            setColumnDragMousePos({ x: e.clientX, y: e.clientY });
            lastColumnDragMouseX.current = e.clientX;

            const rect = tableBodyRef.current?.getBoundingClientRect();
            if (!rect) return;

            const scrollMargin = 80;
            const maxScrollSpeed = 15;

            // Cancel existing auto-scroll
            if (columnDragAutoScrollRef.current) {
                cancelAnimationFrame(columnDragAutoScrollRef.current);
                columnDragAutoScrollRef.current = null;
            }

            const doAutoScroll = () => {
                if (!tableBodyRef.current) return;

                const currentRect = tableBodyRef.current.getBoundingClientRect();
                const mouseX = lastColumnDragMouseX.current;
                let scrolled = false;

                if (mouseX < currentRect.left + scrollMargin) {
                    const distanceFromEdge = currentRect.left + scrollMargin - mouseX;
                    const speed = Math.min(maxScrollSpeed, Math.max(3, distanceFromEdge / 5));
                    tableBodyRef.current.scrollLeft -= speed;
                    scrolled = true;
                } else if (mouseX > currentRect.right - scrollMargin) {
                    const distanceFromEdge = mouseX - (currentRect.right - scrollMargin);
                    const speed = Math.min(maxScrollSpeed, Math.max(3, distanceFromEdge / 5));
                    tableBodyRef.current.scrollLeft += speed;
                    scrolled = true;
                }

                if (scrolled) {
                    columnDragAutoScrollRef.current = requestAnimationFrame(doAutoScroll);
                }
            };

            // Start auto-scroll if near edges
            if (e.clientX < rect.left + scrollMargin || e.clientX > rect.right - scrollMargin) {
                columnDragAutoScrollRef.current = requestAnimationFrame(doAutoScroll);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            if (columnDragAutoScrollRef.current) {
                cancelAnimationFrame(columnDragAutoScrollRef.current);
            }
        };
    }, [activeColumnDragId]);

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

    const handleRenameColumn = (colId: string, newName: string) => {
        setColumns(columns.map(c => c.id === colId ? { ...c, label: newName } : c));
    };

    const handleSort = (colId: string) => {
        // Prevent sort from firing right after column resize
        if (justFinishedResizing.current) {
            return;
        }

        // New Sort Logic (Toolbar)
        if (sortRules && sortRules.find(r => r.column === colId)) {
            setSortRules(prev => {
                const existing = prev.find(r => r.column === colId);
                if (existing) {
                    return existing.direction === 'asc'
                        ? [{ id: 'sort-' + Date.now(), column: colId, direction: 'desc' }]
                        : []; // Toggle Off
                }
                return [{ id: 'sort-' + Date.now(), column: colId, direction: 'asc' }];
            });
            return;
        }

        // Fallback / legacy support update
        setSortRules([{ id: 'sort-' + Date.now(), column: colId, direction: 'asc' }]);
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingColId.current) return;
        // In RTL mode, dragging left should increase width, so we reverse the diff
        const diff = isRTL
            ? (startX.current - e.clientX)
            : (e.clientX - startX.current);
        const newWidth = startWidth.current + diff;

        setColumns(cols => cols.map(col => {
            if (col.id === resizingColId.current) {
                return { ...col, width: Math.max(col.minWidth, newWidth) };
            }
            return col;
        }));
    }, [isRTL]);

    const onMouseUp = useCallback(() => {
        resizingColId.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'default';
        // Prevent sort from firing immediately after resize
        justFinishedResizing.current = true;
        setTimeout(() => {
            justFinishedResizing.current = false;
        }, 100);
    }, [onMouseMove]);

    // --- Rendering Helpers ---
    const handleTextColorChange = (rowId: string, colId: string, color: string) => {
        const row = rows.find(r => r.id === rowId);
        if (!row) return;

        const currentStyles = row._styles || {};
        const colStyles = currentStyles[colId] || {};

        const newStyles = {
            ...currentStyles,
            [colId]: { ...colStyles, color }
        };

        handleUpdateRow(rowId, { _styles: newStyles });
    };

    // Handler to update column configuration (for Formula, Button, AutoNumber configs)
    const handleUpdateColumn = useCallback((colId: string, updates: Partial<Column>) => {
        setColumns(prevCols => prevCols.map(col =>
            col.id === colId ? { ...col, ...updates } : col
        ));
    }, [setColumns]);

    const renderCellContent = (col: Column, row: Row, inputRef?: React.Ref<HTMLInputElement>) => {
        // Calculate row index for auto-numbering (find position in full rows array)
        const rowIndex = rows.findIndex(r => r.id === row.id);

        return (
            <TableCell
                col={col}
                row={row}
                columns={columns}
                activeCell={activeCell}
                customStatuses={customStatuses}
                boardId={roomId}
                allRows={rows}
                rowIndex={rowIndex >= 0 ? rowIndex : 0}
                onUpdateRow={handleUpdateRow}
                onUpdateColumn={handleUpdateColumn}
                onTextChange={handleTextChange}
                onToggleCell={toggleCell}
                onSetActiveCell={setActiveCell}
                onNavigateToNextCell={navigateToNextCell}
                onAddCustomStatus={handleAddCustomStatus}
                onDeleteCustomStatus={handleDeleteCustomStatus}
                onAddColumnOption={handleAddColumnOption}
                onEditColumnOption={handleEditColumnOption}
                onDeleteColumnOption={handleDeleteColumnOption}
                onSetActiveColorMenu={setActiveColorMenu}
                onSetActiveTextMenu={setActiveTextMenu}
                onFileUploadRequest={(rowId, colId) => {
                    setActiveUploadCell({ rowId, colId });
                    hiddenFileInputRef.current?.click();
                }}
                onNavigate={onNavigate}
                inputRef={inputRef}
            />
        );
    };

    // --- Selection State ---
    // Derived from the actual row data (single source of truth)
    const checkedRows = useMemo(() => {
        return new Set(rows.filter(r => !!r['select']).map(r => r.id));
    }, [rows]);

    const toggleRowSelection = (rowId: string) => {
        // Find current value
        const row = rows.find(r => r.id === rowId);
        if (row) {
            handleUpdateRow(rowId, { 'select': !row['select'] });
        }
    };

    const renderRowContent = (row: Row, dragListeners?: any, isOverlay = false) => {
        return (
            <TableRowContent
                row={row}
                dragListeners={dragListeners}
                isOverlay={isOverlay}
                visibleColumns={visibleColumns}
                checkedRows={checkedRows}
                columns={columns}
                onToggleRowSelection={toggleRowSelection}
                onDeleteRow={handleDeleteRow}
                onSelectColumnContextMenu={(rect) => setActiveColorMenu({ rect })}
                renderCellContent={renderCellContent}
                isRTL={isRTL}
                activeColumnDragId={activeColumnDragId}
            />
        );
    };


    return (
        <div className="flex flex-col w-full h-full bg-stone-50 dark:bg-stone-900/50 font-sans">
            {/* Header Actions - Optional if needed, currently empty/handled by parent view */}

            {/* Scrollable Container */}
            <div className="flex-1 flex flex-col min-h-0 relative">

                {/* Secondary Toolbar */}
                <div className="flex items-center min-h-[52px] border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-monday-dark-surface px-4 shrink-0 transition-colors z-20 gap-2">
                    {/* Left: New Table */}


                    {/* Left: Action Icons */}
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 relative flex-wrap">
                        {/* Export Button */}


                        {/* Search - Expandable */}
                        <div className="relative">
                            <div
                                className={`flex items-center gap-1.5 cursor-pointer transition-all duration-300 ease-out ${isSearchOpen ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700' : 'hover:text-blue-500'}`}
                                onClick={() => {
                                    if (!isSearchOpen) {
                                        setIsSearchOpen(true);
                                        setTimeout(() => searchInputRef.current?.focus(), 100);
                                    }
                                }}
                            >
                                <MagnifyingGlass size={16} weight="regular" className="flex-shrink-0" />
                                <div className={`overflow-hidden transition-all duration-300 ease-out ${isSearchOpen ? 'w-48' : 'w-auto'}`}>
                                    {isSearchOpen ? (
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder={t('search_this_board')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') {
                                                    setIsSearchOpen(false);
                                                    setSearchQuery('');
                                                }
                                            }}
                                            className="w-full bg-transparent border-none outline-none text-[13px] text-stone-700 dark:text-stone-200 placeholder:text-stone-400"
                                        />
                                    ) : (
                                        <span className="text-[13px] font-medium">{t('search')}</span>
                                    )}
                                </div>
                                {isSearchOpen && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsSearchOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Person Filter */}
                        <div className="relative">
                            <div
                                data-toolbar-button
                                className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${isPersonFilterOpen || personFilter ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-md' : 'hover:text-blue-500'}`}
                                onClick={() => {
                                    if (!isPersonFilterOpen) {
                                        setIsFilterPanelOpen(false);
                                        setIsSortPanelOpen(false);
                                        setIsHideColumnsOpen(false);
                                        setIsSearchOpen(false);
                                    }
                                    setIsPersonFilterOpen(!isPersonFilterOpen);
                                }}
                            >
                                <UserCircle size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                                <span className="text-[13px] font-medium">{t('person')}</span>
                            </div>
                            {isPersonFilterOpen && (
                                <div data-toolbar-panel className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[320px]">
                                    <div className="mb-3">
                                        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                                            {t('filter_by_person')}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Get unique people from rows */}
                                        {/* Get unique people from rows */}
                                        {(() => {
                                            // Extract all people objects
                                            const allPeople = rows.flatMap(r => {
                                                const p = r.people;
                                                if (Array.isArray(p)) return p;
                                                if (p) return [p];
                                                return [];
                                            });

                                            // Deduplicate by ID or Name
                                            const uniquePeopleMap = new Map();
                                            allPeople.forEach((p: any) => {
                                                const id = p.id || p.name || (typeof p === 'string' ? p : null);
                                                if (id && !uniquePeopleMap.has(id)) {
                                                    uniquePeopleMap.set(id, p);
                                                }
                                            });

                                            const uniquePeople = Array.from(uniquePeopleMap.values());

                                            return uniquePeople.map((person: any) => {
                                                const isActive = personFilter === (person.name || person);

                                                return (
                                                    <PersonAvatarItem
                                                        key={person.id || person.name || person}
                                                        person={person}
                                                        isActive={isActive}
                                                        onClick={() => {
                                                            setPersonFilter(isActive ? null : (person.name || person));
                                                            setIsPersonFilterOpen(false);
                                                        }}
                                                    />
                                                );
                                            });
                                        })()}

                                        {rows.every(r => !r.people) && (
                                            <div className="w-10 h-10 rounded-full border-2 border-stone-200 dark:border-stone-600 flex items-center justify-center" title={t('no_assigned_users')}>
                                                <UserCircle size={24} weight="regular" className="text-stone-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filter Panel */}
                        <div className="relative">
                            <div
                                data-toolbar-button
                                className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${isFilterPanelOpen || filters.length > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-md' : 'hover:text-blue-500'}`}
                                onClick={() => {
                                    if (!isFilterPanelOpen) {
                                        setIsPersonFilterOpen(false);
                                        setIsSortPanelOpen(false);
                                        setIsHideColumnsOpen(false);
                                        setIsSearchOpen(false);
                                    }
                                    setIsFilterPanelOpen(!isFilterPanelOpen);
                                }}
                            >
                                <Funnel size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                                <span className="text-[13px] font-medium">{t('filter')}</span>
                                <ChevronDown size={12} weight="regular" className={`opacity-50 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isFilterPanelOpen && (
                                <div data-toolbar-panel className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[600px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">{t('advanced_filters')}</span>
                                            <span className="text-xs text-stone-400">{t('showing_items').replace('{0}', String(filteredTableGroups.reduce((acc, g) => acc + g.rows.length, 0))).replace('{1}', String(rows.length))}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {filters.length > 0 && (
                                                <button
                                                    onClick={() => setFilters([])}
                                                    className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1"
                                                >
                                                    {t('clear_all')}
                                                </button>
                                            )}
                                            <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border border-stone-200 dark:border-stone-600 px-2 py-1 rounded">
                                                {t('save_as_new_view')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filter Rules */}
                                    <div className="space-y-2 mb-3">
                                        {filters.map((filter, idx) => (
                                            <div key={filter.id} className="flex items-center gap-2">
                                                <span className="text-xs text-stone-500 w-12">{idx === 0 ? t('where') : t('and_condition')}</span>
                                                <select
                                                    value={filter.column}
                                                    onChange={(e) => {
                                                        setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, column: e.target.value, condition: '', value: '' } : f));
                                                    }}
                                                    className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                                                >
                                                    <option value="">{t('column_label')}</option>
                                                    {columns.filter(c => c.id !== 'select').map(col => (
                                                        <option key={col.id} value={col.id}>{col.label}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={filter.condition}
                                                    onChange={(e) => {
                                                        setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, condition: e.target.value } : f));
                                                    }}
                                                    className="w-40 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                                                >
                                                    <option value="">{t('condition_label')}</option>
                                                    {filter.column && getConditionsForType(columns.find(c => c.id === filter.column)?.type || 'text').map(cond => (
                                                        <option key={cond.value} value={cond.value}>{cond.label}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    placeholder={t('value_label')}
                                                    value={filter.value}
                                                    onChange={(e) => {
                                                        setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, value: e.target.value } : f));
                                                    }}
                                                    className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                                                />
                                                <button
                                                    onClick={() => setFilters(prev => prev.filter(f => f.id !== filter.id))}
                                                    className="text-stone-400 hover:text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {filters.length === 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-stone-500 w-12">{t('where')}</span>
                                                <select className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                                                    <option>{t('column_label')}</option>
                                                </select>
                                                <select className="w-40 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                                                    <option>{t('condition_label')}</option>
                                                </select>
                                                <input placeholder={t('value_label')} className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700" readOnly />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setFilters(prev => [...prev, { id: `filter-${Date.now()}`, column: '', condition: '', value: '' }])}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            {t('new_filter')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sort Panel */}
                        <div className="relative">
                            <div
                                data-toolbar-button
                                className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${isSortPanelOpen || sortRules.length > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-md' : 'hover:text-blue-500'}`}
                                onClick={() => {
                                    if (!isSortPanelOpen) {
                                        setIsPersonFilterOpen(false);
                                        setIsFilterPanelOpen(false);
                                        setIsHideColumnsOpen(false);
                                        setIsSearchOpen(false);
                                    }
                                    setIsSortPanelOpen(!isSortPanelOpen);
                                }}
                            >
                                <ArrowsDownUp size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                                <span className="text-[13px] font-medium">{t('sort')}</span>
                            </div>
                            {isSortPanelOpen && (
                                <div data-toolbar-panel className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[400px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                                            {t('sort_by')}
                                            <span className="w-4 h-4 rounded-full border border-stone-300 text-[10px] flex items-center justify-center text-stone-400">?</span>
                                        </span>
                                        <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border border-stone-200 dark:border-stone-600 px-2 py-1 rounded">
                                            {t('save_as_new_view')}
                                        </button>
                                    </div>

                                    <div className="space-y-2 mb-3">
                                        {sortRules.map((rule) => (
                                            <div key={rule.id} className="flex items-center gap-2">
                                                <div className="text-stone-400 cursor-grab">⋮⋮</div>
                                                <select
                                                    value={rule.column}
                                                    onChange={(e) => {
                                                        setSortRules(prev => prev.map(r => r.id === rule.id ? { ...r, column: e.target.value } : r));
                                                    }}
                                                    className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                                                >
                                                    <option value="">{t('choose_column')}</option>
                                                    {columns.filter(c => c.id !== 'select').map(col => (
                                                        <option key={col.id} value={col.id}>{col.label}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={rule.direction}
                                                    onChange={(e) => {
                                                        setSortRules(prev => prev.map(r => r.id === rule.id ? { ...r, direction: e.target.value as 'asc' | 'desc' } : r));
                                                    }}
                                                    className="w-36 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                                                >
                                                    <option value="asc">{t('ascending')}</option>
                                                    <option value="desc">{t('descending')}</option>
                                                </select>
                                                <button
                                                    onClick={() => setSortRules(prev => prev.filter(r => r.id !== rule.id))}
                                                    className="text-stone-400 hover:text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {sortRules.length === 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="text-stone-300">⋮⋮</div>
                                                <select className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                                                    <option>{t('choose_column')}</option>
                                                </select>
                                                <select className="w-36 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                                                    <option>{t('ascending')}</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setSortRules(prev => [...prev, { id: `sort-${Date.now()}`, column: '', direction: 'asc' }])}
                                        className="text-xs text-stone-400 hover:text-stone-600"
                                    >
                                        {t('new_sort')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Hide Columns */}
                        <div className="relative">
                            <div
                                data-toolbar-button
                                className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${isHideColumnsOpen || hiddenColumns.size > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-md' : 'hover:text-blue-500'}`}
                                onClick={() => {
                                    if (!isHideColumnsOpen) {
                                        setIsPersonFilterOpen(false);
                                        setIsFilterPanelOpen(false);
                                        setIsSortPanelOpen(false);
                                        setIsSearchOpen(false);
                                    }
                                    setIsHideColumnsOpen(!isHideColumnsOpen);
                                }}
                            >
                                <EyeSlash size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                                <span className="text-[13px] font-medium">{t('hide')}</span>
                            </div>
                            {isHideColumnsOpen && (
                                <div data-toolbar-panel className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[320px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{t('display_columns')}</span>
                                        <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border border-stone-200 dark:border-stone-600 px-2 py-1 rounded">
                                            {t('save_as_new_view')}
                                        </button>
                                    </div>

                                    <div className="relative mb-3">
                                        <MagnifyingGlass size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                        <input
                                            type="text"
                                            placeholder={t('find_columns')}
                                            value={columnSearchQuery}
                                            onChange={(e) => setColumnSearchQuery(e.target.value)}
                                            className="w-full h-9 ps-8 pe-3 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        {/* All columns toggle */}
                                        <label className="flex items-center gap-3 py-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hiddenColumns.size === 0}
                                                onChange={() => {
                                                    if (hiddenColumns.size === 0) {
                                                        setHiddenColumns(new Set(columns.filter(c => c.id !== 'select' && c.id !== 'name').map(c => c.id)));
                                                    } else {
                                                        setHiddenColumns(new Set());
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                                                {t('all_columns')}
                                            </span>
                                            <span className="text-xs text-stone-400 ml-auto">
                                                {t('x_selected').replace('{0}', String(columns.filter(c => c.id !== 'select' && !hiddenColumns.has(c.id)).length))}
                                            </span>
                                        </label>

                                        {/* Individual columns */}
                                        {columns
                                            .filter(c => c.id !== 'select')
                                            .filter(c => columnSearchQuery === '' || c.label.toLowerCase().includes(columnSearchQuery.toLowerCase()))
                                            .map(col => (
                                                <label key={col.id} className="flex items-center gap-3 py-1.5 ps-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700/50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={!hiddenColumns.has(col.id)}
                                                        onChange={() => {
                                                            setHiddenColumns(prev => {
                                                                const newSet = new Set(prev);
                                                                if (newSet.has(col.id)) {
                                                                    newSet.delete(col.id);
                                                                } else {
                                                                    newSet.add(col.id);
                                                                }
                                                                return newSet;
                                                            });
                                                        }}
                                                        disabled={col.id === 'name'} // Can't hide name column
                                                        className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs ${col.type === 'people' ? 'bg-blue-500' :
                                                        col.type === 'status' ? 'bg-emerald-500' :
                                                            col.type === 'date' ? 'bg-amber-500' :
                                                                col.type === 'priority' ? 'bg-purple-500' :
                                                                    'bg-stone-400'
                                                        }`}>
                                                        {col.type === 'people' ? '👤' : col.type === 'status' ? '▣' : col.type === 'date' ? '📅' : col.type === 'priority' ? '!' : '≡'}
                                                    </div>
                                                    <span className="text-sm text-stone-700 dark:text-stone-200">{col.label}</span>
                                                </label>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Clear Data Button */}
                        <div
                            data-toolbar-button
                            className="flex items-center gap-1.5 cursor-pointer transition-colors group hover:text-red-500"
                            onClick={() => setIsClearDataModalOpen(true)}
                        >
                            <Trash size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                            <span className="text-[13px] font-medium">{t('clear')}</span>
                        </div>

                        {/* Group by */}
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors group">
                            <Stack size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                            <span className="text-[13px] font-medium">{t('group_by')}</span>
                        </div>

                        {/* Selection Actions (Always Visible, Grey if disabled) */}
                        <div className="flex items-center gap-2 ms-2 flex-shrink-0">
                            <div className="h-5 w-px bg-stone-200 dark:bg-stone-800 mx-1" />

                            <button
                                disabled={checkedRows.size === 0}
                                className={`flex items-center gap-1.5 transition-colors group ${checkedRows.size > 0
                                    ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-blue-600'
                                    : 'cursor-default text-stone-300 dark:text-stone-700'
                                    }`}
                            >
                                <Copy size={16} weight="regular" className={checkedRows.size > 0 ? "group-hover:scale-110 transition-transform" : ""} />
                                <span className="text-[13px] font-medium">{t('duplicate')}</span>
                            </button>

                            <button
                                disabled={checkedRows.size === 0}
                                className={`flex items-center gap-1.5 transition-colors group ${checkedRows.size > 0
                                    ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-blue-600'
                                    : 'cursor-default text-stone-300 dark:text-stone-700'
                                    }`}
                            >
                                <Archive size={16} weight="regular" className={checkedRows.size > 0 ? "group-hover:scale-110 transition-transform" : ""} />
                                <span className="text-[13px] font-medium">{t('archive')}</span>
                            </button>

                            <button
                                disabled={checkedRows.size === 0}
                                onClick={() => {
                                    if (checkedRows.size === 0) return;
                                    setDeleteConfig({
                                        isOpen: true,
                                        title: t('delete_x_items').replace('{0}', String(checkedRows.size)),
                                        description: t('this_action_cannot_be_undone'),
                                        onConfirm: () => {
                                            const rowsToDelete = rows.filter(r => checkedRows.has(r.id));

                                            // Optimistic local update
                                            setRows(prev => prev.filter(r => !checkedRows.has(r.id)));

                                            if (onDeleteTask) {
                                                // Explicit deletion via hook
                                                rowsToDelete.forEach(row => {
                                                    const groupId = row.groupId || row.status || 'To Do';
                                                    onDeleteTask(groupId, row.id);
                                                });
                                            } else {
                                                // Fallback to sync update
                                                const newRows = rows.filter(r => !checkedRows.has(r.id));
                                                onUpdateTasks?.(newRows);
                                            }

                                            // setCheckedRows(new Set()); // No longer needed as checkedRows is derived from rows
                                        }
                                    });
                                }}
                                className={`flex items-center gap-1.5 transition-colors group ${checkedRows.size > 0
                                    ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-red-600'
                                    : 'cursor-default text-stone-300 dark:text-stone-700'
                                    }`}
                            >
                                <Trash size={16} weight="regular" className={checkedRows.size > 0 ? "group-hover:scale-110 transition-transform" : ""} />
                                <span className="text-[13px] font-medium">{t('delete')}</span>
                            </button>

                            <div className="h-4 w-px bg-stone-200 dark:bg-stone-700" />

                            <button
                                onClick={handleExportTable}
                                className="flex items-center gap-1.5 transition-colors group cursor-pointer text-stone-600 dark:text-stone-300 hover:text-blue-600"
                                title={checkedRows.size > 0 ? t('export_selected_rows').replace('{0}', String(checkedRows.size)) : t('export_all_rows')}
                            >
                                <Export size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                                <span className="text-[13px] font-medium">{t('export_data')}</span>
                            </button>

                            <button
                                onClick={handleImportClick}
                                className="flex items-center gap-1.5 transition-colors group cursor-pointer text-stone-600 dark:text-stone-300 hover:text-green-600"
                                title={t('import_from_file')}
                            >
                                <UploadCloud size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[13px] font-medium">{t('import_data_btn')}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0" />

                    {/* Right: Custom Actions */}
                    <div className="flex items-center gap-4">
                        {renderCustomActions && renderCustomActions({
                            setRows,
                            setColumns,
                            setIsChartModalOpen,
                            setIsAIReportModalOpen
                        })}

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Table Scrollable Area */}
                <div
                    ref={tableBodyRef}
                    className="flex-1 overflow-y-auto overflow-x-auto bg-white dark:bg-stone-900 relative"
                    dir={dir}
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        paddingBottom: '40px',
                        overscrollBehavior: 'none',
                        isolation: 'isolate',
                    }}
                >
                    {/* Auto-scroll happens automatically - no visual indicators needed for clean look */}

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



                    {/* Table Groups - Wrapped in single DndContext for Columns */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleStructureDragStart}
                        onDragOver={handleStructureDragOver}
                        onDragEnd={handleStructureDragEnd}
                    >
                        <SortableContext
                            items={paginatedGroups.map(g => g.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {paginatedGroups.map((group, groupIndex) => {
                                const totalWidth = columns.reduce((acc, col) => acc + col.width, 0);
                                return (
                                    <SortableGroupWrapper key={group.id} group={group}>
                                        <div className={hideGroupHeader && groupIndex > 0 ? "" : "mb-4"}>
                                            {/* Group Header - wrapper spans full width, content is sticky left */}
                                            {(!hideGroupHeader || paginatedGroups.length > 1) && (
                                                <div
                                                    className="shrink-0 bg-white dark:bg-monday-dark-surface border-b border-stone-100 dark:border-stone-800/50 sticky top-0 z-50"
                                                    style={{
                                                        minWidth: totalWidth,
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 px-4 py-3 sticky start-0 z-10 w-fit bg-white dark:bg-monday-dark-surface">
                                                        {/* Color accent bar (Drag Handle) */}
                                                        <GroupDragHandle colorClass={group.color.bg} />
                                                        <button
                                                            onClick={() => handleToggleGroupCollapse(group.id)}
                                                            className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md transition-colors text-stone-500 hover:text-stone-700"
                                                        >
                                                            {group.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                        </button>

                                                        {/* Pin Button */}
                                                        <button
                                                            onClick={() => handleToggleGroupPin(group.id)}
                                                            className={`p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md transition-colors ${group.isPinned ? 'text-blue-600 dark:text-blue-400 rotate-45' : 'text-stone-400 hover:text-stone-600'}`}
                                                            title={group.isPinned ? t('unpin_group') : t('pin_group')}
                                                        >
                                                            <Pin size={16} className={group.isPinned ? "fill-current" : ""} />
                                                        </button>
                                                        <EditableName
                                                            name={group.name}
                                                            onRename={(newName) => handleUpdateGroupName(group.id, newName)}
                                                            className={`${group.color.text} text-[24px]`}
                                                        />
                                                        <span className="text-xs text-stone-400 ms-2">
                                                            {group.rows.length} {group.rows.length === 1 ? t('item_singular') : t('items_plural')}
                                                        </span>
                                                        {/* 3-dot menu */}
                                                        <div className="relative ms-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const menu = e.currentTarget.nextElementSibling;
                                                                    if (menu) {
                                                                        menu.classList.toggle('hidden');
                                                                    }
                                                                }}
                                                                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                                                            >
                                                                <MoreHorizontal size={16} className="text-stone-400" />
                                                            </button>
                                                            <div className="hidden absolute start-0 top-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl z-50 min-w-[120px] py-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteConfig({
                                                                            isOpen: true,
                                                                            title: t('delete_group_confirm').replace('{0}', group.name),
                                                                            description: t('delete_group_description'),
                                                                            onConfirm: () => handleDeleteGroup(group.id)
                                                                        });
                                                                        const menu = e.currentTarget.parentElement;
                                                                        if (menu) menu.classList.add('hidden');
                                                                    }}
                                                                    className="w-full text-start px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                                >
                                                                    <Trash size={14} />
                                                                    {t('delete')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {!group.isCollapsed && (
                                                <>
                                                    {/* Table Header - show for ALL groups */}
                                                    {/* Table Header - show for ALL groups unless hidden for simplified view (Data Table) */}
                                                    {(groupIndex === 0 || !hideGroupHeader) && (
                                                        <SortableContext items={visibleColumns.map(c => `${group.id}__${c.id}`)} strategy={horizontalListSortingStrategy}>
                                                            <div
                                                                className="group flex items-center border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 h-10 flex-shrink-0 min-w-max sticky z-[35]"
                                                                style={{
                                                                    top: hideGroupHeader ? 0 : '57px',
                                                                }}
                                                            >
                                                                {visibleColumns.map((col, index) => {
                                                                    const isSticky = !!col.pinned;
                                                                    let leftPos = 0;
                                                                    if (isSticky) {
                                                                        for (let i = 0; i < index; i++) {
                                                                            if (visibleColumns[i].pinned) leftPos += visibleColumns[i].width;
                                                                        }
                                                                    }

                                                                    return (
                                                                        <TableHeaderCell
                                                                            key={`${group.id}__${col.id}`}
                                                                            col={col}
                                                                            index={index}
                                                                            columnsLength={visibleColumns.length}
                                                                            group={group}
                                                                            rows={rows}
                                                                            renamingColId={renamingColId}
                                                                            setRenamingColId={setRenamingColId}
                                                                            handleRenameColumn={handleRenameColumn}
                                                                            handleSort={handleSort}
                                                                            sortDirection={sortRules?.find(r => r.column === col.id)?.direction || null}
                                                                            handleDeleteColumn={handleDeleteColumn}
                                                                            handleSelectAll={handleSelectAll}
                                                                            setActiveHeaderMenu={setActiveHeaderMenu}
                                                                            startResize={startResize}
                                                                            activeColumnDragId={activeColumnDragId}
                                                                            // Pass styling props directly
                                                                            style={{
                                                                                width: col.width,
                                                                                ...(isSticky && {
                                                                                    [isRTL ? 'right' : 'left']: leftPos,
                                                                                    position: 'sticky',
                                                                                    willChange: isRTL ? 'transform, right' : 'transform, left',
                                                                                }),
                                                                                backgroundColor: col.headerColor || col.backgroundColor || (isSticky ? undefined : undefined)
                                                                            }}
                                                                            showRightShadow={isSticky && !visibleColumns[index + 1]?.pinned}
                                                                        />
                                                                    );
                                                                })}
                                                                <div className="relative h-full flex flex-col justify-center shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setActiveColumnMenu({ rect });
                                                                        }}
                                                                        onPointerDown={(e) => e.stopPropagation()}
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
                                                                                    // Position menu to stay within viewport
                                                                                    // Menu width is ~350px, so check if there's room
                                                                                    ...((() => {
                                                                                        const menuWidth = 350;
                                                                                        const buttonRect = activeColumnMenu.rect;
                                                                                        const viewportWidth = window.innerWidth;
                                                                                        const padding = 8;

                                                                                        if (isRTL) {
                                                                                            // In RTL: button is typically at the left end of the table
                                                                                            // Try to position menu extending rightward from button
                                                                                            const spaceOnRight = viewportWidth - buttonRect.left;
                                                                                            if (spaceOnRight >= menuWidth + padding) {
                                                                                                // Enough space on right - align menu's left edge to button's left edge
                                                                                                return { left: `${Math.max(padding, buttonRect.left)}px` };
                                                                                            } else {
                                                                                                // Not enough space - align to right edge of viewport
                                                                                                return { right: `${padding}px` };
                                                                                            }
                                                                                        } else {
                                                                                            // In LTR: button is typically at the right end of the table
                                                                                            // Try to position menu extending leftward from button
                                                                                            const spaceOnLeft = buttonRect.right;
                                                                                            if (spaceOnLeft >= menuWidth + padding) {
                                                                                                // Enough space on left - align menu's right edge to button's right edge
                                                                                                return { right: `${Math.max(padding, viewportWidth - buttonRect.right)}px` };
                                                                                            } else {
                                                                                                // Not enough space - align to left edge of viewport
                                                                                                return { left: `${padding}px` };
                                                                                            }
                                                                                        }
                                                                                    })()),
                                                                                }}
                                                                            >
                                                                                <ColumnMenu
                                                                                    onClose={() => setActiveColumnMenu(null)}
                                                                                    onSelect={(type, label, options) => { handleAddColumn(type, label, options); }}
                                                                                />
                                                                            </div>
                                                                        </>,
                                                                        document.body
                                                                    )}
                                                                </div>

                                                                {/* Context Menus */}
                                                                {/* Right spacer */}
                                                                {/* Right spacer */}
                                                                <div className="w-24 shrink-0" />
                                                            </div>
                                                        </SortableContext>
                                                    )}

                                                    {/* Group Rows */}
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragStart={handleDragStart}
                                                        onDragEnd={handleDragEnd}
                                                    >
                                                        {/* Creation Row (Draft) at Top */}
                                                        {/* We manually render a row-like structure for the creation row */}

                                                        {/* Creation Row (Draft) at Top - Only show for first group in Data Table mode, OR if multiple groups exist */}
                                                        {(!hideGroupHeader || groupIndex === 0 || paginatedGroups.length > 1) && (
                                                            <div className="group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 bg-white dark:bg-stone-900 min-w-max relative z-20">
                                                                {/* Simulate Row Data for Helpers */}
                                                                {(() => {
                                                                    const creationRowData: Row = {
                                                                        id: CREATION_ROW_ID,
                                                                        groupId: group.id,
                                                                        status: null,
                                                                        dueDate: null,
                                                                        date: new Date().toISOString(),
                                                                        priority: null,
                                                                        ...creationRows[group.id],
                                                                    } as Row; // Cast as partial row is handled

                                                                    return visibleColumns.map((col, index) => {
                                                                        const isSticky = !!col.pinned;
                                                                        let leftPos = 0;
                                                                        if (isSticky) {
                                                                            for (let i = 0; i < index; i++) {
                                                                                if (visibleColumns[i].pinned) leftPos += visibleColumns[i].width;
                                                                            }
                                                                        }

                                                                        return (
                                                                            <div
                                                                                key={col.id}
                                                                                style={{
                                                                                    width: col.width,
                                                                                    ...(isSticky && {
                                                                                        [isRTL ? 'right' : 'left']: leftPos,
                                                                                        position: 'sticky',
                                                                                        willChange: isRTL ? 'transform, right' : 'transform, left',
                                                                                    })
                                                                                }}
                                                                                className={`h-full border-e border-stone-100 dark:border-stone-800 ${col.id === 'select' ? 'flex items-center justify-center cursor-default' : ''} ${isSticky ? 'z-10 bg-white dark:bg-stone-900 shadow-sm' : ''} ${isSticky && !visibleColumns[index + 1]?.pinned ? `after:absolute ${isRTL ? 'after:left-0' : 'after:right-0'} after:top-0 after:h-full after:w-[1px] after:shadow-[2px_0_4px_rgba(0,0,0,0.08)]` : ''}`}
                                                                            >
                                                                                {col.id === 'select' ? (
                                                                                    <div className="w-full h-full flex items-center justify-center px-2">
                                                                                        {/* Empty */}
                                                                                    </div>
                                                                                ) : col.id === (visibleColumns.find(c => c.id === 'name') || visibleColumns.find(c => c.id !== 'select'))?.id ? (
                                                                                    renderCellContent(col, creationRowData, (el) => {
                                                                                        if (el) creationRowInputRefs.current[group.id] = el;
                                                                                    })
                                                                                ) : null}
                                                                            </div>
                                                                        );
                                                                    });
                                                                })()}
                                                            </div>
                                                        )}



                                                        <SortableContext items={group.rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                                            {group.rows.map((row) => (
                                                                <SortableRow
                                                                    key={row.id}
                                                                    row={row}
                                                                    className={`
                                                    group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50
                                                    hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors relative min-w-max
                                                    ${activeDragId === row.id ? 'opacity-30' : ''}
                                                    ${isDoneStatus(row.status) ? 'bg-green-50 dark:bg-green-900/20' : checkedRows.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-stone-900'}
                                                `}
                                                                >
                                                                    {(dragListeners, isRowDragging) => renderRowContent(row, dragListeners, isRowDragging)}
                                                                </SortableRow>
                                                            ))}
                                                        </SortableContext>

                                                        {createPortal(
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
                                                            </DragOverlay>,
                                                            document.body
                                                        )}
                                                    </DndContext>
                                                </>
                                            )}
                                        </div>
                                    </SortableGroupWrapper>
                                );
                            })}
                        </SortableContext>
                        {createPortal(
                            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                                {activeColumnDragId ? (() => {
                                    const dragCol = columns.find(c => c.id === activeColumnDragId);

                                    return (
                                        <div
                                            className="h-10 px-3 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded pointer-events-none border border-stone-300 dark:border-stone-600"
                                            style={{
                                                width: dragCol?.width || 150,
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                            }}
                                        >
                                            <span className="text-xs font-medium text-stone-600 dark:text-stone-300 truncate">
                                                {dragCol?.label || activeColumnDragId}
                                            </span>
                                        </div>
                                    );
                                })() : null}
                            </DragOverlay>,
                            document.body
                        )}
                    </DndContext>


                </div>

                {showPagination && (
                    <div className="shrink-0 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-monday-dark-surface">
                        <TablePagination
                            totalItems={rows.length}
                            pageSize={rowsPerPage}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size) => {
                                startTransition(() => {
                                    setRowsPerPage(size);
                                    setCurrentPageRaw(1);
                                });
                            }}
                            isLoading={isPending}
                        />
                    </div>
                )}

                {
                    activeReminderTarget && (
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
                    )
                }

                <ChartBuilderModal
                    isOpen={isChartModalOpen}
                    onClose={() => setIsChartModalOpen(false)}
                    columns={columns}
                    rows={rows}
                    onSave={(config) => {
                        boardLogger.info('Chart Config Saved:', config);
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

                <ExcelImportModal
                    isOpen={isExcelImportModalOpen}
                    onClose={() => setIsExcelImportModalOpen(false)}
                    onImport={handleExcelImport}
                    existingColumns={columns}
                    groupId={tableGroups[0]?.id}
                />

                <SaveToVaultModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    file={activeUploadFile}
                    onSuccess={handleSaveVaultSuccess}
                />

                {
                    deleteConfig && (
                        <DeleteConfirmationModal
                            isOpen={deleteConfig.isOpen}
                            onClose={() => setDeleteConfig(null)}
                            onConfirm={deleteConfig.onConfirm}
                            title={deleteConfig.title}
                            description={deleteConfig.description}
                        />
                    )
                }

                <ConfirmModal
                    isOpen={isClearDataModalOpen}
                    onClose={() => setIsClearDataModalOpen(false)}
                    onConfirm={handleClearTable}
                    title="Clear all data?"
                    description="This will permanently delete all rows from this table. This action cannot be undone."
                    confirmText="Clear Data"
                    type="danger"
                />

                <RowDetailPanel
                    isOpen={!!activeRowDetail}
                    onClose={() => setActiveRowDetail(null)}
                    row={activeRowDetail}
                    boardId={roomId}
                />
                <input
                    type="file"
                    ref={hiddenFileInputRef}
                    className="hidden"
                    onChange={handleHiddenFileChange}
                />

                {
                    activeHeaderMenu && (
                        <HeaderContextMenu
                            onClose={() => setActiveHeaderMenu(null)}
                            onHeaderColorSelect={(color) => {
                                const newCols = columns.map(c => c.id === activeHeaderMenu.colId ? { ...c, headerColor: color } : c);
                                setColumns(newCols);
                                setActiveHeaderMenu(null);
                            }}
                            onColumnColorSelect={(color) => {
                                // When coloring column, we color both the background AND the header to match user request "whole column including header"
                                const newCols = columns.map(c => c.id === activeHeaderMenu.colId ? { ...c, backgroundColor: color, headerColor: color } : c);
                                setColumns(newCols);
                                setActiveHeaderMenu(null);
                            }}
                            currentHeaderColor={columns.find(c => c.id === activeHeaderMenu.colId)?.headerColor}
                            currentColumnColor={columns.find(c => c.id === activeHeaderMenu.colId)?.backgroundColor}
                            position={activeHeaderMenu.position}
                            onSortAsc={() => {
                                setSortRules([{
                                    id: 'sort-' + Date.now(),
                                    column: activeHeaderMenu.colId,
                                    direction: 'asc'
                                }]);
                                setActiveHeaderMenu(null);
                            }}
                            onSortDesc={() => {
                                setSortRules([{
                                    id: 'sort-' + Date.now(),
                                    column: activeHeaderMenu.colId,
                                    direction: 'desc'
                                }]);
                                setActiveHeaderMenu(null);
                            }}
                            onFreezeToggle={() => {
                                if (activeHeaderMenu.colId) {
                                    handleToggleColumnFreeze(activeHeaderMenu.colId);
                                }
                                setActiveHeaderMenu(null);
                            }}
                            isFrozen={!!columns.find(c => c.id === activeHeaderMenu.colId)?.pinned}
                            canFreeze={activeHeaderMenu.colId !== 'name' && activeHeaderMenu.colId !== 'select'}
                        />
                    )
                }
                {
                    activeTextMenu && (
                        <TextCellContextMenu
                            onClose={() => setActiveTextMenu(null)}
                            onColorSelect={(color) => handleTextColorChange(activeTextMenu.rowId, activeTextMenu.colId, color)}
                            currentColor={rows.find(r => r.id === activeTextMenu.rowId)?._styles?.[activeTextMenu.colId]?.color}
                            position={activeTextMenu.position}
                        />
                    )
                }
                {
                    activeColorMenu && (
                        <CheckboxColorPicker
                            onClose={() => setActiveColorMenu(null)}
                            onSelect={(color) => {
                                const colId = activeColorMenu.colId || 'select';
                                if (activeColorMenu.rowId) {
                                    handleTextColorChange(activeColorMenu.rowId, colId, color);
                                } else {
                                    const newCols = columns.map(c => c.id === colId ? { ...c, color } : c);
                                    setColumns(newCols);
                                }
                                setActiveColorMenu(null);
                            }}
                            current={
                                activeColorMenu.rowId
                                    ? (rows.find(r => r.id === activeColorMenu.rowId)?._styles?.[activeColorMenu.colId || 'select']?.color || DEFAULT_CHECKBOX_COLOR)
                                    : (columns.find(c => c.id === (activeColorMenu.colId || 'select'))?.color || DEFAULT_CHECKBOX_COLOR)
                            }
                            triggerRect={activeColorMenu.rect}
                        />
                    )
                }
            </div >
        </div >
    );
};

export default memo(RoomTable);
