import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Row } from '../Table/RoomTable';
import {
    CaretDown as ChevronDown,
    Plus,
    MagnifyingGlass as Search,
    Gear as Settings,
    Layout,
    ArrowsOut as Maximize2,
    Funnel as Filter,
    DotsThree as MoreHorizontal,
    CheckCircle as CheckCircle2
} from 'phosphor-react';

interface TimelineViewProps {
    roomId: string;
    boardName?: string;
    tasks: Row[];
    onUpdateTasks: (tasks: any[]) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ roomId, boardName = 'Board', tasks, onUpdateTasks }) => {
    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Helpers ---
    const addDays = (d: Date, days: number) => {
        const result = new Date(d);
        result.setDate(result.getDate() + days);
        return result;
    };

    const getStartOfMonth = (d: Date) => {
        return new Date(d.getFullYear(), d.getMonth(), 1);
    };

    // --- Timeline Generation (Grid) ---
    // Generate a large range centered on currentDate
    const timelineStart = useMemo(() => {
        const start = getStartOfMonth(new Date(currentDate));
        start.setDate(start.getDate() - 5);
        return start;
    }, [currentDate]);

    const timelineEnd = useMemo(() => {
        const end = new Date(timelineStart);
        end.setDate(end.getDate() + 45); // ~1.5 months visible
        return end;
    }, [timelineStart]);

    const days = useMemo(() => {
        const d = [];
        let curr = new Date(timelineStart);
        while (curr <= timelineEnd) {
            d.push(new Date(curr));
            curr = addDays(curr, 1);
        }
        return d;
    }, [timelineStart, timelineEnd]);

    // Dimensions
    const CELL_WIDTH = 50 * zoom;
    const HEADER_HEIGHT = 80; // Taller header to accommodate month and days

    // --- Task Processing ---
    const processedTasks = useMemo(() => {
        return (tasks || []).map(row => {
            let end = row.dueDate ? new Date(row.dueDate) : new Date();
            // Default start to end - 1 day if not set, just for visualization
            let start = row.startDate ? new Date(row.startDate) : (row.date ? new Date(row.date) : addDays(end, -1));

            if (isNaN(end.getTime())) end = new Date();
            if (isNaN(start.getTime())) start = addDays(end, -1);

            if (start > end) { const t = start; start = end; end = t; }

            return { ...row, _start: start, _end: end };
        });
    }, [tasks]);

    // --- Drag & Pan Handlers ---
    const dragState = useRef<{
        type: 'pan' | 'resize' | 'move';
        taskId?: string;
        edge?: 'left' | 'right';
        startX: number;
        scrollLeft?: number;
        initialStart?: Date;
        initialEnd?: Date;
    } | null>(null);

    const handlePanMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        // Only pan if clicking background
        if ((e.target as HTMLElement).closest('.task-item')) return;

        dragState.current = {
            type: 'pan',
            startX: e.clientX,
            scrollLeft: containerRef.current.scrollLeft
        };
        document.body.style.cursor = 'grabbing';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleTaskMouseDown = (e: React.MouseEvent, task: any, type: 'move' | 'resize', edge?: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();

        dragState.current = {
            type,
            taskId: task.id,
            edge,
            startX: e.clientX,
            initialStart: new Date(task._start),
            initialEnd: new Date(task._end)
        };

        document.body.style.cursor = type === 'resize' ? 'col-resize' : 'grabbing';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragState.current) return;

        if (dragState.current.type === 'pan' && containerRef.current) {
            const dx = e.clientX - dragState.current.startX;
            containerRef.current.scrollLeft = (dragState.current.scrollLeft || 0) - dx;
        } else if ((dragState.current.type === 'resize' || dragState.current.type === 'move') && dragState.current.taskId) {
            const dx = e.clientX - dragState.current.startX;
            const daysDelta = Math.round(dx / CELL_WIDTH);

            if (daysDelta === 0) return;

            const { initialStart, initialEnd, taskId, type, edge } = dragState.current;
            if (!initialStart || !initialEnd) return;

            let newStart = new Date(initialStart);
            let newEnd = new Date(initialEnd);

            if (type === 'move') {
                newStart = addDays(initialStart, daysDelta);
                newEnd = addDays(initialEnd, daysDelta);
            } else if (type === 'resize') {
                if (edge === 'left') {
                    newStart = addDays(initialStart, daysDelta);
                    // Prevent start > end
                    if (newStart > newEnd) newStart = new Date(newEnd);
                } else { // right
                    newEnd = addDays(initialEnd, daysDelta);
                    // Prevent end < start
                    if (newEnd < newStart) newEnd = new Date(newStart);
                }
            }

            const updates = {
                startDate: newStart.toISOString(),
                dueDate: newEnd.toISOString(),
                date: newStart.toISOString()
            };

            onUpdateTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
        }
    };

    const handleMouseUp = () => {
        dragState.current = null;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    const getPosition = (date: Date) => {
        const diffTime = date.getTime() - timelineStart.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays * CELL_WIDTH;
    };

    // Scroll to "Today" on mount
    useEffect(() => {
        if (containerRef.current) {
            const today = new Date();
            const pos = getPosition(today);
            const containerWidth = containerRef.current.clientWidth;
            containerRef.current.scrollLeft = pos - (containerWidth / 2) + (CELL_WIDTH / 2);
        }
    }, [timelineStart]); // Run when range regenerates

    return (
        <div className="flex flex-col h-full bg-white dark:bg-monday-dark-surface text-gray-900 dark:text-gray-100 overflow-hidden font-sans relative">

            {/* Top Toolbar */}
            <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50 bg-white dark:bg-monday-dark-surface">
                {/* Left Controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setCurrentDate(new Date());
                        }}
                        className="text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors"
                    >
                        Today
                    </button>
                    <button className="flex items-center gap-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1.5 rounded-md transition-colors text-gray-600 dark:text-gray-300">
                        Days <ChevronDown size={14} />
                    </button>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500">
                        <Layout size={18} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500">
                        <Filter size={18} />
                    </button>
                    <div className="flex items-center bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full text-xs font-medium ml-1">
                        <CheckCircle2 size={12} className="mr-1" />
                        <span>M</span>
                    </div>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500">
                        <Search size={18} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500">
                        <Settings size={18} />
                    </button>
                    <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-md text-sm font-medium shadow-sm hover:opacity-90 flex items-center gap-2 ml-2">
                        <Plus size={16} /> Task
                        <ChevronDown size={14} className="opacity-50" />
                    </button>
                </div>
            </div>

            {/* Timeline Area (Full Screen) */}
            <div
                ref={containerRef}
                className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative pt-14 cursor-grab active:cursor-grabbing"
                onMouseDown={handlePanMouseDown}
            >
                <div className="h-full flex flex-col relative" style={{ width: days.length * CELL_WIDTH }}>

                    {/* Header Row (Months & Days) */}
                    <div className="flex flex-col h-[70px] border-b border-gray-100 dark:border-gray-800 absolute top-0 left-0 right-0 bg-white dark:bg-monday-dark-surface z-20 pointer-events-none">
                        {/* Month Row */}
                        <div className="flex-1 relative">
                            {days.map((d, i) => {
                                // Show month label on the first day of the month visible or every ~15 days if we want repetition
                                const isFirstOfMonth = d.getDate() === 1;
                                const isStartOfView = i === 0;
                                if (isFirstOfMonth || isStartOfView) {
                                    return (
                                        <div key={`month-${i}`} className="absolute top-2 text-lg font-semibold text-gray-800 dark:text-gray-100" style={{ left: i * CELL_WIDTH + 10 }}>
                                            {d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </div>
                                    )
                                }
                                return null;
                            })}
                        </div>

                        {/* Days Row */}
                        <div className="h-8 flex border-t border-transparent">
                            {days.map((d, i) => (
                                <div
                                    key={`day-header-${i}`}
                                    className="flex-shrink-0 flex items-center justify-center text-xs text-gray-500"
                                    style={{ width: CELL_WIDTH }}
                                >
                                    <span className="mr-1">{d.getDate()}</span>
                                    {/* Only show initial if enough space or zoom? pure number looks cleaner as per image reference often */}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grid Body */}
                    <div className="flex-1 relative mt-[70px]">
                        {/* Vertical Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none z-0">
                            {days.map((d, i) => {
                                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                const isToday = d.toDateString() === new Date().toDateString();
                                return (
                                    <div
                                        key={`grid-${i}`}
                                        className={`h-full border-r border-gray-50 dark:border-gray-800/40 relative box-border`}
                                        style={{
                                            width: CELL_WIDTH,
                                            // Diagonal stripes for weekends
                                            backgroundImage: isWeekend
                                                ? `repeating-linear-gradient(45deg, #f9fafb 0, #f9fafb 5px, transparent 5px, transparent 10px)`
                                                : 'none'
                                        }}
                                    >
                                        {/* Today Line */}
                                        {isToday && (
                                            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-red-500 z-10 flex flex-col items-center">
                                                <div className="w-[7px] h-[7px] bg-red-500 rounded-full -mt-[3px]" />
                                                <div className="mt-1 bg-red-500 text-white text-[9px] px-1 rounded-sm font-bold">15</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Tasks Layer (Floating) */}
                        <div className="absolute inset-0 pt-4 z-10">
                            {processedTasks.map((task, idx) => {
                                const left = getPosition(task._start);
                                const right = getPosition(addDays(task._end, 1)); // inclusive end
                                const width = Math.max(right - left - 4, 10);
                                const top = idx * 40 + 10; // Simple vertical stacking for now

                                return (
                                    <div
                                        key={task.id}
                                        className="absolute h-8 rounded-lg shadow-sm border border-black/5 flex items-center px-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer task-item group"
                                        style={{ left, width, top }}
                                        onMouseDown={(e) => handleTaskMouseDown(e, task, 'move')}
                                    >
                                        {/* Resize Handle Left */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/10 z-20 rounded-l-lg"
                                            onMouseDown={(e) => handleTaskMouseDown(e, task, 'resize', 'left')}
                                        ></div>

                                        <div className={`w-2 h-2 rounded-full mr-2 ml-1 flex-shrink-0 ${task.status === 'Done' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                        <span className="text-xs font-medium truncate text-gray-700 dark:text-gray-200 select-none">{task.name}</span>

                                        {/* Hover Details */}
                                        <div className="absolute left-full ml-2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                            {new Date(task._start).toLocaleDateString()} - {new Date(task._end).toLocaleDateString()}
                                        </div>

                                        {/* Resize Handle Right */}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/10 z-20 rounded-r-lg"
                                            onMouseDown={(e) => handleTaskMouseDown(e, task, 'resize', 'right')}
                                        ></div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Overlay Controls */}
            <div className="absolute bottom-5 left-5 z-50">
                <button className="flex items-center gap-2 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors text-gray-700 dark:text-gray-200">
                    <span className="w-3 h-4 border border-gray-300 rounded-sm"></span>
                    Draft
                </button>
            </div>

            {/* Zoom Controls (Floating Top Right) */}
            <div className="absolute right-5 top-20 flex flex-col gap-1 z-50 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-1">
                <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                    <Plus size={16} />
                </button>
                <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                    <div className="w-4 h-[2px] bg-current my-2 mx-auto" />
                </button>
            </div>

        </div>
    );
};
