import React, { useState, useRef, useEffect } from 'react';
import {
    Table, Layout as LayoutTemplate, ChartPie as PieChart, Trash as Trash2, DotsSix as GripHorizontal, TrendUp as TrendingUp, TrendDown as TrendingDown,
    ArrowsOut as Maximize2, ArrowsIn as Minimize2, ChartLine as LineChart, ChartBar as BarChart, ChartLine as AreaChart, Activity, Gauge,
    Bell, WarningCircle as AlertCircle, Clock
} from 'phosphor-react';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import { Priority } from '../../types/boardTypes';
import { useAppContext } from '../../../../contexts/AppContext';
import { boardLogger } from '../../../../utils/logger';

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
                bg-white dark:bg-monday-dark-elevated border-gray-100 dark:border-gray-800 shadow-sm
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
    const { t } = useAppContext();

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
                    <svg viewBox="0 0 100 40" className={`w-full h-full stroke-2 fill-none ${isPositive ? 'stroke-emerald-500' : 'stroke-red-500'} `}>
                        <path d="M0 35 Q 25 35 35 20 T 70 20 T 100 5" />
                    </svg>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} `}>
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span>{Math.abs(widget.trend || 0)}%</span>
                </div>
                <span className="text-[10px] text-gray-400">{t('vs_last_month')}</span>
            </div>
        </div>
    );
};

const ChartContent = ({ widget }: { widget: Widget }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 dark:bg-monday-dark-surface rounded-lg border border-dashed border-gray-200 dark:border-gray-800 p-2">
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
        <div className="w-full h-full overflow-hidden bg-white dark:bg-monday-dark-surface rounded-lg border border-gray-100 dark:border-gray-800">
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

// --- Task Status Bar Chart ---
const TaskStatusBarChart = ({ tasks, t }: { tasks: any[], t: (key: string) => string }) => {
    const statusCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        tasks.forEach(task => {
            const status = task.status || 'Not Started';
            counts[status] = (counts[status] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [tasks]);

    const maxCount = Math.max(...statusCounts.map(([, count]) => count), 1);

    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('done') || statusLower.includes('complete')) return 'bg-emerald-500';
        if (statusLower.includes('progress') || statusLower.includes('working')) return 'bg-blue-500';
        if (statusLower.includes('review')) return 'bg-purple-500';
        if (statusLower.includes('blocked') || statusLower.includes('stuck')) return 'bg-red-500';
        return 'bg-gray-400';
    };

    return (
        <div className="bg-white dark:bg-monday-dark-elevated rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <BarChart size={16} className="text-blue-500" />
                {t('tasks_by_status')}
            </h3>
            <div className="space-y-3">
                {statusCounts.length === 0 ? (
                    <p className="text-xs text-gray-400">{t('no_tasks')}</p>
                ) : (
                    statusCounts.slice(0, 5).map(([status, count]) => (
                        <div key={status} className="flex items-center gap-3">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-24 truncate">{status}</span>
                            <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${getStatusColor(status)} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                >
                                    <span className="text-[10px] font-bold text-white">{count}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Priority Gauge Widget (Semi-circular) ---
const PriorityGaugeWidget = ({ tasks, t }: { tasks: any[], t: (key: string) => string }) => {
    const priorityCounts = React.useMemo(() => {
        let high = 0, medium = 0, low = 0, none = 0;
        tasks.forEach(task => {
            const p = (task.priority || '').toLowerCase();
            if (p === 'high' || p === 'urgent') high++;
            else if (p === 'medium') medium++;
            else if (p === 'low') low++;
            else none++;
        });
        return { high, medium, low, none, total: tasks.length };
    }, [tasks]);

    const total = priorityCounts.total || 1;
    const segments = [
        { label: 'High', count: priorityCounts.high, color: '#ef4444', offset: 0 },
        { label: 'Medium', count: priorityCounts.medium, color: '#f59e0b', offset: priorityCounts.high / total },
        { label: 'Low', count: priorityCounts.low, color: '#22c55e', offset: (priorityCounts.high + priorityCounts.medium) / total },
        { label: 'None', count: priorityCounts.none, color: '#d1d5db', offset: (priorityCounts.high + priorityCounts.medium + priorityCounts.low) / total },
    ];

    return (
        <div className="bg-white dark:bg-monday-dark-elevated rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <Gauge size={16} className="text-purple-500" />
                {t('priority_breakdown')}
            </h3>
            <div className="text-xs text-gray-400 mb-2">{t('total_score')}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{priorityCounts.total}</div>

            {/* Semi-circular gauge using SVG */}
            <div className="relative w-48 h-24 mb-2">
                <svg viewBox="0 0 200 100" className="w-full h-full">
                    {segments.map((seg, idx) => {
                        const ratio = seg.count / total;
                        const startAngle = 180 + (seg.offset * 180);
                        const endAngle = startAngle + (ratio * 180);
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;
                        const x1 = 100 + 80 * Math.cos(startRad);
                        const y1 = 100 + 80 * Math.sin(startRad);
                        const x2 = 100 + 80 * Math.cos(endRad);
                        const y2 = 100 + 80 * Math.sin(endRad);
                        const largeArc = ratio > 0.5 ? 1 : 0;

                        if (ratio === 0) return null;

                        return (
                            <path
                                key={idx}
                                d={`M ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2}`}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth="16"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center text-[10px]">
                {segments.filter(s => s.count > 0).map((seg, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="text-gray-600 dark:text-gray-400">{seg.label}: {seg.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Recent Tasks Widget ---
const RecentTasksWidget = ({ tasks, t }: { tasks: any[], t: (key: string) => string }) => {
    const recentTasks = React.useMemo(() => {
        return [...tasks]
            .filter(t => t.name)
            .slice(0, 5);
    }, [tasks]);

    return (
        <div className="bg-white dark:bg-monday-dark-elevated rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                {t('recent_tasks')}
            </h3>
            <div className="space-y-2">
                {recentTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">{t('no_tasks')}</p>
                ) : (
                    recentTasks.map((task, idx) => (
                        <div key={task.id || idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className={`w-2 h-2 rounded-full ${task.status?.toLowerCase().includes('done') ? 'bg-emerald-500' :
                                    task.status?.toLowerCase().includes('progress') ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{task.name}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Upcoming Deadlines Widget ---
const UpcomingDeadlinesWidget = ({ tasks, t }: { tasks: any[], t: (key: string) => string }) => {
    const upcomingTasks = React.useMemo(() => {
        const now = new Date();
        return [...tasks]
            .filter(task => {
                if (!task.dueDate || task.status === 'Done') return false;
                try {
                    const dueDate = new Date(task.dueDate);
                    return !isNaN(dueDate.getTime()) && dueDate >= now;
                } catch { return false; }
            })
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
    }, [tasks]);

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch { return dateStr; }
    };

    return (
        <div className="bg-white dark:bg-monday-dark-elevated rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                {t('upcoming_deadlines')}
            </h3>
            <div className="space-y-2">
                {upcomingTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">{t('no_tasks')}</p>
                ) : (
                    upcomingTasks.map((task, idx) => (
                        <div key={task.id || idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{task.name}</span>
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 ml-2">{formatDate(task.dueDate)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Main Component ---
export const OverviewView: React.FC<OverviewViewProps> = ({ boardId, tasks = [] }) => {
    const storageKey = `overview-widgets-${boardId}`;
    const { t } = useAppContext();

    const [widgets, setWidgets] = useState<Widget[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            // Invalid JSON in localStorage, use defaults
            boardLogger.warn('Failed to parse saved widgets from localStorage', e);
        }

        // Default workspace
        return [
            { id: 'kpi-total', type: 'kpi', title: t('total_tasks_kpi'), value: String(tasks.length), trend: 0, colSpan: 3 },
            { id: 'kpi-urgent', type: 'kpi', title: t('urgent_tasks_kpi'), value: '0', trend: 0, colSpan: 3 },
            { id: 'kpi-overdue', type: 'kpi', title: t('overdue_kpi'), value: '0', trend: 0, colSpan: 3 },
            { id: 'reminders', type: 'kpi', title: t('notifications_kpi'), value: 'Board active', colSpan: 3 },
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
        <div className="w-full h-full flex flex-col bg-gray-50/50 dark:bg-monday-dark-bg overflow-y-auto pb-20">
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
                                // Create a display widget for rendering to ensure reactive titles
                                const displayWidget = { ...widget };

                                if (widget.id === 'kpi-total') {
                                    displayWidget.title = t('total_tasks_kpi');
                                    content = <KPIContent widget={{ ...displayWidget, value: String(tasks.length) }} />;
                                } else if (widget.id === 'kpi-urgent') {
                                    displayWidget.title = t('urgent_tasks_kpi');
                                    content = <KPIContent widget={{ ...displayWidget, value: String(urgentCount) }} />;
                                } else if (widget.id === 'kpi-overdue') {
                                    displayWidget.title = t('overdue_kpi');
                                    content = <KPIContent widget={{ ...displayWidget, value: String(overdueCount) }} />;
                                } else if (widget.id === 'reminders') {
                                    displayWidget.title = t('notifications_kpi');
                                    content = (
                                        <div className="flex flex-col gap-2">
                                            {urgentCount > 0 ? (
                                                <div className="flex items-center gap-2 text-rose-500 text-[11px] font-medium animate-pulse">
                                                    <AlertCircle size={14} />
                                                    <span>{t('urgent_items_attention').replace('{count}', String(urgentCount))}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-emerald-500 text-[11px] font-medium">
                                                    <Bell size={14} />
                                                    <span>{t('all_items_on_track')}</span>
                                                </div>
                                            )}
                                            {overdueCount > 0 && (
                                                <div className="flex items-center gap-2 text-amber-500 text-[11px] font-medium">
                                                    <Clock size={14} />
                                                    <span>{t('items_past_deadline').replace('{count}', String(overdueCount))}</span>
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
                                        widget={displayWidget}
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
