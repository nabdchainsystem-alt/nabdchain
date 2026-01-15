import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ChevronDown,
    MoreHorizontal,
    Plus as PlusIcon,
    Pencil,
    Pin,
    Copy,
    Share2,
    Unlock,
    Trash2,
    ArrowLeftToLine,
    Maximize2,
    Minimize2
} from 'lucide-react';
import {
    Table as PhTable,
    Kanban as PhKanban,
    List as PhList,
    FileText as PhFileText,
    CalendarBlank as PhCalendar,
    ChartLineUp as PhGantt,
    SquaresFour as PhOverview,
    UsersThree as PhWorkload,
    Table as PhSpreadsheet,
    CheckSquare as PhCheckSquare,
    Notepad as PhNotepad,
    Lightning as PhAutomation,
    Target as PhTarget,
    ArrowsClockwise as PhRecurring,
    Cube as PhWarehouse,
    Layout as PhLayout,
    PresentationChart as PhWhiteboard
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
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Board, BoardViewType } from '../../types';
import Lists from './views/List/Lists';
import RoomTable from './views/Table/RoomTable';
import KanbanBoard from './views/Kanban/KanbanBoard';
import { DocView } from './views/Doc/DocView';

import { useRoomBoardData } from './hooks/useRoomBoardData';
import CalendarView from './views/Calendar/CalendarView';
import { PortalPopup } from '../../components/ui/PortalPopup';
import { Sparkles } from 'lucide-react';

import { DashboardConfig } from './components/dashboard/DashboardHeader';
import DataTable from './views/Table/DataTable';

import { PivotTable } from './views/PivotTable/PivotTable';
import { GanttView } from './views/GanttChart/GanttView';
import { GTDDashboard } from '../../features/gtd/GTDDashboard';
import { OverviewView } from './views/Overview/OverviewView';
import { ProcurementOverview } from './views/Procurement/ProcurementOverview';
import CornellNotesPage from '../tools/cornell/CornellNotesPage';
import WhiteboardView from '../tools/WhiteboardView';
import DashboardsView from '../tools/DashboardsView';
import AutomationRulesView from '../tools/AutomationRulesView';
import GoalsOKRsView from '../tools/GoalsOKRsView';
import WorkloadView from '../tools/WorkloadView';
import RecurringLogicView from '../tools/RecurringLogicView';
import SmartSheetView from '../tools/SpreadsheetView';
import { TimelineView } from './views/Timeline/TimelineView';


import { useUI } from '../../contexts/UIContext';

// --- Sortable Tab Component ---
interface SortableTabProps {
    viewId: string;
    isActive: boolean;
    label: string;
    icon: React.ElementType;
    isPinned?: boolean;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

const SortableTab: React.FC<SortableTabProps> = ({ viewId, isActive, label, icon: Icon, isPinned, onClick, onContextMenu }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: viewId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            onContextMenu={onContextMenu}
            className={`flex items-center justify-start text-left gap-2 py-1.5 border-b-2 text-[13.6px] font-medium transition-colors whitespace-nowrap select-none ${isActive
                ? 'border-slate-900 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
        >
            <div className="relative">
                <Icon size={16} />
                {isPinned && (
                    <div className="absolute -top-1.5 -right-1.5 bg-white dark:bg-[#1a1d24] rounded-full p-0.5 shadow-sm">
                        <Pin size={8} className="text-blue-500 fill-current" />
                    </div>
                )}
            </div>
            <span>{label}</span>
            {/* {isActive && viewId !== 'overview' && (
                <div className="ml-1 p-0.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-colors"
                    // onMouseDown to prevent drag start on the menu button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e);
                    }}>
                    <MoreHorizontal size={14} />
                </div>
            )} */}
        </div>
    );
};

interface BoardViewProps {
    board: Board;
    onUpdateBoard?: (boardId: string, updates: Partial<Board>) => void;
    onUpdateTasks?: (tasks: any[]) => void;
    renderCustomView?: (viewId: string) => React.ReactNode;
    dashboardSections?: any[];
    onNavigate?: (view: string, boardId?: string) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({ board: initialBoard, onUpdateBoard: initialOnUpdateBoard, onUpdateTasks: initialOnUpdateTasks, renderCustomView, dashboardSections, onNavigate }) => {
    // Assuming useRoomBoardData is a custom hook that provides board data and task management functions
    // and that 'effectiveKey' is defined elsewhere or needs to be passed as a prop.
    // For this change, we'll assume 'effectiveKey' is available or can be derived from initialBoard.id
    const effectiveKey = initialBoard.id; // Placeholder for effectiveKey

    // Use props if provided, or fallback to hook.
    // Ideally, if we are in a "controlled" mode (lifting state up), we might not use the hook at all?
    // But the current architecture seems to mix them.
    // Let's use the hook for internal state management where needed.

    // Callback to bridge hook's internal state updates with parent's onUpdateTasks
    const handleBoardSave = React.useCallback((updatedBoard: any) => {
        if (initialOnUpdateTasks) {
            // Flatten tasks from groups
            const allTasks = updatedBoard.groups ? updatedBoard.groups.flatMap((g: any) => g.tasks) : [];
            initialOnUpdateTasks(allTasks);
        }
    }, [initialOnUpdateTasks]);

    const { board, tasks, addTask, updateTask, deleteTask, onUpdateTasks, addGroup, deleteGroup, updateGroupTitle } = useRoomBoardData(effectiveKey, initialBoard, handleBoardSave);

    // Use the prop 'onUpdateBoard' if it exists, otherwise we might need a local handler if the hook provided one (it doesn't currently).
    // The hook provides 'setBoard'.
    const onUpdateBoard = initialOnUpdateBoard;

    const storageKey = `board-active-view-${board.id}`;

    const DEFAULT_VIEWS: BoardViewType[] = ['overview', 'table', 'kanban'];

    const sanitizedAvailableViews = useMemo(() => {
        let views = board.availableViews || [];

        // Ensure 'overview' is always present and at the start
        const viewsWithoutOverview = views.filter(v => (v as any) !== 'overview' && (v as any) !== 'listboard' && (v as any) !== 'list_board');
        const finalViews = ['overview', ...viewsWithoutOverview] as BoardViewType[];

        return finalViews;
    }, [board.availableViews]);

    const normalizeViewId = (viewId?: string | null): BoardViewType | null => {
        // Cast to any to avoid "no overlap" error for legacy values
        if ((viewId as any) === 'listboard' || (viewId as any) === 'list_board') return 'list';
        return viewId as BoardViewType | null;
    };

    const normalizedDefaultView = normalizeViewId(board.defaultView);

    const [activeView, setActiveView] = useState<BoardViewType>(() => {
        const saved = normalizeViewId(localStorage.getItem(storageKey));
        if (saved && sanitizedAvailableViews.includes(saved)) {
            return saved;
        }
        if (normalizedDefaultView && sanitizedAvailableViews.includes(normalizedDefaultView)) {
            return normalizedDefaultView;
        }
        // Default to overview if it exists, otherwise first available
        return sanitizedAvailableViews.includes('overview' as any) ? 'overview' as any : (sanitizedAvailableViews[0] || 'kanban');
    });
    const [showAddViewMenu, setShowAddViewMenu] = useState(false);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // minimum distance before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id !== over.id && onUpdateBoard) {
            const oldIndex = sanitizedAvailableViews.indexOf(active.id as BoardViewType);
            const newIndex = sanitizedAvailableViews.indexOf(over.id as BoardViewType);

            // "Overview" is implicitly at index 0 if present but not sortable?
            // Actually, our sanitizedAvailableViews includes overview.
            // But we will ONLY render sortable items for non-overview views.
            // So we need to work on the list of draggable items.

            // NOTE: The implementation plan says "Overview" is fixed.
            // So we should operate on the sub-list of draggable items.

            const draggableViews = sanitizedAvailableViews.filter(v => v !== 'overview');
            const draggingIndex = draggableViews.indexOf(active.id as BoardViewType);
            const overIndex = draggableViews.indexOf(over.id as BoardViewType);

            if (draggingIndex !== -1 && overIndex !== -1) {
                const newDraggableOrder = arrayMove(draggableViews, draggingIndex, overIndex);
                // Reconstruct full list: Overview + new draggable order
                const newFullOrder = ['overview', ...newDraggableOrder] as BoardViewType[];

                onUpdateBoard(board.id, { availableViews: newFullOrder });
            }
        }
    };

    // ... existing state ...
    const [showInfoMenu, setShowInfoMenu] = useState(false);
    const { setIsSidebarCollapsed } = useUI();
    const [isFullScreen, setIsFullScreen] = useState(false);

    const toggleFullScreen = () => {
        setIsFullScreen(prev => {
            const newState = !prev;
            // If entering full screen, collapse sidebar.
            // If exiting, expand sidebar.
            if (newState) {
                setIsSidebarCollapsed(true);
            } else {
                setIsSidebarCollapsed(false);
            }
            return newState;
        });
    };
    const [showAIMenu, setShowAIMenu] = useState(false);
    const aiButtonRef = useRef<HTMLButtonElement>(null);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; viewId: BoardViewType } | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const addViewRef = useRef<HTMLButtonElement>(null);
    const boardTitleRef = useRef<HTMLDivElement>(null);

    // Custom view names logic (isolated to BoardView for now)
    const viewNamesStorageKey = `board-view-names-${board.id}`;
    const [viewNames, setViewNames] = useState<Record<string, string>>(() => {
        try {
            const saved = localStorage.getItem(viewNamesStorageKey);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Update view names if board ID changes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`board-view-names-${board.id}`);
            setViewNames(saved ? JSON.parse(saved) : {});
        } catch {
            setViewNames({});
        }
    }, [board.id]);

    // Track previous board ID to distinguish between board switch and update
    const prevBoardIdRef = useRef(board.id);

    // Dashboard State (Lifted & Persisted)
    const dashboardStorageKey = `board-dashboard-config-${board.id}`;
    const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(() => {
        try {
            const saved = localStorage.getItem(dashboardStorageKey);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (dashboardConfig) {
            localStorage.setItem(dashboardStorageKey, JSON.stringify(dashboardConfig));
        }
    }, [dashboardConfig, dashboardStorageKey]);

    // Persist active view
    useEffect(() => {
        if (activeView) {
            localStorage.setItem(storageKey, activeView);
        }
    }, [activeView, storageKey]);

    // Track previous views to detect deletions vs additions
    const prevAvailableViewsRef = useRef<BoardViewType[]>(sanitizedAvailableViews);

    // Sync active view when board changes
    React.useEffect(() => {
        // Migration: Reset corrupted column storage for the new 'table-main' isolated view
        const migrationKey = `table-standard-reset-v4`;
        if (!localStorage.getItem(migrationKey)) {
            const targetKey = `room-table-columns-v4-${board.id}-table-main`;
            localStorage.removeItem(targetKey);
            localStorage.setItem(migrationKey, 'true');
        }

        const currentViews = sanitizedAvailableViews;
        const prevViews = prevAvailableViewsRef.current;

        // 1. Handle Board Switch
        if (board.id !== prevBoardIdRef.current) {
            const newStorageKey = `board-active-view-${board.id}`;
            const saved = localStorage.getItem(newStorageKey);

            if (saved && currentViews.includes(saved as BoardViewType)) {
                setActiveView(saved as BoardViewType);
            } else if (board.defaultView && currentViews.includes(board.defaultView)) {
                setActiveView(board.defaultView);
            } else if (currentViews.length > 0) {
                setActiveView(currentViews[0]);
            } else {
                setActiveView(currentViews[0] || 'overview');
            }
            prevBoardIdRef.current = board.id;
        }
        // 2. Handle View Deletion (Only reset if it WAS in the list and now it's NOT)
        else if (prevViews.includes(activeView) && !currentViews.includes(activeView)) {
            if (board.defaultView && currentViews.includes(board.defaultView)) {
                setActiveView(board.defaultView);
            } else if (currentViews.length > 0) {
                setActiveView(currentViews[0]);
            } else {
                setActiveView('overview');
            }
        }

        prevAvailableViewsRef.current = currentViews;
    }, [board.id, board.defaultView, sanitizedAvailableViews, activeView]);

    // Local state for editing to avoid jumpy UI
    const [editName, setEditName] = useState(board.name);
    const [editDescription, setEditDescription] = useState(board.description || '');

    // Sync local state when board prop changes (e.g. switching boards)
    React.useEffect(() => {
        setEditName(board.name);
        setEditDescription(board.description || '');
    }, [board.id, board.name, board.description]);

    // PRE-CALCULATE MAPPED COLUMNS (Hook must be top-level)
    const mappedColumns = useMemo(() => {
        const cols = board.columns?.map(col => ({
            id: col.id,
            label: col.title,
            type: col.type,
            width: col.width || (col.id === 'name' ? 320 : 150),
            minWidth: 100,
            resizable: true
        })) || [];

        // Ensure select column is at the start
        if (cols.length > 0 && !cols.find(c => c.id === 'select')) {
            cols.unshift({ id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false });
        }
        return cols;
    }, [board.columns]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenu(null);
            }
        };

        if (contextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contextMenu]);

    const handleSave = () => {
        if (onUpdateBoard) {
            onUpdateBoard(board.id, {
                name: editName,
                description: editDescription
            });
        }
    };

    const isViewAvailable = (view: BoardViewType) => {
        if (!sanitizedAvailableViews.length) return true;
        return sanitizedAvailableViews.includes(view);
    };

    const isWarehouseBoard = board.id.startsWith('warehouse') || board.id === 'sc_warehouse';

    // Keep capacity map scoped to the warehouse experience only
    useEffect(() => {
        if (!isWarehouseBoard && activeView === 'warehouse_capacity_map') {
            const fallbackFromDefault = board.defaultView && board.defaultView !== 'warehouse_capacity_map' ? board.defaultView : undefined;
            const fallbackFromAvailable = board.availableViews?.find((view) => view !== 'warehouse_capacity_map');
            setActiveView((fallbackFromDefault || fallbackFromAvailable || 'kanban') as BoardViewType);
        }
    }, [isWarehouseBoard, activeView, board.defaultView, board.availableViews]);

    const handleContextMenu = (e: React.MouseEvent, viewId: BoardViewType) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            viewId
        });
    };

    const clearViewStorage = (boardId: string, vid: string) => {
        try {
            // 1. Precise Keys (Current Version)
            const keys = [
                `room-table-columns-v3-${boardId}-${vid}`,
                `room-table-columns-v4-${boardId}-${vid}`,
                `room-table-columns-v7-${boardId}-${vid}`,
                `room-table-groups-v1-${boardId}-${vid}`,
                `room-table-rows-v7-${boardId}-${vid}`,
                `room-table-name-v7-${boardId}-${vid}`,
                `room-table-pinned-charts-${boardId}-${vid}`,
                `datatable-rows-${boardId}-${vid}`,
                `doc-data-${boardId}-${vid}`,
                `doc-data-${boardId}-1`, // Legacy
                `room-statuses-${boardId}`,
                `board-statuses-${boardId}`,
            ];

            // 2. Pattern Matching Cleanup (Scan all localstorage for this view)
            const allKeys = Object.keys(localStorage);
            const patterns = [
                `-${boardId}-${vid}`,
                `-${vid}-${boardId}`,
                `-${vid}`
            ];

            allKeys.forEach(key => {
                if (patterns.some(p => key.includes(p)) && key.includes(boardId)) {
                    localStorage.removeItem(key);
                }
            });

            keys.forEach(k => localStorage.removeItem(k));
        } catch (e) {
            console.error('Failed to clear view storage', e);
        }
    };

    const handleDeleteView = () => {
        if (!contextMenu || !onUpdateBoard) return;

        const viewToDelete = contextMenu.viewId;
        if ((viewToDelete as any) === 'overview') return; // Cannot delete overview
        const currentViews = board.availableViews || [];

        // Find index to remove only ONE instance if multiple exist
        const indexToRemove = currentViews.indexOf(viewToDelete);
        if (indexToRemove === -1) return;

        const newViews = [...currentViews];
        newViews.splice(indexToRemove, 1);

        onUpdateBoard(board.id, {
            availableViews: newViews
        });

        // Cleanup storage for the deleted view
        clearViewStorage(board.id, viewToDelete);

        // Also clear custom name for this view
        if (viewNames[viewToDelete]) {
            const updatedNames = { ...viewNames };
            delete updatedNames[viewToDelete];
            setViewNames(updatedNames);
            localStorage.setItem(viewNamesStorageKey, JSON.stringify(updatedNames));
        }

        // If we deleted the active view, switch to the first available one
        if (activeView === viewToDelete && newViews.length > 0) {
            setActiveView(newViews[0]);
        }

        setContextMenu(null);
    };

    const handlePinView = () => {
        if (!contextMenu || !onUpdateBoard) return;
        const viewId = contextMenu.viewId;
        const pinnedViews = [...(board.pinnedViews || [])];
        const index = pinnedViews.indexOf(viewId);

        if (index > -1) {
            // Unpin
            pinnedViews.splice(index, 1);
        } else {
            // Pin
            pinnedViews.push(viewId);
        }

        onUpdateBoard(board.id, { pinnedViews });
        setContextMenu(null);
    };

    const handleDuplicateView = () => {
        if (!contextMenu || !onUpdateBoard) return;
        const viewId = contextMenu.viewId;
        const currentViews = [...(board.availableViews || [])];
        currentViews.push(viewId);
        onUpdateBoard(board.id, { availableViews: currentViews });
        setContextMenu(null);
    };

    const handleRenameView = () => {
        if (!contextMenu) return;
        const newName = prompt('Enter new name for this view:', '');
        if (newName) {
            const updatedNames = { ...viewNames, [contextMenu.viewId]: newName };
            setViewNames(updatedNames);
            localStorage.setItem(viewNamesStorageKey, JSON.stringify(updatedNames));
        }
        setContextMenu(null);
    };

    const handleMoveView = (direction: 'left' | 'right') => {
        if (!contextMenu || !onUpdateBoard) return;
        const viewId = contextMenu.viewId;
        const currentViews = [...(board.availableViews || [])];
        const index = currentViews.indexOf(viewId);
        if (index === -1) return;

        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < currentViews.length) {
            [currentViews[index], currentViews[newIndex]] = [currentViews[newIndex], currentViews[index]];
            onUpdateBoard(board.id, { availableViews: currentViews });
        }
        setContextMenu(null);
    };

    const VIEW_OPTIONS = [
        { label: 'Overview', icon: PhOverview, id: 'overview', description: 'Board overview' },
        { label: 'Table', icon: PhTable, id: 'table', description: 'Manage project workflows' },
        { label: 'Data Table', icon: PhTable, id: 'datatable', description: 'High performance data grid' },
        { label: 'Kanban', icon: PhKanban, id: 'kanban', description: 'Visualize your work' },
        { label: 'List', icon: PhList, id: 'list', description: 'Simple list view' },
        { label: 'Calendar', icon: PhCalendar, id: 'calendar', description: 'Schedule tasks' },
        { label: 'Doc', icon: PhFileText, id: 'doc', description: 'Collaborate on docs' },
        { label: 'Gantt', icon: PhGantt, id: 'gantt', description: 'Visual timeline' },
        ...(isWarehouseBoard ? [{ label: 'Capacity Map', icon: PhWarehouse, id: 'warehouse_capacity_map', description: 'Visual warehouse capacity map' }] : []),
        { label: 'Workload View', icon: PhWorkload, id: 'workload', description: 'Balance assignments' },
        { label: 'Smart Sheet', icon: PhSpreadsheet, id: 'spreadsheet', description: 'Spreadsheet workspace' },
        { label: 'GTD System', icon: PhCheckSquare, id: 'gtd', description: 'Getting Things Done' },
        { label: 'Cornell Notes', icon: PhNotepad, id: 'cornell', description: 'Effective note-taking' },
        { label: 'Automation Rules', icon: PhAutomation, id: 'automation_rules', description: 'Simple trigger → action' },
        { label: 'Goals & OKRs', icon: PhTarget, id: 'goals_okrs', description: 'Align work to outcomes' },
        { label: 'Recurring Logic', icon: PhRecurring, id: 'recurring', description: 'Repeat work patterns' },
        { label: 'Timeline', icon: PhGantt, id: 'timeline', description: 'Visual project timeline' },
        { label: 'Whiteboard', icon: PhWhiteboard, id: 'whiteboard', description: 'Collaborative mind map' },
    ];

    // --- Merge dashboardSections into VIEW_OPTIONS ---
    const effectiveViewOptions = useMemo(() => {
        const customOptions: typeof VIEW_OPTIONS = [];
        if (dashboardSections) {
            dashboardSections.forEach(section => {
                section.options.forEach((opt: any) => {
                    if (!VIEW_OPTIONS.find(v => v.id === opt.id)) {
                        customOptions.push({
                            label: opt.label,
                            id: opt.id,
                            description: opt.description,
                            icon: opt.icon || PhLayout // Default icon
                        });
                    }
                });
            });
        }
        return [...VIEW_OPTIONS, ...customOptions];
    }, [isWarehouseBoard, dashboardSections]);

    const handleRenameBoard = (newName: string) => {
        onUpdateBoard?.(board.id, { name: newName });
    };

    const handleAddView = (option: { id: string; label: string; icon?: any }) => {
        setShowAddViewMenu(false);
        const viewType = option.id as BoardViewType;

        // Check if a view of this type already exists
        const currentAvailable = sanitizedAvailableViews;
        const existingViewId = currentAvailable.find(vid => getBaseViewType(vid) === viewType);

        if (existingViewId) {
            // If exists, just switch to it
            setActiveView(existingViewId);
            return;
        }

        // If not, create new one
        const uniqueId = `${viewType}-${Date.now()}` as any;

        // Ensure it's blank when created
        clearViewStorage(board.id, uniqueId);

        if (onUpdateBoard) {
            const newViews = [...sanitizedAvailableViews, uniqueId];
            onUpdateBoard(board.id, { availableViews: newViews });
        }
        setActiveView(uniqueId);
    };

    const getBaseViewType = (vid: string): string => {
        // First try exact match
        if (effectiveViewOptions.find(opt => opt.id === vid)) return vid;
        // Then try prefix match (for unique IDs like table-170...)
        const found = effectiveViewOptions.find(opt => vid.startsWith(`${opt.id}-`));
        if (found) return found.id;
        // Fallback for legacy IDs
        if (vid === 'table-main') return 'table';
        if (vid === 'kanban-main') return 'kanban';
        if (vid === 'list-main') return 'list';
        return vid;
    };

    const renderView = () => {
        const baseViewType = getBaseViewType(activeView);

        switch (baseViewType) {
            case 'overview':
                return board.id === 'procurement-main' ? (
                    <div className="w-full h-full overflow-hidden">
                        <ProcurementOverview />
                    </div>
                ) : (
                    <OverviewView boardId={board.id} tasks={tasks} />
                );
            case 'kanban':
                return (
                    <KanbanBoard
                        key={`${board.id}-${activeView}`}
                        boardId={board.id}
                        viewId={activeView}
                        tasks={tasks}
                        onUpdateTasks={onUpdateTasks}
                        onDeleteTask={deleteTask}
                    />
                );
            case 'table':
                return (
                    <RoomTable
                        key={`${board.id}-${activeView}`}
                        roomId={board.id}
                        viewId={activeView}
                        name={board.name}
                        tasks={tasks}
                        tasksVersion={tasks.map(t => t.id + t.status + t.name + t.date + t.dueDate).join('')}
                        onUpdateTasks={onUpdateTasks}
                        onDeleteTask={deleteTask}
                        onNavigate={onNavigate}
                        onAddGroup={addGroup}
                        onUpdateGroup={updateGroupTitle}
                        onDeleteGroup={deleteGroup}
                    />
                );
            case 'datatable':
                return <DataTable key={`${board.id}-${activeView}`} roomId={board.id} />;
            case 'doc':
                return <DocView key={`${board.id}-${activeView}`} roomId={board.id} />;


            case 'list':
                return (
                    <Lists
                        roomId={board.id}
                        viewId={activeView}
                        tasks={tasks}
                        onUpdateTasks={onUpdateTasks}
                    />
                );
            case 'calendar':
                return (
                    <CalendarView
                        key={`${board.id}-${activeView}`}
                        roomId={board.id}
                        board={board}
                        onUpdateTask={updateTask}
                        onAddTask={addTask}
                    />
                );
            case 'pivot_table':
                return <PivotTable key={`${board.id}-${activeView}`} roomId={board.id} />;
            case 'gantt':
                return <GanttView key={`${board.id}-${activeView}`} roomId={board.id} boardName={board.name} tasks={tasks} onUpdateTasks={onUpdateTasks} />;
            case 'dashboards':
                return <DashboardsView boardId={board.id} boardName={board.name} fallbackTasks={board.tasks} />;
            case 'whiteboard':
                return <WhiteboardView boardId={board.id} />;
            case 'workload':
                return <WorkloadView boardId={board.id} fallbackTasks={board.tasks} />;
            case 'spreadsheet':
                return <SmartSheetView boardId={board.id} />;
            case 'gtd':
                return <GTDDashboard key={`${board.id}-${activeView}`} boardId={board.id} onBoardCreated={() => { }} />;
            case 'cornell':
                return <CornellNotesPage roomId={board.id} />;
            case 'automation_rules':
                return <AutomationRulesView boardId={board.id} />;
            case 'goals_okrs':
                return <GoalsOKRsView boardId={board.id} fallbackTasks={board.tasks} />;
            case 'recurring':
                return <RecurringLogicView boardId={board.id} fallbackTasks={board.tasks} />;
            case 'warehouse_capacity_map':
                return renderCustomView ? renderCustomView('warehouse_capacity_map') : null;
            case 'timeline':
                return <TimelineView key={`${board.id}-${activeView}`} roomId={board.id} boardName={board.name} tasks={tasks} onUpdateTasks={onUpdateTasks} />;
            default:
                if (renderCustomView) {
                    const custom = renderCustomView(activeView);
                    if (custom) return custom;
                }

                return (
                    <KanbanBoard
                        key={`${board.id}-${activeView}`}
                        boardId={board.id}
                        viewId={activeView}
                        tasks={board.tasks}
                        onUpdateTasks={onUpdateTasks}
                        onDeleteTask={deleteTask}
                    />
                );
        }
    };

    // Ensure default views are available if availableViews is empty
    let availableViews = [...sanitizedAvailableViews];

    if (!isWarehouseBoard) {
        availableViews = availableViews.filter(view => view !== 'warehouse_capacity_map');
        if (availableViews.length === 0) {
            availableViews = ['overview', 'table', 'kanban'] as BoardViewType[];
        }
    }

    // Sort: Overview first, then Pinned views, then others
    // Sort: Overview first, then RESPECT availableViews order (which is draggable now)
    // const pinned = board.pinnedViews || [];
    // availableViews.sort((a, b) => {
    //     if (a === 'overview') return -1;
    //     if (b === 'overview') return 1;
    //     const aPinned = pinned.includes(a);
    //     const bPinned = pinned.includes(b);
    //     if (aPinned && !bPinned) return -1;
    //     if (!aPinned && bPinned) return 1;
    //     return 0;
    // });

    // Ensure Overview is first if present in availableViews, but don't double add it
    // Actually, our DnD logic manages 'overview' + rest.
    // So we just rely on `sanitizedAvailableViews` order, which comes from board.availableViews.
    // BUT we need to make sure overview is at index 0 if it exists.

    // If board.availableViews is used as source of truth, we trust it.
    // The previous sorting logic forced overview to 0. We should probably keep that safeguard or just trust the drag handler.
    // Let's rely on the drag handler's robust "['overview', ...others]" construction.

    // However, for initial render or legacy data, we might want to ensure overview is first.
    // But sort() mutates array in place.
    // Let's just avoid sorting.

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
            {/* Dashboard Sections / Top Part */}
            <div
                className={`flex-shrink-0 bg-white dark:bg-[#1a1d24] grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isFullScreen ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="pl-[24px] pr-[20px] pt-4 pb-0">
                        {/* Title and Top Actions */}
                        <div className="flex items-center justify-between mb-1 gap-4">
                            {/* Left: Title */}
                            <div className="relative">
                                <div
                                    ref={boardTitleRef}
                                    className="flex items-center gap-1 group cursor-pointer min-w-0"
                                    onClick={() => setShowInfoMenu(!showInfoMenu)}
                                >
                                    <h1 className="text-[24px] font-[450] text-gray-800 dark:text-white truncate">{board.name}</h1>
                                    <ChevronDown size={20} className="text-gray-400 group-hover:text-gray-600" />
                                </div>

                                {/* Board Info / Rename Popover */}
                                {showInfoMenu && (
                                    <PortalPopup
                                        triggerRef={boardTitleRef}
                                        onClose={() => {
                                            // Reset to original values (cancel)
                                            setEditName(board.name);
                                            setEditDescription(board.description || '');
                                            setShowInfoMenu(false);
                                        }}
                                        side="bottom"
                                        align="start"
                                    >
                                        <div className="w-80 bg-white/90 dark:bg-[#1a1d24]/90 backdrop-blur-xl border border-blue-500/20 dark:border-blue-400/20 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-5 animate-in fade-in zoom-in-95 duration-200 mt-2">
                                            <div className="space-y-5">
                                                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Board Settings</span>
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <Pencil size={12} className="text-blue-500" />
                                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Name</label>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleSave();
                                                                    setShowInfoMenu(false);
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 text-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                                            placeholder="Board Name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <PhFileText size={12} className="text-blue-500" />
                                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Description</label>
                                                        </div>
                                                        <textarea
                                                            value={editDescription}
                                                            onChange={(e) => setEditDescription(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    handleSave();
                                                                    setShowInfoMenu(false);
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 text-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[100px] transition-all"
                                                            placeholder="Add a detailed description..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </PortalPopup>
                                )}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1 md:gap-3">
                                <button
                                    onClick={toggleFullScreen}
                                    className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                                    title="Enter Full Screen"
                                >
                                    <Maximize2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Board Description */}
                        {board.description && (
                            <div className="pt-1 pb-4 text-sm text-gray-500 dark:text-gray-400 max-w-4xl">
                                {board.description}
                            </div>
                        )}

                        {/* Tabs Row */}
                        <div className="flex items-center gap-0 pr-6 border-b border-gray-200 dark:border-gray-800 -ml-[24px] -mr-[20px] pl-[24px]">
                            <div className="flex items-center justify-start gap-[11.5px] overflow-x-auto no-scrollbar max-w-full">
                                {/* Fixed "Overview" Tab */}
                                {sanitizedAvailableViews.includes('overview' as any) && (() => {
                                    const overviewOption = effectiveViewOptions.find(v => v.id === 'overview');
                                    if (!overviewOption) return null;
                                    const Icon = overviewOption.icon;
                                    return (

                                        <button
                                            onClick={() => setActiveView('overview')}
                                            onContextMenu={(e) => handleContextMenu(e, 'overview')}
                                            className={`flex items-center justify-start text-left gap-2 py-1.5 border-b-2 text-[13.6px] font-medium transition-colors whitespace-nowrap ${activeView === 'overview'
                                                ? 'border-slate-900 text-slate-900 dark:text-slate-100'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            <Icon size={16} />
                                            <span>{overviewOption.label}</span>
                                        </button>
                                    );
                                })()}

                                {/* Draggable Tabs */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={sanitizedAvailableViews.filter(v => v !== 'overview')}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {sanitizedAvailableViews.filter(v => v !== 'overview' as any).map((viewId) => {
                                            const baseType = getBaseViewType(viewId);
                                            const option = effectiveViewOptions.find(v => v.id === baseType);
                                            if (!option) return null;

                                            const label = viewNames[viewId] || option.label;
                                            const isActive = activeView === viewId;
                                            const isPinned = board.pinnedViews?.includes(viewId);

                                            return (
                                                <SortableTab
                                                    key={viewId}
                                                    viewId={viewId}
                                                    isActive={isActive}
                                                    label={label}
                                                    icon={option.icon}
                                                    isPinned={isPinned}
                                                    onClick={() => setActiveView(viewId as BoardViewType)}
                                                    onContextMenu={(e) => handleContextMenu(e, viewId as BoardViewType)}
                                                />
                                            );
                                        })}
                                    </SortableContext>

                                    <DragOverlay adjustScale={false}>
                                        {activeDragId ? (() => {
                                            const baseType = getBaseViewType(activeDragId);
                                            const option = effectiveViewOptions.find(v => v.id === baseType);
                                            if (!option) return null;
                                            const label = viewNames[activeDragId] || option.label;
                                            return (

                                                <button className="flex items-center gap-2 py-1.5 border-b-2 border-slate-900 text-[13px] font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap bg-white dark:bg-[#1a1d24] shadow-lg rounded opacity-90 cursor-grabbing">
                                                    <div className="relative">
                                                        <option.icon size={16} />
                                                    </div>
                                                    <span>{label}</span>
                                                </button>
                                            );
                                        })() : null}
                                    </DragOverlay>
                                </DndContext>
                            </div>

                            {/* Add View Button - Always at the end, outside scroll container */}
                            <div className="relative flex items-center flex-shrink-0">
                                <button
                                    ref={addViewRef}
                                    onClick={() => setShowAddViewMenu(!showAddViewMenu)}
                                    className="p-1.5 ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <PlusIcon size={18} />
                                </button>

                                {/* Dropdown Menu (Mega Menu) */}
                                {showAddViewMenu && (
                                    <PortalPopup
                                        triggerRef={addViewRef}
                                        onClose={() => setShowAddViewMenu(false)}
                                        side="bottom"
                                        align="start"
                                    >
                                        <div className="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-[450px] py-3 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Add View</h3>
                                            </div>
                                            <div className="max-h-[450px] overflow-y-auto">
                                                {/* Simple Tools */}
                                                <div className="px-4 pt-3 pb-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Simple Tools</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                                                    {VIEW_OPTIONS.filter(opt => !['list', 'gtd', 'cornell', 'automation_rules', 'goals_okrs', 'recurring', 'spreadsheet', 'workload', 'whiteboard'].includes(opt.id)).map((option) => (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => handleAddView(option)}
                                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                                                        >
                                                            <option.icon size={18} weight="regular" className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                            <div className="text-left">
                                                                <span className="block text-[13px] text-gray-700 dark:text-gray-200 font-medium leading-tight">{option.label}</span>
                                                                <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{option.description}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Advanced Tools */}
                                                <div className="border-t border-gray-100 dark:border-gray-800">
                                                    <div className="px-4 pt-3 pb-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Advanced Tools</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                                                        {VIEW_OPTIONS.filter(opt => ['gtd', 'cornell', 'automation_rules', 'goals_okrs', 'recurring', 'spreadsheet', 'workload', 'whiteboard'].includes(opt.id)).map((option) => (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => handleAddView(option)}
                                                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                                                            >
                                                                <option.icon size={18} weight="regular" className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                                <div className="text-left">
                                                                    <span className="block text-[13px] text-gray-700 dark:text-gray-200 font-medium leading-tight">{option.label}</span>
                                                                    <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{option.description}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Dashboard Sections */}
                                                {dashboardSections?.map((section: any, idx: number) => (
                                                    <div key={idx} className="border-t border-gray-100 dark:border-gray-800">
                                                        <div className="px-4 pt-3 pb-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{section.title}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                                                            {section.options.map((option: any) => {
                                                                const Icon = option.icon || PhLayout;
                                                                return (
                                                                    <button
                                                                        key={option.id}
                                                                        onClick={() => handleAddView(option)}
                                                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                                                                    >
                                                                        <Icon size={18} weight="regular" className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                                        <span className="text-[13px] text-gray-700 dark:text-gray-200">{option.label}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </PortalPopup>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {(() => {
                const type = getBaseViewType(activeView);
                const isFullWidth = ['table', 'datatable', 'gantt', 'spreadsheet', 'calendar'].includes(type);

                return (
                    <div className={`flex-1 overflow-hidden bg-transparent flex flex-col relative bg-white dark:bg-[#1a1d24] ${isFullWidth ? 'px-0' : 'px-6'}`}>
                        {renderView()}

                        {/* Global Exit Full Screen Floating Button */}
                        {isFullScreen && (
                            <button
                                onClick={toggleFullScreen}
                                className="absolute top-3 right-6 z-50 p-2 bg-white dark:bg-[#1a1d24] border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg shadow-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-all opacity-50 hover:opacity-100"
                                title="Exit Full Screen"
                            >
                                <Minimize2 size={18} />
                            </button>
                        )}
                    </div>
                );
            })()}

            {/* Context Menu Portal/Overlay */}
            {
                contextMenu && (
                    <div
                        className="fixed inset-0 z-[9999]"
                        style={{ pointerEvents: 'none' }}
                    >
                        {/* Transparent overlay for click-outside handled by global listener, but this ensures z-index stacking is correct */}
                        <div
                            ref={contextMenuRef}
                            className="absolute bg-white/90 dark:bg-[#1a1d24]/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-xl shadow-2xl py-2 w-64 pointer-events-auto border border-blue-500/20"
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                        >
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tab Options</span>
                            </div>
                            <div
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
                                onClick={handlePinView}
                            >
                                <Pin size={16} />
                                <span className="text-[13px] font-medium">
                                    {(board.pinnedViews || []).includes(contextMenu.viewId) ? 'Unpin view' : 'Pin view'}
                                </span>
                            </div>
                            <div className="my-1 border-t border-gray-100/50 dark:border-gray-800/50 mx-2"></div>

                            <div
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
                                onClick={handleRenameView}
                            >
                                <Pencil size={16} />
                                <span className="text-[13px] font-medium">Rename view</span>
                            </div>
                            <div
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
                                onClick={handleDuplicateView}
                            >
                                <Copy size={16} />
                                <span className="text-[13px] font-medium">Duplicate view</span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors" onClick={() => { navigator.clipboard.writeText(window.location.href); setContextMenu(null); }}>
                                <Share2 size={16} />
                                <span className="text-[13px] font-medium">Share view</span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors" onClick={() => setContextMenu(null)}>
                                <Unlock size={16} />
                                <span className="text-[13px] font-medium">Unlock view</span>
                            </div>

                            <div className="my-1 border-t border-gray-100/50 dark:border-gray-800/50 mx-2"></div>

                            <div className="flex items-center justify-between px-4 py-2.5 gap-2">
                                <button
                                    className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-xs font-semibold text-gray-600 dark:text-gray-400"
                                    onClick={() => handleMoveView('left')}
                                >
                                    <ArrowLeftToLine size={14} /> Move Left
                                </button>
                                <button
                                    className="flex-1 flex items-center justify-center gap-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-xs font-semibold text-gray-600 dark:text-gray-400"
                                    onClick={() => handleMoveView('right')}
                                >
                                    Move Right <ArrowLeftToLine size={14} className="rotate-180" />
                                </button>
                            </div>

                            <div className="my-1 border-t border-gray-100/50 dark:border-gray-800/50 mx-2"></div>

                            {contextMenu.viewId !== 'overview' as any && (
                                <div
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer text-gray-700 dark:text-gray-200 hover:text-rose-600 dark:hover:text-rose-400 transition-all font-medium"
                                    onClick={handleDeleteView}
                                >
                                    <Trash2 size={16} />
                                    <span className="text-[13px]">Delete view</span>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

        </div >
    );
};
