import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ChevronDown,

    MoreHorizontal,
    Table,
    Kanban,
    List,
    FileText,
    CheckSquare,
    Settings2,
    Target,
    UserCheck,
    Plus as PlusIcon,
    GanttChart,
    Calendar,
    Image as ImageIcon,
    FileEdit,
    Search,
    Filter,
    Layout,
    ArrowLeftToLine,
    Pin,
    Pencil,
    Copy,
    Share2,
    Unlock,
    Trash2,
    ArrowUpDown,
    RotateCw
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
            className={`flex items-center gap-2 py-1.5 border-b-2 text-[13px] font-medium transition-colors whitespace-nowrap select-none ${isActive
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
            {isActive && viewId !== 'overview' && (
                <div className="ml-1 p-0.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-colors"
                    // onMouseDown to prevent drag start on the menu button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e);
                    }}>
                    <MoreHorizontal size={14} />
                </div>
            )}
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

    const { board, tasks, addTask, updateTask, deleteTask, onUpdateTasks } = useRoomBoardData(effectiveKey, initialBoard, handleBoardSave);

    // Use the prop 'onUpdateBoard' if it exists, otherwise we might need a local handler if the hook provided one (it doesn't currently).
    // The hook provides 'setBoard'.
    const onUpdateBoard = initialOnUpdateBoard;

    const storageKey = `board-active-view-${board.id}`;

    const DEFAULT_VIEWS: BoardViewType[] = ['overview', 'table', 'kanban'];

    const sanitizedAvailableViews = useMemo(() => {
        const views = board.availableViews;
        const base = (views && views.length > 0 ? views : DEFAULT_VIEWS) as BoardViewType[];
        const filtered = base.filter(view => (view as any) !== 'listboard' && (view as any) !== 'list_board') as BoardViewType[];
        return filtered.length ? filtered : DEFAULT_VIEWS;
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
        return 'kanban';
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
            // So we should operate on the sub-list of draggable views.

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
    const [showAIMenu, setShowAIMenu] = useState(false);
    const aiButtonRef = useRef<HTMLButtonElement>(null);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; viewId: BoardViewType } | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const addViewRef = useRef<HTMLButtonElement>(null);

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
    const prevAvailableViewsRef = useRef<BoardViewType[]>(board.availableViews || []);

    // Sync active view when board changes
    React.useEffect(() => {
        // Migration: Reset corrupted column storage for the new 'table-main' isolated view
        const migrationKey = `table-standard-reset-v4`;
        if (!localStorage.getItem(migrationKey)) {
            const targetKey = `room-table-columns-v4-${board.id}-table-main`;
            localStorage.removeItem(targetKey);
            localStorage.setItem(migrationKey, 'true');
        }

        const currentViews = board.availableViews || [];
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
                setActiveView('kanban');
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
                setActiveView('kanban');
            }
        }

        prevAvailableViewsRef.current = currentViews;
    }, [board.id, board.defaultView, board.availableViews, activeView]);

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

    const handleDeleteView = () => {
        if (!contextMenu || !onUpdateBoard) return;

        const viewToDelete = contextMenu.viewId;
        const currentViews = board.availableViews || [];
        const newViews = currentViews.filter(v => v !== viewToDelete);

        onUpdateBoard(board.id, {
            availableViews: newViews
        });

        // Cleanup storage for the deleted view
        try {
            // 1. Clear Columns Config (v3 legacy + v4 current)
            const colsKeyV4 = viewToDelete === 'table'
                ? `room-table-columns-v4-${board.id}-table-main`
                : `room-table-columns-v4-${board.id}-${viewToDelete}`;

            localStorage.removeItem(colsKeyV4);
            localStorage.removeItem(`room-table-columns-v3-${board.id}-${viewToDelete}`);

            // 2. Clear Rows only if it's a DataTable (isolated storage)
            if (viewToDelete.startsWith('datatable')) {
                const rowsKey = `datatable-rows-${board.id}-${viewToDelete}`;
                localStorage.removeItem(rowsKey);
            }
        } catch (e) {
            console.error('Failed to clear view storage', e);
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
        { label: 'Overview', icon: Layout, id: 'overview', description: 'Board overview' },
        { label: 'Table', icon: Table, id: 'table', description: 'Manage project workflows' },
        { label: 'Data Table', icon: Table, id: 'datatable', description: 'High performance data grid' },
        { label: 'Kanban', icon: Kanban, id: 'kanban', description: 'Visualize your work' },
        { label: 'List', icon: List, id: 'list', description: 'Simple list view' },
        { label: 'Calendar', icon: Calendar, id: 'calendar', description: 'Schedule tasks' },
        { label: 'Doc', icon: FileText, id: 'doc', description: 'Collaborate on docs' },
        { label: 'Gantt', icon: GanttChart, id: 'gantt', description: 'Visual timeline' },
        ...(isWarehouseBoard ? [{ label: 'Capacity Map', icon: Layout, id: 'warehouse_capacity_map', description: 'Visual warehouse capacity map' }] : []),
        { label: 'Workload View', icon: UserCheck, id: 'workload', description: 'Balance assignments' },
        { label: 'Smart Sheet', icon: Table, id: 'spreadsheet', description: 'Spreadsheet workspace' },
        { label: 'GTD System', icon: CheckSquare, id: 'gtd', description: 'Getting Things Done' },
        { label: 'Cornell Notes', icon: FileText, id: 'cornell', description: 'Effective note-taking' },
        { label: 'Automation Rules', icon: Settings2, id: 'automation_rules', description: 'Simple trigger → action' },
        { label: 'Goals & OKRs', icon: Target, id: 'goals_okrs', description: 'Align work to outcomes' },
        { label: 'Recurring Logic', icon: RotateCw, id: 'recurring', description: 'Repeat work patterns' },
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
                            icon: opt.icon || Layout // Default icon
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

    const renderView = () => {
        switch (activeView) {
            case 'overview':
                return board.id === 'procurement-main' ? (
                    <div className="w-full h-full overflow-hidden">
                        <ProcurementOverview />
                    </div>
                ) : (
                    <OverviewView boardId={board.id} />
                );
            case 'kanban':
                return (
                    <KanbanBoard
                        key={board.id}
                        boardId={board.id}
                        viewId="kanban-main"
                        tasks={tasks}
                        onUpdateTasks={onUpdateTasks}
                    />
                );
            case 'table':
                return (
                    <RoomTable
                        key={board.id}
                        roomId={board.id}
                        viewId="table-main"
                        name={board.name}
                        tasks={tasks}
                        onUpdateTasks={onUpdateTasks}
                        onDeleteTask={deleteTask}
                        onNavigate={onNavigate}
                    />
                );
            case 'datatable':
                // Keeping it for legacy but maybe redirect or hide?
                return <DataTable key={board.id} roomId={board.id} />;
            case 'doc':
                return <DocView key={board.id} roomId={board.id} />;


            case 'list':
                return (
                    <Lists
                        roomId={board.id}
                        viewId="list-main"
                        tasks={tasks}
                        onUpdateTasks={onUpdateTasks}
                    />
                );
            case 'calendar':
                return <CalendarView key={board.id} roomId={board.id} />;
            case 'pivot_table':
                return <PivotTable key={board.id} roomId={board.id} />;
            case 'gantt':
                return <GanttView key={board.id} roomId={board.id} boardName={board.name} />;
            case 'dashboards':
                return <DashboardsView boardId={board.id} boardName={board.name} fallbackTasks={board.tasks} />;
            case 'whiteboard':
                return <WhiteboardView boardId={board.id} />;
            case 'workload':
                return <WorkloadView boardId={board.id} fallbackTasks={board.tasks} />;
            case 'spreadsheet':
                return <SmartSheetView boardId={board.id} />;
            case 'gtd':
                return <GTDDashboard key={board.id} boardId={board.id} onBoardCreated={() => { }} />;
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
            default:
                // Handle custom views
                if (renderCustomView) {
                    const custom = renderCustomView(activeView);
                    if (custom) return custom;
                }

                return (
                    <KanbanBoard
                        key={board.id}
                        boardId={board.id}
                        viewId="kanban-main"
                        tasks={board.tasks}
                        onUpdateTasks={onUpdateTasks}
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
            {/* Top Header Section */}
            <div className="pl-[24px] pr-[20px] pt-4 pb-0 flex-shrink-0 bg-white dark:bg-[#1a1d24]">
                {/* Title and Top Actions */}
                <div className="flex items-center justify-between mb-1 gap-4">
                    {/* Left: Title */}
                    <div className="relative">
                        <div
                            className="flex items-center gap-1 group cursor-pointer min-w-0"
                            onClick={() => setShowInfoMenu(!showInfoMenu)}
                        >
                            <h1 className="text-[24px] font-[450] text-gray-800 dark:text-white truncate">{board.name}</h1>
                            <ChevronDown size={20} className="text-gray-400 group-hover:text-gray-600" />
                        </div>

                        {/* Board Info / Rename Popover */}
                        {showInfoMenu && (
                            <div className="absolute top-full left-0 mt-2 w-80 bg-white/90 dark:bg-[#1a1d24]/90 backdrop-blur-xl border border-blue-500/20 dark:border-blue-400/20 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-50 p-5 animate-in fade-in zoom-in-95 duration-200">
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
                                                onBlur={handleSave}
                                                className="w-full px-3 py-2 text-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                                placeholder="Board Name"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <FileText size={12} className="text-blue-500" />
                                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Description</label>
                                            </div>
                                            <textarea
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                onBlur={handleSave}
                                                className="w-full px-3 py-2 text-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[100px] transition-all"
                                                placeholder="Add a detailed description..."
                                            />
                                        </div>
                                    </div>
                                    {/* Backdrop to close when clicking outside */}
                                    <div
                                        className="fixed inset-0 z-[-1]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowInfoMenu(false);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 md:gap-3">
                        {/* Icons removed as requested */}
                    </div>
                </div>

                {/* Board Description */}
                {board.description && (
                    <div className="pt-1 pb-4 text-sm text-gray-500 dark:text-gray-400 max-w-4xl">
                        {board.description}
                    </div>
                )}

                {/* Tabs Row */}
                <div className="flex items-center gap-0 pr-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-start gap-6 overflow-x-auto no-scrollbar max-w-full">
                        {/* Fixed "Overview" Tab */}
                        {sanitizedAvailableViews.includes('overview') && (() => {
                            const overviewOption = effectiveViewOptions.find(v => v.id === 'overview');
                            if (!overviewOption) return null;
                            const Icon = overviewOption.icon;
                            return (

                                <button
                                    onClick={() => setActiveView('overview')}
                                    onContextMenu={(e) => handleContextMenu(e, 'overview')}
                                    className={`flex items-center gap-2 py-1.5 border-b-2 text-[13px] font-medium transition-colors whitespace-nowrap ${activeView === 'overview'
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
                                {sanitizedAvailableViews.filter(v => v !== 'overview').map((viewId) => {
                                    const option = effectiveViewOptions.find(v => v.id === viewId);
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

                            {/* Drag Overlay for smooth visual feedback */}
                            <DragOverlay adjustScale={false}>
                                {activeDragId ? (() => {
                                    const option = effectiveViewOptions.find(v => v.id === activeDragId);
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
                                align="end"
                            >
                                <div className="bg-white/98 dark:bg-[#0d0d0e]/98 backdrop-blur-3xl border border-stone-200 dark:border-stone-800 rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] w-[880px] flex overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative">
                                    <div className="w-full h-full overflow-y-auto no-scrollbar relative z-10">
                                        <div className="p-8 space-y-10">
                                            {/* Compact Header */}
                                            <div className="flex flex-col gap-1 border-b border-stone-100 dark:border-stone-800 pb-5">
                                                <h2 className="text-xl font-medium tracking-tight text-stone-900 dark:text-stone-100">Add View</h2>
                                                <p className="text-[12px] text-stone-400 dark:text-stone-500 font-medium">Equip your workspace with specialized tools.</p>
                                            </div>

                                            {/* Sections */}
                                            <div className="space-y-12">
                                                {/* Basic Tools */}
                                                <section>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <h3 className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest whitespace-nowrap">Basic Tools</h3>
                                                        <div className="h-px w-full bg-stone-100 dark:bg-stone-800/50" />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {VIEW_OPTIONS.filter(opt => !['gtd', 'cornell', 'automation_rules', 'goals_okrs', 'recurring', 'spreadsheet', 'warehouse_capacity_map'].includes(opt.id)).map((option) => (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => {
                                                                    setShowAddViewMenu(false);
                                                                    const viewId = option.id as BoardViewType;
                                                                    console.log('[BoardView] Attempting to add view:', viewId);
                                                                    console.log('[BoardView] Current board.availableViews:', board.availableViews);

                                                                    if (onUpdateBoard) {
                                                                        const currentAvailable = board.availableViews && board.availableViews.length > 0
                                                                            ? board.availableViews
                                                                            : DEFAULT_VIEWS;

                                                                        console.log('[BoardView] Effective currentAvailable:', currentAvailable);

                                                                        if (!currentAvailable.includes(viewId)) {
                                                                            const newViews = [...currentAvailable, viewId];
                                                                            console.log('[BoardView] Updating board with new views:', newViews);
                                                                            onUpdateBoard(board.id, { availableViews: newViews });
                                                                        } else {
                                                                            console.log('[BoardView] View already exists in list, skipping update');
                                                                        }
                                                                    } else {
                                                                        console.warn('[BoardView] onUpdateBoard is undefined!');
                                                                    }
                                                                    setActiveView(viewId);
                                                                }}
                                                                className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-stone-100 dark:hover:border-stone-800/50 hover:bg-stone-50/50 dark:hover:bg-stone-900/50 transition-all group"
                                                            >
                                                                <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 group-hover:bg-black dark:group-hover:bg-stone-100 group-hover:text-white dark:group-hover:text-black transition-all">
                                                                    <option.icon size={16} strokeWidth={1.5} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="text-[13px] font-semibold text-stone-900 dark:text-stone-200 group-hover:translate-x-0.5 transition-transform">{option.label}</div>
                                                                    <div className="text-[10px] text-stone-400 dark:text-stone-500 line-clamp-1 truncate">{option.description}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </section>
                                                {/* Advanced Tools */}
                                                <section>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <h3 className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest whitespace-nowrap">Advanced Tools</h3>
                                                        <div className="h-px w-full bg-stone-100 dark:bg-stone-800/50" />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {VIEW_OPTIONS.filter(opt => ['gtd', 'cornell', 'automation_rules', 'goals_okrs', 'recurring', 'spreadsheet', 'warehouse_capacity_map'].includes(opt.id)).map((option) => (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => {
                                                                    setShowAddViewMenu(false);
                                                                    const viewId = option.id as BoardViewType;
                                                                    if (onUpdateBoard) {
                                                                        const currentAvailable = board.availableViews && board.availableViews.length > 0
                                                                            ? board.availableViews
                                                                            : DEFAULT_VIEWS;

                                                                        if (!currentAvailable.includes(viewId)) {
                                                                            onUpdateBoard(board.id, { availableViews: [...currentAvailable, viewId] });
                                                                        }
                                                                    }
                                                                    setActiveView(viewId);
                                                                }}
                                                                className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-stone-100 dark:hover:border-stone-800/50 hover:bg-stone-50/50 dark:hover:bg-stone-900/50 transition-all group"
                                                            >
                                                                <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 group-hover:bg-black dark:group-hover:bg-stone-100 group-hover:text-white dark:group-hover:text-black transition-all">
                                                                    <option.icon size={16} strokeWidth={1.5} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="text-[13px] font-semibold text-stone-900 dark:text-stone-200 group-hover:translate-x-0.5 transition-transform">{option.label}</div>
                                                                    <div className="text-[10px] text-stone-400 dark:text-stone-500 line-clamp-1 truncate">{option.description}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </section>
                                                {dashboardSections?.map((section: any, idx: number) => (
                                                    <section key={idx}>
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <h3 className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest whitespace-nowrap">{section.title}</h3>
                                                            <div className="h-px w-full bg-stone-100 dark:bg-stone-800/50" />
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {section.options.map((option: any) => {
                                                                // Fallback icon if not provided in dynamic options
                                                                const Icon = option.icon || Layout;
                                                                return (
                                                                    <button
                                                                        key={option.id}
                                                                        onClick={() => {
                                                                            setShowAddViewMenu(false);
                                                                            const viewId = option.id as BoardViewType;
                                                                            if (onUpdateBoard) {
                                                                                const currentAvailable = board.availableViews && board.availableViews.length > 0
                                                                                    ? board.availableViews
                                                                                    : DEFAULT_VIEWS;

                                                                                if (!currentAvailable.includes(viewId)) {
                                                                                    onUpdateBoard(board.id, { availableViews: [...currentAvailable, viewId] });
                                                                                }
                                                                            }
                                                                            setActiveView(viewId);
                                                                        }}
                                                                        className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-stone-100 dark:hover:border-stone-800/50 hover:bg-stone-50/50 dark:hover:bg-stone-900/50 transition-all group"
                                                                    >
                                                                        <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 group-hover:bg-black dark:group-hover:bg-stone-100 group-hover:text-white dark:group-hover:text-black transition-all">
                                                                            <Icon size={16} strokeWidth={1.5} />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <div className="text-[13px] font-semibold text-stone-900 dark:text-stone-200 group-hover:translate-x-0.5 transition-transform">{option.label}</div>
                                                                            <div className="text-[10px] text-stone-400 dark:text-stone-500 line-clamp-1 truncate">{option.description}</div>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </section>
                                                ))}





                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PortalPopup>
                        )}
                    </div>
                </div>

            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden bg-transparent flex flex-col relative bg-white dark:bg-[#1a1d24] px-6">
                {renderView()}
            </div>

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

                            <div
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer text-gray-700 dark:text-gray-200 hover:text-rose-600 dark:hover:text-rose-400 transition-all font-medium"
                                onClick={handleDeleteView}
                            >
                                <Trash2 size={16} />
                                <span className="text-[13px]">Delete view</span>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
