import React, { useState, useRef, useEffect } from 'react';
import {
    Table, Layout as LayoutTemplate, ChartPie as PieChart, Trash as Trash2, DotsSix as GripHorizontal, TrendUp as TrendingUp, TrendDown as TrendingDown,
    ArrowsOut as Maximize2, ArrowsIn as Minimize2, ChartLine as LineChart, ChartBar as BarChart, ChartLine as AreaChart, Activity, Gauge,
    Bell, WarningCircle as AlertCircle, Clock
} from 'phosphor-react';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import { Priority } from '../../types/boardTypes';

// DnD Kit Imports
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
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OverviewViewProps {
    boardId: string;
    tasks?: any[];
}

type WidgetType = 'kpi' | 'chart' | 'table';

interface Widget {
    id: string;
    type: WidgetType;
    title: string;
    description?: string;
    chartType?: string;
    // For 12-column grid
    colSpan: number;
    // Mock data for KPIs
    value?: string;
    trend?: number;
    trendLabel?: string;
}

interface SortableWidgetProps {
    widget: Widget;
    children: React.ReactNode;
    onResize?: (id: string, span: number) => void;
    onDelete: (id: string) => void;
}

// --- Sortable Widget Wrapper ---
const SortableWidget: React.FC<SortableWidgetProps> = ({
    widget,
    children,
    onResize,
    onDelete
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: widget.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: `span ${widget.colSpan} `,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleResize = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onResize) return;

        // Cycle sizes: Third (4) -> Half (6) -> Full (12) -> Third
        let newSpan = 4;
        if (widget.colSpan === 4) newSpan = 6;
        else if (widget.colSpan === 6) newSpan = 12;

        onResize(widget.id, newSpan);
    };

    const isTable = widget.type === 'table';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group relative flex flex-col
                bg-white dark:bg-[#25282e] border-gray-100 dark:border-gray-800 shadow-sm
                hover:shadow-md transition-all duration-200
                ${isTable ? '-mx-6 w-[calc(100%+3rem)] rounded-none border-y' : 'rounded-xl border'}
            `}
        >
            {/* Widget Header Area with Drag Handle - Compact padding */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 dark:border-gray-800/50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                    >
                        <GripHorizontal size={12} />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={`
p - 0.5 rounded - md
                            ${widget.type === 'kpi' ? 'text-purple-500' : widget.type === 'chart' ? 'text-emerald-500' : 'text-blue-500'}
`}>
                            {widget.type === 'kpi' ? <LayoutTemplate size={12} /> :
                                widget.type === 'chart' ? <PieChart size={12} /> : <Table size={12} />}
                        </div>
                        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{widget.title}</h3>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Resize Button (Charts only) */}
                    {widget.type === 'chart' && (
                        <button
                            onClick={handleResize}
                            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Resize Widget"
                        >
                            {widget.colSpan === 12 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(widget.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Widget"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Content Content - Compact padding */}
            <div className="flex-1 px-3 py-2 min-h-[60px] flex flex-col justify-center">
                {children}
            </div>
        </div>
    );
};

// --- Widget Content Components ---

const KPIContent = ({ widget }: { widget: Widget }) => {
    const isPositive = (widget.trend || 0) > 0;

    return (
        <div className="flex flex-col h-full justify-center gap-1">
            <div className="flex justify-between items-end">
                <div>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none">
                        {widget.value || '0'}
                    </span>
                </div>
                {/* Mini Sparkline Visualization (Mock) */}
                <div className="w-16 h-8 opacity-50 mb-0.5">
                    <svg viewBox="0 0 100 40" className={`w - full h - full stroke - 2 fill - none ${isPositive ? 'stroke-emerald-500' : 'stroke-red-500'} `}>
                        <path d="M0 35 Q 25 35 35 20 T 70 20 T 100 5" />
                    </svg>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className={`flex items - center gap - 0.5 text - [10px] font - bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} `}>
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span>{Math.abs(widget.trend || 0)}%</span>
                </div>
                <span className="text-[10px] text-gray-400">vs last month</span>
            </div>
        </div>
    );
};

const ChartContent = ({ widget }: { widget: Widget }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 dark:bg-[#1a1d24] rounded-lg border border-dashed border-gray-200 dark:border-gray-800 p-2">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 mb-2">
                    <PieChart size={16} />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {widget.chartType || 'Chart'}
                </p>
            </div>
        </div>
    );
};

import RoomTable from '../Table/RoomTable';

const TableContent = ({ widget, boardId }: { widget: Widget, boardId: string }) => {
    // Minimal columns for the widget view
    const widgetColumns = [
        { id: 'select', label: '', type: 'select', width: 40, minWidth: 40, resizable: false, pinned: true },
        // Pin 'Name' as well to ensure it freezes
        { id: 'name', label: 'Name', type: 'text', width: 300, minWidth: 200, resizable: true, pinned: true },
    ];

    return (
        <div className="w-full h-full overflow-hidden bg-white dark:bg-[#1a1d24] rounded-lg border border-gray-100 dark:border-gray-800">
            <RoomTable
                roomId={boardId}
                viewId={`datatable - ${widget.id} `}
                defaultColumns={widgetColumns}
                enableColumnReorder={false}
                simpleColumnAdd={true}
                enableImport={true}
            />
        </div>
    );
};

// --- Main Component ---
export const OverviewView: React.FC<OverviewViewProps> = ({ boardId, tasks = [] }) => {
    const storageKey = `overview-widgets-${boardId}`;

    const [widgets, setWidgets] = useState<Widget[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            // Invalid JSON in localStorage, use defaults
            console.warn('[OverviewView] Failed to parse saved widgets from localStorage:', e);
        }

        // Default workspace
        return [
            { id: 'kpi-total', type: 'kpi', title: 'Total Tasks', value: String(tasks.length), trend: 0, colSpan: 3 },
            { id: 'kpi-urgent', type: 'kpi', title: 'Urgent Tasks', value: '0', trend: 0, colSpan: 3 },
            { id: 'kpi-overdue', type: 'kpi', title: 'Overdue', value: '0', trend: 0, colSpan: 3 },
            { id: 'reminders', type: 'kpi', title: 'Notifications', value: 'Board active', colSpan: 3 },
        ];
    });

    // Save widgets on change
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(widgets));
    }, [widgets, storageKey]);

    // Update KPI values based on real tasks
    const urgentCount = tasks.filter(t => t.priority === 'High' || t.priority === 'Urgent' || t.priority === Priority.High || t.priority === Priority.Urgent).length;
    const overdueCount = tasks.filter(t => {
        if (!t.dueDate || t.status === 'Done') return false;
        try {
            const dueDate = new Date(t.dueDate);
            return !isNaN(dueDate.getTime()) && dueDate < new Date();
        } catch (e) {
            return false;
        }
    }).length;

    const [showKPIMenu, setShowKPIMenu] = useState(false);
    const [showChartMenu, setShowChartMenu] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const containerRef = useRef<HTMLDivElement>(null);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setWidgets((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleAddKPI = (count: number) => {
        const newWidgets: Widget[] = Array(count).fill(null).map((_, i) => ({
            id: `kpi - ${Date.now()} -${i} `,
            type: 'kpi',
            title: `Revenue Metric ${i + 1} `,
            value: `$${(Math.random() * 10000).toFixed(2)} `,
            trend: Math.floor(Math.random() * 40) - 10,
            chartType: 'Financial',
            colSpan: 3 // Keep KPIs at 1/4 width (3 cols)
        }));
        setWidgets([...widgets, ...newWidgets]);
        setShowKPIMenu(false);
    };

    const handleAddChart = (chartType: string) => {
        const newWidget: Widget = {
            id: `chart - ${Date.now()} `,
            type: 'chart',
            title: `${chartType} Analysis`,
            chartType: chartType,
            colSpan: 4 // Changed to 4 columns (1/3 width) by default for 3-per-row layout
        };
        setWidgets([...widgets, newWidget]);
        setShowChartMenu(false);
    };

    const handleAddTable = () => {
        const newWidget: Widget = {
            id: `table - ${Date.now()} `,
            type: 'table',
            title: 'Data Table',
            colSpan: 12 // Tables default to full width
        };
        setWidgets([...widgets, newWidget]);
    };

    const handleResize = (id: string, span: number) => {
        setWidgets(prev => prev.map(w => w.id === id ? { ...w, colSpan: span } : w));
    };

    const handleDelete = (id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
    };

    // Chart Types for Mega Menu
    const CHART_TYPES = [
        { id: 'Line', icon: LineChart, label: 'Line Chart', desc: 'Trends over time' },
        { id: 'Bar', icon: BarChart, label: 'Bar Chart', desc: 'Comparisons' },
        { id: 'Pie', icon: PieChart, label: 'Pie Chart', desc: 'Proportions' },
        { id: 'Area', icon: AreaChart, label: 'Area Chart', desc: 'Volume trends' },
        // { id: 'Scatter', icon: ScatterChart, label: 'Scatter Plot', desc: 'Correlations' }, // Icon unavailable
        { id: 'Radar', icon: PieChart, label: 'Radar Chart', desc: 'Multi-variable' },
        { id: 'Funnel', icon: Activity, label: 'Funnel', desc: 'Process conversion' },
        { id: 'Gauge', icon: Gauge, label: 'Gauge', desc: 'Performance meter' },
    ];

    return (
        <div className="w-full h-full flex flex-col bg-gray-50/50 dark:bg-[#15171b] overflow-y-auto pb-20">
            {/* Canvas Area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="p-6 flex-1 min-h-[500px]">
                    <SortableContext
                        items={widgets.map(w => w.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-12 gap-6">
                            {widgets.map((widget) => {
                                let content;
                                if (widget.id === 'kpi-total') {
                                    content = <KPIContent widget={{ ...widget, value: String(tasks.length) }} />;
                                } else if (widget.id === 'kpi-urgent') {
                                    content = <KPIContent widget={{ ...widget, title: 'Urgent Tasks', value: String(urgentCount) }} />;
                                } else if (widget.id === 'kpi-overdue') {
                                    content = <KPIContent widget={{ ...widget, title: 'Overdue', value: String(overdueCount) }} />;
                                } else if (widget.id === 'reminders') {
                                    content = (
                                        <div className="flex flex-col gap-2">
                                            {urgentCount > 0 ? (
                                                <div className="flex items-center gap-2 text-rose-500 text-[11px] font-medium animate-pulse">
                                                    <AlertCircle size={14} />
                                                    <span>{urgentCount} urgent items require attention</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-emerald-500 text-[11px] font-medium">
                                                    <Bell size={14} />
                                                    <span>All items are on track</span>
                                                </div>
                                            )}
                                            {overdueCount > 0 && (
                                                <div className="flex items-center gap-2 text-amber-500 text-[11px] font-medium">
                                                    <Clock size={14} />
                                                    <span>{overdueCount} items are past their deadline</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else {
                                    content = (
                                        <>
                                            {widget.type === 'kpi' && <KPIContent widget={widget} />}
                                            {widget.type === 'chart' && <ChartContent widget={widget} />}
                                            {widget.type === 'table' && <TableContent widget={widget} boardId={boardId} />}
                                        </>
                                    );
                                }

                                return (
                                    <SortableWidget
                                        key={widget.id}
                                        widget={widget}
                                        onResize={handleResize}
                                        onDelete={handleDelete}
                                    >
                                        {content}
                                    </SortableWidget>
                                );
                            })}
                        </div>
                    </SortableContext>
                </div>
            </DndContext>
        </div>
    );
};
