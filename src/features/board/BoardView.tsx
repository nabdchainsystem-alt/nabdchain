import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import {
    CaretDown as ChevronDown,
    DotsThree as MoreHorizontal,
    Plus as PlusIcon,
    PencilSimple as Pencil,
    PushPin as Pin,
    Copy,
    ShareNetwork as Share2,
    LockOpen as Unlock,
    Trash as Trash2,
    ArrowLineLeft as ArrowLeftToLine,
    ArrowsOut as Maximize2,
    ArrowsIn as Minimize2,
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
    PresentationChart as PhWhiteboard,
    Sparkle as Sparkles
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

import { useRoomBoardData } from './hooks/useRoomBoardData';
import { PortalPopup } from '../../components/ui/PortalPopup';
import { DashboardConfig } from './components/dashboard/DashboardHeader';

// ============================================================================
// LAZY LOADED VIEW COMPONENTS - Only loaded when selected
// ============================================================================
const Lists = React.lazy(() => import('./views/List/Lists'));
const RoomTable = React.lazy(() => import('./views/Table/RoomTable'));
const KanbanBoard = React.lazy(() => import('./views/Kanban/KanbanBoard'));
const DocView = React.lazy(() => import('./views/Doc/DocView').then(m => ({ default: m.DocView })));
const CalendarView = React.lazy(() => import('./views/Calendar/CalendarView'));
const DataTable = React.lazy(() => import('./views/Table/DataTable'));
const PivotTable = React.lazy(() => import('./views/PivotTable/PivotTable').then(m => ({ default: m.PivotTable })));
const GanttView = React.lazy(() => import('./views/GanttChart/GanttView').then(m => ({ default: m.GanttView })));
const GTDDashboard = React.lazy(() => import('../../features/gtd/GTDDashboard').then(m => ({ default: m.GTDDashboard })));
const OverviewView = React.lazy(() => import('./views/Overview/OverviewView').then(m => ({ default: m.OverviewView })));
const ProcurementOverview = React.lazy(() => import('./views/Procurement/ProcurementOverview').then(m => ({ default: m.ProcurementOverview })));
const SalesInsights = React.lazy(() => import('../mini_company/operations/SalesInsights'));
const CornellNotesPage = React.lazy(() => import('../tools/cornell/CornellNotesPage'));
const WhiteboardView = React.lazy(() => import('../tools/WhiteboardView'));
const DashboardsView = React.lazy(() => import('../tools/DashboardsView'));
const AutomationRulesView = React.lazy(() => import('../tools/AutomationRulesView'));
const GoalsOKRsView = React.lazy(() => import('../tools/GoalsOKRsView'));
const WorkloadView = React.lazy(() => import('../tools/WorkloadView'));
const RecurringLogicView = React.lazy(() => import('../tools/RecurringLogicView'));
const SmartSheetView = React.lazy(() => import('../tools/SpreadsheetView'));
const TimelineView = React.lazy(() => import('./views/Timeline/TimelineView').then(m => ({ default: m.TimelineView })));
const SupplierInsights = React.lazy(() => import('../mini_company/suppliers/SupplierInsights'));
const CustomerInsights = React.lazy(() => import('../mini_company/customers/CustomerInsights'));
const PurchaseInsights = React.lazy(() => import('../mini_company/operations/PurchaseInsights'));
const InventoryInsights = React.lazy(() => import('../mini_company/operations/InventoryInsights'));
const ExpensesInsights = React.lazy(() => import('../mini_company/finance/ExpensesInsights'));


import { useUI } from '../../contexts/UIContext';
import { useAppContext } from '../../contexts/AppContext';
import { useAI } from '../../contexts/AIContext';
import { boardLogger } from '../../utils/logger';
import { SortableTab } from './components/SortableTab';

// Delayed spinner - prevents flash on fast loads
const DelayedSpinner: React.FC<{ delay?: number }> = ({ delay = 150 }) => {
    const [show, setShow] = React.useState(false);
    React.useEffect(() => {
        const timer = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);
    if (!show) return null;
    return <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />;
};

interface BoardViewProps {
    board: Board;
    onUpdateBoard?: (boardId: string, updates: Partial<Board>) => void;
    onUpdateTasks?: (tasks: any[]) => void;
    renderCustomView?: (viewId: string) => React.ReactNode;
    dashboardSections?: any[];
    onNavigate?: (view: string, boardId?: string) => void;
    isDepartmentLayout?: boolean;
}

export const BoardView: React.FC<BoardViewProps> = memo(({ board: initialBoard, onUpdateBoard: initialOnUpdateBoard, onUpdateTasks: initialOnUpdateTasks, renderCustomView, dashboardSections, onNavigate, isDepartmentLayout }) => {
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

    // NABD Brain - Auto-inject board context for AI awareness
    const { setCurrentBoardContext, setCurrentRoomContext } = useAI();

    React.useEffect(() => {
        if (board) {
            // Extract column names from board structure
            const columns = board.columns?.map((col: any) => col.title || col.name || col.id) || [];

            // Get sample tasks for AI context (limit to 10 for efficiency)
            const sampleTasks = tasks?.slice(0, 10).map((task: any) => ({
                id: task.id,
                name: task.name || task.title,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
            })) || [];

            setCurrentBoardContext({
                id: board.id,
                name: board.name,
                columns,
                taskCount: tasks?.length || 0,
                sampleTasks,
            });
        }

        // Cleanup - clear context when leaving the board
        return () => {
            setCurrentBoardContext(null);
        };
    }, [board?.id, board?.name, tasks?.length, setCurrentBoardContext]);

    const storageKey = `board-active-view-${board.id}`;

    const DEFAULT_VIEWS: BoardViewType[] = ['overview', 'table', 'kanban'];

    const sanitizedAvailableViews = useMemo(() => {
        let views = board.availableViews || [];

        // For sales board, normalize sales view IDs (remove timestamps) and dedupe
        if (board.id === 'dept-sales') {
            const salesViewIds = ['sales_insights', 'sales_performance', 'sales_analysis', 'sales_forecast', 'sales_funnel', 'sales_segmentation', 'sales_promotions'];
            const seen = new Set<string>();
            views = views.map(v => {
                // Normalize sales views with timestamps back to base ID
                const match = salesViewIds.find(id => v === id || (v as string).startsWith(`${id}-`));
                return match || v;
            }).filter(v => {
                if (seen.has(v as string)) return false;
                seen.add(v as string);
                return true;
            }) as BoardViewType[];
        }

        // Ensure 'overview' is always present and at the start
        const viewsWithoutOverview = views.filter(v => (v as any) !== 'overview' && (v as any) !== 'listboard' && (v as any) !== 'list_board');
        let finalViews = ['overview', ...viewsWithoutOverview] as BoardViewType[];

        // Enforce 'datatable' view for department layouts if missing
        if (isDepartmentLayout && !finalViews.includes('datatable')) {
            finalViews = [...finalViews, 'datatable'];
        }

        return finalViews;
    }, [board.availableViews, isDepartmentLayout, board.id]);

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
    const { t } = useAppContext();
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

    // Swipe gesture handling for fullscreen navigation
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isFullScreen) return;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!isFullScreen || touchStartX.current === null || touchStartY.current === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX.current;
        const deltaY = touchEndY - touchStartY.current;

        // Only trigger if horizontal swipe is dominant and significant
        if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            const currentIndex = sanitizedAvailableViews.indexOf(activeView);

            if (deltaX < 0 && currentIndex < sanitizedAvailableViews.length - 1) {
                // Swipe left -> next view
                setActiveView(sanitizedAvailableViews[currentIndex + 1]);
            } else if (deltaX > 0 && currentIndex > 0) {
                // Swipe right -> previous view
                setActiveView(sanitizedAvailableViews[currentIndex - 1]);
            }
        }

        touchStartX.current = null;
        touchStartY.current = null;
    };

    // Filter views for fullscreen navigation - only dashboard views (exclude overview, datatable)
    const fullscreenNavigableViews = useMemo(() => {
        const dashboardViews = ['sales_insights', 'sales_performance', 'sales_analysis', 'sales_forecast', 'sales_funnel', 'sales_segmentation', 'sales_promotions', 'purchase_overview', 'supplier_performance', 'purchase_behavior', 'cost_control', 'purchase_funnel', 'dependency_risk', 'forecast_planning', 'inventory_overview', 'stock_movement', 'inventory_aging', 'stock_accuracy', 'reorder_planning', 'warehouse_performance', 'inventory_forecast', 'expenses_overview', 'category_analysis', 'fixed_variable', 'trends_anomalies', 'approval_flow', 'dept_accountability', 'forecast_optimization', 'customer_overview', 'segmentation_value', 'behavior_patterns', 'retention_churn', 'journey_touchpoints', 'satisfaction_feedback', 'forecast_risk', 'supplier_overview', 'supplier_delivery', 'supplier_cost', 'supplier_quality', 'supplier_lead_time', 'supplier_risk', 'supplier_strategic'];
        return sanitizedAvailableViews.filter(view => dashboardViews.includes(view));
    }, [sanitizedAvailableViews]);

    // Keyboard navigation for fullscreen mode (both internal and browser fullscreen)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if in any fullscreen mode (internal or browser)
            const inBrowserFullscreen = !!document.fullscreenElement;
            if (!isFullScreen && !inBrowserFullscreen) return;

            // Use filtered views for navigation in fullscreen
            const currentIndex = fullscreenNavigableViews.indexOf(activeView);

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (currentIndex === -1) {
                    // If current view is not a dashboard, go to first dashboard
                    if (fullscreenNavigableViews.length > 0) {
                        setActiveView(fullscreenNavigableViews[0]);
                    }
                } else if (currentIndex < fullscreenNavigableViews.length - 1) {
                    setActiveView(fullscreenNavigableViews[currentIndex + 1]);
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (currentIndex === -1) {
                    // If current view is not a dashboard, go to last dashboard
                    if (fullscreenNavigableViews.length > 0) {
                        setActiveView(fullscreenNavigableViews[fullscreenNavigableViews.length - 1]);
                    }
                } else if (currentIndex > 0) {
                    setActiveView(fullscreenNavigableViews[currentIndex - 1]);
                }
            } else if (e.key === 'Escape') {
                // Only handle escape for internal fullscreen, browser handles its own
                if (isFullScreen && !inBrowserFullscreen) {
                    e.preventDefault();
                    toggleFullScreen();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen, activeView, fullscreenNavigableViews]);

    // Listen for dashboard fullscreen requests (so fullscreen persists across view changes)
    useEffect(() => {
        const handleDashboardFullscreen = () => {
            if (!document.fullscreenElement) {
                contentRef.current?.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        };

        window.addEventListener('dashboard-toggle-fullscreen', handleDashboardFullscreen);
        return () => window.removeEventListener('dashboard-toggle-fullscreen', handleDashboardFullscreen);
    }, []);

    // Animation state for view transitions
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const previousViewRef = useRef<string>(activeView);

    // Track view changes and trigger animation
    useEffect(() => {
        const inBrowserFullscreen = !!document.fullscreenElement;
        if ((isFullScreen || inBrowserFullscreen) && previousViewRef.current !== activeView) {
            const prevIndex = fullscreenNavigableViews.indexOf(previousViewRef.current as BoardViewType);
            const newIndex = fullscreenNavigableViews.indexOf(activeView);

            if (prevIndex !== -1 && newIndex !== -1) {
                setSlideDirection(newIndex > prevIndex ? 'left' : 'right');
                setIsAnimating(true);

                const timer = setTimeout(() => {
                    setIsAnimating(false);
                    setSlideDirection(null);
                }, 300);

                return () => clearTimeout(timer);
            }
        }
        previousViewRef.current = activeView;
    }, [activeView, isFullScreen, fullscreenNavigableViews]);

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

    // Clean up custom viewNames for sales dashboard views - these should always use the default labels
    useEffect(() => {
        if (board.id === 'dept-sales') {
            const salesViewIds = ['sales_insights', 'sales_performance', 'sales_analysis', 'sales_forecast', 'sales_funnel', 'sales_segmentation', 'sales_promotions'];
            const currentNames = { ...viewNames };
            let hasChanges = false;

            // Remove custom names for sales views
            Object.keys(currentNames).forEach(key => {
                if (salesViewIds.some(id => key === id || key.startsWith(`${id}-`))) {
                    delete currentNames[key];
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                setViewNames(currentNames);
                localStorage.setItem(viewNamesStorageKey, JSON.stringify(currentNames));
            }

            // Also clean up the board's availableViews to remove duplicates with timestamps
            if (onUpdateBoard && board.availableViews) {
                const cleanedViews = board.availableViews.map(v => {
                    const match = salesViewIds.find(id => v === id || (v as string).startsWith(`${id}-`));
                    return (match || v) as BoardViewType;
                });
                const uniqueViews = [...new Set(cleanedViews)];
                if (uniqueViews.length !== board.availableViews.length ||
                    !uniqueViews.every((v, i) => v === board.availableViews![i])) {
                    onUpdateBoard(board.id, { availableViews: uniqueViews });
                }
            }
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
        // Allow context menu even in department layouts, users might want to pin/rename/duplicate
        const rect = e.currentTarget.getBoundingClientRect();
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
            boardLogger.error('Failed to clear view storage', e);
        }
    };

    const handleDeleteView = () => {
        if (!contextMenu || !onUpdateBoard) return;

        const viewToDelete = contextMenu.viewId;
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
        { label: isDepartmentLayout ? t('insights') : t('overview'), icon: PhOverview, id: 'overview', description: t('board_overview_desc') },
        { label: t('table'), icon: PhTable, id: 'table', description: t('manage_workflows_desc') },
        { label: t('data_table'), icon: PhTable, id: 'datatable', description: t('high_perf_grid_desc') },
        { label: t('kanban'), icon: PhKanban, id: 'kanban', description: t('visualize_work_desc') },
        { label: t('list'), icon: PhList, id: 'list', description: t('simple_list_desc') },
        { label: t('calendar'), icon: PhCalendar, id: 'calendar', description: t('schedule_tasks_desc') },
        { label: t('doc'), icon: PhFileText, id: 'doc', description: t('collaborate_docs_desc') },
        { label: t('gantt'), icon: PhGantt, id: 'gantt', description: t('visual_timeline_desc') },

        ...(isWarehouseBoard ? [{ label: t('capacity_map'), icon: PhWarehouse, id: 'warehouse_capacity_map', description: t('capacity_map') }] : []),
        { label: t('workload'), icon: PhWorkload, id: 'workload', description: t('balance_assignments_desc') },
        { label: t('smart_sheet'), icon: PhSpreadsheet, id: 'spreadsheet', description: t('spreadsheet_workspace_desc') },
        { label: t('gtd_system'), icon: PhCheckSquare, id: 'gtd', description: t('gtd_desc') },
        { label: t('cornell_notes'), icon: PhNotepad, id: 'cornell', description: t('cornell_desc') },
        { label: t('automation_rules'), icon: PhAutomation, id: 'automation_rules', description: t('automation_desc') },
        { label: t('goals_okrs'), icon: PhTarget, id: 'goals_okrs', description: t('goals_desc') },
        { label: t('recurring'), icon: PhRecurring, id: 'recurring', description: t('recurring_desc') },
        { label: t('timeline'), icon: PhGantt, id: 'timeline', description: t('timeline_desc') },
        { label: t('whiteboard'), icon: PhWhiteboard, id: 'whiteboard', description: t('whiteboard_desc') },
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
                if (board.id === 'procurement-main') {
                    return (
                        <div className="w-full h-full overflow-hidden">
                            <ProcurementOverview />
                        </div>
                    );
                }
                if (board.id === 'dept-sales') {
                    return (
                        <div className="w-full h-full overflow-hidden">
                            <SalesInsights />
                        </div>
                    );
                }
                if (board.id === 'supplier-data') {
                    return (
                        <div className="w-full h-full overflow-hidden">
                            <SupplierInsights />
                        </div>
                    );
                }
                if (board.id === 'customer-data') {
                    return (
                        <div className="w-full h-full overflow-hidden">
                            <CustomerInsights />
                        </div>
                    );
                }
                if (board.id === 'dept-purchases') {
                    return (
                        <div className="w-full h-full overflow-hidden">
                            <PurchaseInsights />
                        </div>
                    );
                }
                if (board.id === 'dept-inventory') {
                    return (
                        <div className="w-full h-full overflow-hidden">
                            <InventoryInsights />
                        </div>
                    );
                }
                if (board.id === 'dept-expenses') {
                    return (
                        <div className="w-full h-full overflow-hidden">
                            <ExpensesInsights />
                        </div>
                    );
                }
                return <OverviewView boardId={board.id} tasks={tasks} />;


            // Sales Dashboard Views - handled via renderCustomView
            case 'purchase_overview':
            case 'supplier_performance':
            case 'purchase_behavior':
            case 'cost_control':
            case 'purchase_funnel':
            case 'dependency_risk':
            case 'forecast_planning':
            case 'sales_insights':
            case 'sales_performance':
            case 'sales_analysis':
            case 'sales_forecast':
            case 'sales_funnel':
            case 'sales_segmentation':
            case 'inventory_overview':
            case 'stock_movement':
            case 'inventory_aging':
            case 'stock_accuracy':
            case 'reorder_planning':
            case 'warehouse_performance':
            case 'inventory_forecast':
            case 'expenses_overview':
            case 'category_analysis':
            case 'fixed_variable':
            case 'trends_anomalies':
            case 'approval_flow':
            case 'dept_accountability':
            case 'forecast_optimization':
            case 'customer_overview':
            case 'segmentation_value':
            case 'behavior_patterns':
            case 'retention_churn':
            case 'journey_touchpoints':
            case 'satisfaction_feedback':
            case 'forecast_risk':
            case 'supplier_overview':
            case 'supplier_delivery':
            case 'supplier_cost':
            case 'sales_promotions':
            case 'supplier_quality':
            case 'supplier_lead_time':
            case 'supplier_risk':
            case 'supplier_strategic':
                if (renderCustomView) {
                    const custom = renderCustomView(baseViewType);
                    if (custom) {
                        return (
                            <div className="w-full h-full overflow-y-auto relative">
                                {custom}
                            </div>
                        );
                    }
                }
                return null;
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
                className={`flex-shrink-0 bg-white dark:bg-monday-dark-surface grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isFullScreen ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
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
                                        <div className="w-80 bg-white/90 dark:bg-monday-dark-surface/90 backdrop-blur-xl border border-blue-500/20 dark:border-blue-400/20 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-5 animate-in fade-in zoom-in-95 duration-200 mt-2">
                                            <div className="space-y-5">
                                                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('board_settings')}</span>
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <Pencil size={12} className="text-blue-500" />
                                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{t('name')}</label>
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
                                                            placeholder={t('board_name_placeholder')}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <PhFileText size={12} className="text-blue-500" />
                                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{t('description')}</label>
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
                                                            placeholder={t('add_description')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </PortalPopup>
                                )}
                            </div>

                            {/* Right: Actions */}
                            {!isDepartmentLayout && (
                                <div className="flex items-center gap-1 md:gap-3">
                                    <button
                                        onClick={toggleFullScreen}
                                        className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                                        title={t('enter_fullscreen')}
                                    >
                                        <Maximize2 size={18} />
                                    </button>
                                </div>
                            )}
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
                                            onContextMenu={(e) => {
                                                if (isDepartmentLayout) {
                                                    e.preventDefault();
                                                    return;
                                                }
                                                handleContextMenu(e, 'overview');
                                            }}
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
                                                    onContextMenu={(e) => {
                                                        if (isDepartmentLayout) {
                                                            e.preventDefault();
                                                            return;
                                                        }
                                                        handleContextMenu(e, viewId as BoardViewType);
                                                    }}
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

                                                <button className="flex items-center gap-2 py-1.5 border-b-2 border-slate-900 text-[13px] font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap bg-white dark:bg-monday-dark-surface shadow-lg rounded opacity-90 cursor-grabbing">
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
                            {!isDepartmentLayout && (
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
                                            <div className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-[450px] py-3 animate-in fade-in zoom-in-95 duration-150">
                                                <div className="px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('add_view')}</h3>
                                                </div>
                                                <div className="max-h-[450px] overflow-y-auto no-scrollbar">
                                                    {/* Simple Tools */}
                                                    <div className="px-4 pt-3 pb-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('simple_tools')}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                                                        {VIEW_OPTIONS.filter(opt => !['list', 'gtd', 'cornell', 'automation_rules', 'goals_okrs', 'recurring', 'spreadsheet', 'workload', 'whiteboard'].includes(opt.id)).map((option) => (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => handleAddView(option)}
                                                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-start transition-colors"
                                                            >
                                                                <option.icon size={18} weight="regular" className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                                <div className="text-start">
                                                                    <span className="block text-[13px] text-gray-700 dark:text-gray-200 font-medium leading-tight">{option.label}</span>
                                                                    <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{option.description}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Advanced Tools */}
                                                    <div className="border-t border-gray-100 dark:border-gray-800">
                                                        <div className="px-4 pt-3 pb-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('advanced_tools')}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                                                            {VIEW_OPTIONS.filter(opt => ['gtd', 'cornell', 'automation_rules', 'goals_okrs', 'recurring', 'spreadsheet', 'workload', 'whiteboard'].includes(opt.id)).map((option) => (
                                                                <button
                                                                    key={option.id}
                                                                    onClick={() => handleAddView(option)}
                                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-start transition-colors"
                                                                >
                                                                    <option.icon size={18} weight="regular" className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                                    <div className="text-start">
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
                                                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-start transition-colors"
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
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {(() => {
                const type = getBaseViewType(activeView);
                const isDashboardBoard = ['dept-sales', 'supplier-data', 'customer-data'].includes(board.id);
                const isFullWidth = ['table', 'datatable', 'gantt', 'spreadsheet', 'calendar', 'sales_insights', 'sales_performance', 'sales_analysis', 'sales_forecast', 'sales_funnel', 'sales_segmentation', 'sales_promotions', 'purchase_overview', 'supplier_performance', 'purchase_behavior', 'cost_control', 'purchase_funnel', 'dependency_risk', 'forecast_planning', 'inventory_overview', 'stock_movement', 'inventory_aging', 'stock_accuracy', 'reorder_planning', 'warehouse_performance', 'inventory_forecast', 'expenses_overview', 'category_analysis', 'fixed_variable', 'trends_anomalies', 'approval_flow', 'dept_accountability', 'forecast_optimization', 'customer_overview', 'segmentation_value', 'behavior_patterns', 'retention_churn', 'journey_touchpoints', 'satisfaction_feedback', 'forecast_risk', 'supplier_overview', 'supplier_delivery', 'supplier_cost', 'supplier_quality', 'supplier_lead_time', 'supplier_risk', 'supplier_strategic'].includes(type) || (type === 'overview' && isDashboardBoard);
                const currentViewIndex = fullscreenNavigableViews.indexOf(activeView);
                const currentViewOption = effectiveViewOptions.find(v => v.id === getBaseViewType(activeView));

                return (
                    <div
                        ref={contentRef}
                        className={`flex-1 overflow-hidden flex flex-col relative bg-white dark:bg-monday-dark-surface ${isFullWidth ? 'px-0' : 'px-6'}`}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            className={`flex-1 overflow-hidden transition-all duration-300 ease-out ${isAnimating
                                ? slideDirection === 'left'
                                    ? 'animate-slide-in-right'
                                    : 'animate-slide-in-left'
                                : ''
                                }`}
                            style={{
                                animation: isAnimating
                                    ? `${slideDirection === 'left' ? 'slideInFromRight' : 'slideInFromLeft'} 0.3s ease-out forwards`
                                    : 'none'
                            }}
                        >
                            <React.Suspense fallback={
                                <div className="flex items-center justify-center h-full w-full">
                                    <DelayedSpinner delay={150} />
                                </div>
                            }>
                                {renderView()}
                            </React.Suspense>
                        </div>

                        {/* Global Exit Full Screen Floating Button */}
                        {isFullScreen && (
                            <button
                                onClick={toggleFullScreen}
                                className="absolute bottom-6 right-6 z-50 p-2 bg-white dark:bg-monday-dark-surface border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg shadow-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-all opacity-50 hover:opacity-100"
                                title={t('exit_fullscreen')}
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
                        onClick={() => setContextMenu(null)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu(null);
                        }}
                    >
                        <div
                            ref={contextMenuRef}
                            className="absolute bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1.5 w-56 animate-in fade-in zoom-in-95 duration-150"
                            style={{
                                top: contextMenu.y + 8,
                                ...(document.dir === 'rtl' || document.documentElement.dir === 'rtl'
                                    ? { right: window.innerWidth - contextMenu.x }
                                    : { left: contextMenu.x }),
                                pointerEvents: 'auto'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-3.5 py-1.5 border-b border-gray-100/50 dark:border-gray-800/50 mb-1">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('tab_options')}</span>
                            </div>

                            <div className="px-1.5 space-y-0.5">
                                <button
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 transition-all group"
                                    onClick={handlePinView}
                                >
                                    <Pin size={16} weight={(board.pinnedViews || []).includes(contextMenu.viewId) ? "fill" : "regular"} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    <span className="text-[13px] font-medium">
                                        {(board.pinnedViews || []).includes(contextMenu.viewId) ? t('unpin_view') : t('pin_view')}
                                    </span>
                                </button>

                                <button
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 transition-all group"
                                    onClick={handleRenameView}
                                >
                                    <Pencil size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                    <span className="text-[13px] font-medium">{t('rename_view')}</span>
                                </button>

                                <button
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 transition-all group"
                                    onClick={handleDuplicateView}
                                >
                                    <Copy size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    <span className="text-[13px] font-medium">{t('duplicate_view')}</span>
                                </button>

                                <button
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 transition-all group"
                                    onClick={() => { navigator.clipboard.writeText(window.location.href); setContextMenu(null); }}
                                >
                                    <Share2 size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                    <span className="text-[13px] font-medium">{t('share_view')}</span>
                                </button>
                            </div>

                            <div className="my-1 border-t border-gray-100/50 dark:border-gray-800/50 mx-2"></div>

                            <div className="px-1.5 flex gap-1 items-center pb-1">
                                <button
                                    className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-lg text-[12px] font-semibold text-slate-500 dark:text-slate-400 transition-colors group"
                                    onClick={() => handleMoveView('left')}
                                >
                                    <ArrowLeftToLine size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                                    <span>{t('left')}</span>
                                </button>
                                <button
                                    className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-lg text-[12px] font-semibold text-slate-500 dark:text-slate-400 transition-colors group"
                                    onClick={() => handleMoveView('right')}
                                >
                                    <span>{t('right')}</span>
                                    <ArrowLeftToLine size={14} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>

                            <div className="my-1 border-t border-gray-100/50 dark:border-gray-800/50 mx-2"></div>

                            <div className="px-1.5 space-y-0.5">
                                <button
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-all group"
                                    onClick={handleDeleteView}
                                >
                                    <Trash2 size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                                    <span className="text-[13px] font-medium">{t('delete_view')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
});

BoardView.displayName = 'BoardView';
