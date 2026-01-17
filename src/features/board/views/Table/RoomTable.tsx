import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
import { SaveToVaultModal } from '../../../dashboard/components/SaveToVaultModal';
import { vaultService } from '../../../../services/vaultService';
import { VaultItem } from '../../../vault/types';
import {
    Plus,
    Flag,
    Calendar as CalendarIcon,
    Link2,
    Pin,
    MapPin,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    GripVertical,
    Trash2,
    X,
    ListTree,
    Users,
    Bell,
    Download,
    BarChart3,
    Sparkles,
    LayoutGrid,
    FileText,
    UploadCloud,
    ExternalLink,
    CalendarRange,
    MoreHorizontal,
    Maximize2,
} from 'lucide-react';
import { RowDetailPanel } from '../../components/RowDetailPanel';
import {
    MagnifyingGlass,
    UserCircle,
    Funnel,
    ArrowsDownUp,
    EyeSlash,
    Stack,
    Copy,
    Export,
    Archive,
    Trash,
    CaretDown
} from 'phosphor-react';
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
import { PriorityLevel, comparePriority } from '../../../priorities/priorityUtils';
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
    const { t } = useAppContext();
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
                    return parsed.map((col: Column) => {
                        if (col.id === 'select' || col.id === 'name') {
                            return { ...col, pinned: true };
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

        // If external source exists, sync with it
        if (externalTasks && externalTasks.length > 0) {
            const tasksByGroup: Record<string, Row[]> = {};
            // Keep track of order found in tasks if possible, or just unique IDs
            const uniqueGroupIds: string[] = [];

            externalTasks.forEach(t => {
                const gid = t.groupId || 'default-group';
                if (!tasksByGroup[gid]) {
                    tasksByGroup[gid] = [];
                    uniqueGroupIds.push(gid);
                }
                tasksByGroup[gid].push(t);
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
        }

        return [{
            id: 'group-1',
            name: 'Group 1',
            rows: [],
            isCollapsed: false,
            color: GROUP_COLORS[0]
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(showPagination ? 50 : -1);

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
                // If we have a single 'group-1' that is empty or local-only, and we receive EXACTLY one new group ID,
                // we assume it's the initial "conversion" from local Group 1 to Server Group ID.
                if (updatedGroups.length === 1 && updatedGroups[0].id === 'group-1' &&
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

    // File Upload State
    const [activeUploadCell, setActiveUploadCell] = useState<{ rowId: string, colId: string } | null>(null);
    const [activeUploadFile, setActiveUploadFile] = useState<File | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const hiddenFileInputRef = useRef<HTMLInputElement>(null);

    // Drag & Drop State
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeColumnDragId, setActiveColumnDragId] = useState<string | null>(null);

    // Column Resize State
    const resizingColId = useRef<string | null>(null);
    const startX = useRef<number>(0);
    const startWidth = useRef<number>(0);

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

    // Custom Statuses State (Unified with Kanban)
    const [customStatuses, setCustomStatuses] = useState<StatusOption[]>([]);
    const storageKeyStatuses = `board-statuses-${roomId}`; // Changed to match KanbanBoard

    // Default Statuses (Source of Truth for Fallback)
    const DEFAULT_STATUSES: StatusOption[] = [
        { id: 'To Do', title: 'To Do', color: 'gray' },
        { id: 'In Progress', title: 'In Progress', color: 'blue' },
        { id: 'Done', title: 'Done', color: 'emerald' },
        { id: 'Stuck', title: 'Stuck', color: 'orange' },
        { id: 'Rejected', title: 'Rejected', color: 'rose' }
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
            alert("No data to export.");
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
    }, [tableGroups, columns]);

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
        const nameToUse = typeof param === 'string' ? param : 'New Group';

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
                alert('Cannot delete the last group.');
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
        const nameToAdd = rowName?.trim() || 'New Item';
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
        const nameToUse = groupCreationRow[primaryCol.id] || 'New Item';

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
        fileInputRef.current?.click();
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Get raw data (array of arrays)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (jsonData.length === 0) {
                boardLogger.warn('Empty file imported');
                return;
            }

            // 1. Process Columns from First Row
            const headerRow = jsonData[0];
            const newColumns: Column[] = headerRow.map((header: string, index: number) => ({
                id: header.toLowerCase().replace(/\s+/g, '_') || `col_${index}`,
                label: header || `Column ${index + 1}`,
                type: 'text', // Default to text, user can change later
                width: 150,
                pinned: index === 0,
                minWidth: 100,
                resizable: true,
                // Wait, "first column in the excel as head columns"? 
                // User said: "read the first column in the excel as head columns and the others below".
                // This usually means "First ROW is headers". "First COLUMN" effectively means it's a list. 
                // Standard import is: Row 1 = Headers. 
                // "read the first column in the excel as head columns" -> This phrasing is odd. 
                // "read the first column... as head columns". Maybe they mean "First Row"? 
                // "head columns and the others below" -> implies vertical structure.
                // Standard convention is Row 1 = Headers. I will assume this.
                // "first column... as head columns" -> grammatical slip for "first row"?
                // Let's assume Row 1 = Headers.
            }));

            // Ensure we keep 'select' column if it's special
            const hasSelect = newColumns.find(c => c.id === 'select');
            if (!hasSelect) {
                // Add select column at start if not present (unlikely from excel)
                newColumns.unshift({ id: 'select', label: '', type: 'text', width: 40, pinned: true, minWidth: 40, resizable: false });
            }

            // 2. Process Rows
            // Assuming first column in Excel becomes the 'name' / primary column? 
            // Or just map by index?
            // Let's try to map 'name' to the first actual data column.

            // Refine Name Column: 
            // If we have a column named 'name' or 'title', use that as ID 'name'.
            // Otherwise, set the first non-select column as 'name'.

            // Let's look at the generated IDs.
            let nameColIndex = newColumns.findIndex(c => c.id === 'name' || c.label.toLowerCase() === 'name' || c.label.toLowerCase() === 'title');
            if (nameColIndex === -1) {
                // No explicit name column found, use the first non-select column
                nameColIndex = newColumns.findIndex(c => c.id !== 'select');
            }

            if (nameColIndex !== -1) {
                // Force ID to be 'name' for the primary column implementation
                // Actually, our table relies on 'name' col ID? 
                // Yes, `col.id === 'name'` is checked in many places.
                // So we MUST have a column with id 'name'.

                // Update the ID of that column to 'name'
                newColumns[nameColIndex] = { ...newColumns[nameColIndex], id: 'name', pinned: true };
            }

            const newRows: Row[] = jsonData.slice(1).map((rowArray: any[], rowIndex: number) => {
                const rowData: any = {
                    id: Date.now().toString() + rowIndex,
                    groupId: tableGroups[0]?.id || 'group_1', // Add to first group by default
                    status: 'To Do', // Defaults
                    priority: null,
                };

                // Map array values to column IDs
                // Note: newColumns includes 'select' at index 0 probably. 
                // headerRow might NOT have 'select'.
                // Need to align indexes.

                // headerRow index i corresponds to data row index i.
                // We constructed newColumns from headerRow.
                // BUT we might have unshifted 'select'.

                // Let's reconstruct cleanly.
                // Headers: [A, B, C] -> Cols: [Select, A, B, C] (if we added select)
                // Data: [1, 2, 3]
                // A -> 1, B -> 2, C -> 3

                // Re-find the mapped columns excluding 'select' if it wasn't in file.
                // Actually, I set IDs based on header content.
                // Let's check if 'select' was added artificially.

                const dataColumns = newColumns.filter(c => c.id !== 'select'); // These correspond to the file columns in order

                rowArray.forEach((cellValue, idx) => {
                    if (dataColumns[idx]) {
                        rowData[dataColumns[idx].id] = cellValue;
                    }
                });

                return rowData as Row;
            });

            // 3. Update State
            setColumns(newColumns);

            // Replace rows in first group? Or append?
            // User implies "importing" -> might replace or add.
            // Usually "Import" to a fresh table means replace. 
            // "Import" to existing might mean append.
            // Let's APPEND to the first group, or REPLACE if empty?
            // "data table will read... meaning 100% correct importing".
            // If I replace columns, I should probably replace rows too to match the schema.
            // Retaining old rows with new schema might break if IDs don't match.
            // Warning: This is a destructive operation for existing columns structure.

            // Let's REPLACE for now as it maps schema.
            const newGroups = [{ ...tableGroups[0], rows: newRows }];
            setTableGroups(newGroups);

            // Reset filters/sorts
            setSortRules([]);
            setSortConfig(null);

        } catch (error) {
            boardLogger.error("Import failed:", error);
            // Could add toast notification here
        } finally {
            // Reset input
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
            handleUpdateRow(activeUploadCell.rowId, { [activeUploadCell.colId]: fileReference });
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

        // Find and update the row in the correct group
        setTableGroups(prevGroups => {
            return prevGroups.map(group => {
                const rowIndex = group.rows.findIndex(r => r.id === id);
                if (rowIndex === -1) return group;

                const currentRow = group.rows[rowIndex];
                const updatedRow = { ...currentRow, ...updates };

                // Check if status is being changed to "Done"
                const isBeingMarkedDone =
                    updates.status &&
                    isDoneStatus(updates.status) &&
                    !isDoneStatus(currentRow.status);

                if (isBeingMarkedDone) {
                    // Remove from current position and add to end
                    const rowsWithoutCurrent = group.rows.filter(r => r.id !== id);
                    return {
                        ...group,
                        rows: [...rowsWithoutCurrent, updatedRow]
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
            const updatedRows = rows.map(r => r.id === id ? { ...r, [colId]: value } : r);
            if (onUpdateTasks) onUpdateTasks(updatedRows);
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

        // Get editable columns (exclude 'select' column)
        const editableColumns = visibleColumns.filter(col => col.id !== 'select');
        const currentIndex = editableColumns.findIndex(col => col.id === currentColId);

        if (currentIndex === -1) {
            setActiveCell(null);
            return;
        }

        // Calculate next column index (wrap to first if at end)
        const nextIndex = (currentIndex + 1) % editableColumns.length;
        const nextCol = editableColumns[nextIndex];

        // Find the cell element for the next column
        setTimeout(() => {
            const cellSelector = `[data-row-id="${currentRowId}"][data-col-id="${nextCol.id}"]`;
            const nextCellElement = document.querySelector(cellSelector) as HTMLElement;

            if (nextCellElement) {
                const rect = nextCellElement.getBoundingClientRect();
                setActiveCell({ rowId: currentRowId, colId: nextCol.id, trigger: nextCellElement, rect });

                // For text/number inputs, focus the input after a brief delay
                setTimeout(() => {
                    const input = nextCellElement.querySelector('input');
                    if (input) input.focus();
                }, 50);
            } else {
                // If no element found, just set active cell state
                setActiveCell({ rowId: currentRowId, colId: nextCol.id });
            }
        }, 10);
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

        // Auto-scroll to the right to show the new column
        setTimeout(() => {
            if (tableBodyRef.current) {
                tableBodyRef.current.scrollTo({
                    left: tableBodyRef.current.scrollWidth,
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

    // Drag & Drop Handlers (Rows)
    const handleDragStart = (event: DragStartEvent) => {
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

    const handleRenameColumn = (colId: string, newName: string) => {
        setColumns(columns.map(c => c.id === colId ? { ...c, label: newName } : c));
    };

    const handleSort = (colId: string) => {
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
                boardLogger.error("Import failed:", error);
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

    const renderCellContent = (col: Column, row: Row) => {
        return (
            <TableCell
                col={col}
                row={row}
                columns={columns}
                activeCell={activeCell}
                customStatuses={customStatuses}
                onUpdateRow={handleUpdateRow}
                onTextChange={handleTextChange}
                onToggleCell={toggleCell}
                onSetActiveCell={setActiveCell}
                onNavigateToNextCell={navigateToNextCell}
                onAddCustomStatus={handleAddCustomStatus}
                onDeleteCustomStatus={handleDeleteCustomStatus}
                onAddColumnOption={handleAddColumnOption}
                onSetActiveColorMenu={setActiveColorMenu}
                onSetActiveTextMenu={setActiveTextMenu}
                onFileUploadRequest={handleImportClick}
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
            />
        );
    };


    return (
        <div className="flex flex-col w-full h-full bg-stone-50 dark:bg-stone-900/50 font-sans">
            {/* Header Actions - Optional if needed, currently empty/handled by parent view */}

            {/* Scrollable Container */}
            <div className="flex-1 flex flex-col min-h-0 relative">

                {/* Secondary Toolbar */}
                <div className="flex items-center h-[52px] border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1a1c22] pl-[24px] pr-[20px] shrink-0 transition-colors z-20 gap-4">
                    {/* Left: New Table */}


                    {/* Left: Action Icons */}
                    <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400 relative">
                        {/* Export Button */}


                        {/* Search - Expandable */}
                        <div className="relative flex items-center">
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
                                        <span className="text-[13px] font-medium">Search</span>
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
                                <span className="text-[13px] font-medium">Person</span>
                            </div>
                            {isPersonFilterOpen && (
                                <div data-toolbar-panel className="absolute top-full left-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[320px]">
                                    <div className="mb-3">
                                        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                                            Filter by person
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
                                <span className="text-[13px] font-medium">Filter</span>
                                <CaretDown size={12} weight="regular" className={`opacity-50 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isFilterPanelOpen && (
                                <div data-toolbar-panel className="absolute top-full left-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[600px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">Advanced filters</span>
                                            <span className="text-xs text-stone-400">Showing {filteredTableGroups.reduce((acc, g) => acc + g.rows.length, 0)} of {rows.length} items</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {filters.length > 0 && (
                                                <button
                                                    onClick={() => setFilters([])}
                                                    className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                            <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border border-stone-200 dark:border-stone-600 px-2 py-1 rounded">
                                                Save as new view
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filter Rules */}
                                    <div className="space-y-2 mb-3">
                                        {filters.map((filter, idx) => (
                                            <div key={filter.id} className="flex items-center gap-2">
                                                <span className="text-xs text-stone-500 w-12">{idx === 0 ? 'Where' : 'And'}</span>
                                                <select
                                                    value={filter.column}
                                                    onChange={(e) => {
                                                        setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, column: e.target.value, condition: '', value: '' } : f));
                                                    }}
                                                    className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                                                >
                                                    <option value="">Column</option>
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
                                                    <option value="">Condition</option>
                                                    {filter.column && getConditionsForType(columns.find(c => c.id === filter.column)?.type || 'text').map(cond => (
                                                        <option key={cond.value} value={cond.value}>{cond.label}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    placeholder="Value"
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
                                                <span className="text-xs text-stone-500 w-12">Where</span>
                                                <select className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                                                    <option>Column</option>
                                                </select>
                                                <select className="w-40 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                                                    <option>Condition</option>
                                                </select>
                                                <input placeholder="Value" className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700" readOnly />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setFilters(prev => [...prev, { id: `filter-${Date.now()}`, column: '', condition: '', value: '' }])}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            + New filter
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
                                <span className="text-[13px] font-medium">Sort</span>
                            </div>
                            {isSortPanelOpen && (
                                <div data-toolbar-panel className="absolute top-full left-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[400px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                                            Sort by
                                            <span className="w-4 h-4 rounded-full border border-stone-300 text-[10px] flex items-center justify-center text-stone-400">?</span>
                                        </span>
                                        <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border border-stone-200 dark:border-stone-600 px-2 py-1 rounded">
                                            Save as new view
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
                                                    <option value="">Choose column</option>
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
                                                    <option value="asc">↑ Ascending</option>
                                                    <option value="desc">↓ Descending</option>
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
                                                    <option>Choose column</option>
                                                </select>
                                                <select className="w-36 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                                                    <option>↑ Ascending</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setSortRules(prev => [...prev, { id: `sort-${Date.now()}`, column: '', direction: 'asc' }])}
                                        className="text-xs text-stone-400 hover:text-stone-600"
                                    >
                                        + New sort
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
                                <span className="text-[13px] font-medium">Hide</span>
                            </div>
                            {isHideColumnsOpen && (
                                <div data-toolbar-panel className="absolute top-full left-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[320px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Display columns</span>
                                        <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border border-stone-200 dark:border-stone-600 px-2 py-1 rounded">
                                            Save as new view
                                        </button>
                                    </div>

                                    <div className="relative mb-3">
                                        <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                        <input
                                            type="text"
                                            placeholder={t('find_columns')}
                                            value={columnSearchQuery}
                                            onChange={(e) => setColumnSearchQuery(e.target.value)}
                                            className="w-full h-9 pl-8 pr-3 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                                                All columns
                                            </span>
                                            <span className="text-xs text-stone-400 ml-auto">
                                                {columns.filter(c => c.id !== 'select' && !hiddenColumns.has(c.id)).length} selected
                                            </span>
                                        </label>

                                        {/* Individual columns */}
                                        {columns
                                            .filter(c => c.id !== 'select')
                                            .filter(c => columnSearchQuery === '' || c.label.toLowerCase().includes(columnSearchQuery.toLowerCase()))
                                            .map(col => (
                                                <label key={col.id} className="flex items-center gap-3 py-1.5 pl-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700/50 rounded">
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

                        {/* Group by */}
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors group">
                            <Stack size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                            <span className="text-[13px] font-medium">Group by</span>
                        </div>

                        {/* Selection Actions (Always Visible, Grey if disabled) */}
                        <div className="flex items-center gap-4 ml-4">
                            <div className="h-5 w-px bg-stone-200 dark:bg-stone-800 mx-2" />

                            <button
                                disabled={checkedRows.size === 0}
                                className={`flex items-center gap-2 transition-colors group ${checkedRows.size > 0
                                    ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-blue-600'
                                    : 'cursor-default text-stone-300 dark:text-stone-700'
                                    }`}
                            >
                                <Copy size={16} weight="regular" className={checkedRows.size > 0 ? "group-hover:scale-110 transition-transform" : ""} />
                                <span className="text-[13px] font-medium">Duplicate</span>
                            </button>

                            <button
                                disabled={checkedRows.size === 0}
                                onClick={handleExportTable}
                                className={`flex items-center gap-2 transition-colors group ${checkedRows.size > 0
                                    ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-blue-600'
                                    : 'cursor-default text-stone-300 dark:text-stone-700'
                                    }`}
                            >
                                <Export size={16} weight="regular" className={checkedRows.size > 0 ? "group-hover:scale-110 transition-transform" : ""} />
                                <span className="text-[13px] font-medium">Export</span>
                            </button>

                            <button
                                disabled={checkedRows.size === 0}
                                className={`flex items-center gap-2 transition-colors group ${checkedRows.size > 0
                                    ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-blue-600'
                                    : 'cursor-default text-stone-300 dark:text-stone-700'
                                    }`}
                            >
                                <Archive size={16} weight="regular" className={checkedRows.size > 0 ? "group-hover:scale-110 transition-transform" : ""} />
                                <span className="text-[13px] font-medium">Archive</span>
                            </button>

                            <button
                                disabled={checkedRows.size === 0}
                                onClick={() => {
                                    if (checkedRows.size === 0) return;
                                    setDeleteConfig({
                                        isOpen: true,
                                        title: `Delete ${checkedRows.size} items?`,
                                        description: "This action cannot be undone.",
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
                                className={`flex items-center gap-2 transition-colors group ${checkedRows.size > 0
                                    ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-red-600'
                                    : 'cursor-default text-stone-300 dark:text-stone-700'
                                    }`}
                            >
                                <Trash size={16} weight="regular" className={checkedRows.size > 0 ? "group-hover:scale-110 transition-transform" : ""} />
                                <span className="text-[13px] font-medium">Delete</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1" />



                    {/* Right: Custom Actions */}
                    <div className="flex items-center gap-4">
                        {enableImport && (
                            <button
                                onClick={handleImportClick}
                                className="flex items-center gap-1.5 px-2 py-1 text-stone-600 dark:text-stone-300 hover:text-blue-600 transition-colors group"
                            >
                                <UploadCloud size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[13px] font-medium">Import</span>
                            </button>
                        )}

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
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        paddingBottom: '20vh',
                        overscrollBehavior: 'none',
                        isolation: 'isolate',
                    }}
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
                                                    className="shrink-0 bg-white dark:bg-[#1a1c22] border-b border-stone-100 dark:border-stone-800/50 sticky top-0 z-50"
                                                    style={{
                                                        minWidth: totalWidth,
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 px-4 py-3 sticky left-0 z-10 w-fit bg-white dark:bg-[#1a1c22]">
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
                                                            title={group.isPinned ? "Unpin Group" : "Pin Group"}
                                                        >
                                                            <Pin size={16} className={group.isPinned ? "fill-current" : ""} />
                                                        </button>
                                                        <EditableName
                                                            name={group.name}
                                                            onRename={(newName) => handleUpdateGroupName(group.id, newName)}
                                                            className={`${group.color.text} text-[24px]`}
                                                        />
                                                        <span className="text-xs text-stone-400 ml-2">
                                                            {group.rows.length} {group.rows.length === 1 ? 'item' : 'items'}
                                                        </span>
                                                        {/* 3-dot menu */}
                                                        <div className="relative ml-2">
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
                                                            <div className="hidden absolute left-0 top-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl z-50 min-w-[120px] py-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteConfig({
                                                                            isOpen: true,
                                                                            title: `Delete "${group.name}" and all its items?`,
                                                                            description: "This will permanently remove the group and all tasks within it.",
                                                                            onConfirm: () => handleDeleteGroup(group.id)
                                                                        });
                                                                        const menu = e.currentTarget.parentElement;
                                                                        if (menu) menu.classList.add('hidden');
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                                >
                                                                    <Trash2 size={14} />
                                                                    Delete
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
                                                                                    left: leftPos,
                                                                                    position: 'sticky',
                                                                                    willChange: 'transform, left',
                                                                                }),
                                                                                backgroundColor: col.headerColor || col.backgroundColor || (isSticky ? undefined : undefined)
                                                                            }}
                                                                            showRightShadow={isSticky && !visibleColumns[index + 1]?.pinned}
                                                                        />
                                                                    );
                                                                })}
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
                                                                                        left: leftPos,
                                                                                        position: 'sticky',
                                                                                        willChange: 'transform, left',
                                                                                    })
                                                                                }}
                                                                                className={`h-full border-e border-stone-100 dark:border-stone-800 ${col.id === 'select' ? 'flex items-center justify-center cursor-default' : ''} ${isSticky ? 'z-10 bg-white dark:bg-stone-900 shadow-sm' : ''} ${isSticky && !visibleColumns[index + 1]?.pinned ? 'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:shadow-[2px_0_4px_rgba(0,0,0,0.08)]' : ''}`}
                                                                            >
                                                                                {col.id === 'select' ? (
                                                                                    <div className="w-full h-full flex items-center justify-center px-2">
                                                                                        {/* Empty */}
                                                                                    </div>
                                                                                ) : col.id === 'name' ? (
                                                                                    renderCellContent(col, creationRowData)
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
                                                    ${checkedRows.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-stone-900'}
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
                            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                                {activeColumnDragId ? (
                                    <div
                                        className="h-10 px-3 flex items-center bg-white dark:bg-stone-800 shadow-xl border border-blue-500/50 rounded cursor-grabbing"
                                        style={{ width: columns.find(c => c.id === activeColumnDragId)?.width }}
                                    >
                                        <div className="flex items-center justify-between w-full px-2">
                                            <span className="text-xs font-sans font-medium text-stone-600 dark:text-stone-300 truncate flex-1">
                                                {columns.find(c => c.id === activeColumnDragId)?.label}
                                            </span>
                                            <div className="flex items-center text-stone-400">
                                                <div className="w-1 h-3/4 mx-1 rounded bg-stone-200 dark:bg-stone-700 opacity-50" />
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </DragOverlay>,
                            document.body
                        )}
                    </DndContext>

                    {!showPagination && (
                        <div className="h-32 shrink-0" />
                    )}
                </div>

                {showPagination && (
                    <div className="shrink-0 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1a1c22]">
                        <TablePagination
                            totalItems={rows.length}
                            pageSize={rowsPerPage}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size) => {
                                setRowsPerPage(size);
                                setCurrentPage(1);
                            }}
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

                <RowDetailPanel
                    isOpen={!!activeRowDetail}
                    onClose={() => setActiveRowDetail(null)}
                    row={activeRowDetail}
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

export default RoomTable;
