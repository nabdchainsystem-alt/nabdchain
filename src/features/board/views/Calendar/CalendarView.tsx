import React, { useMemo, useState, useRef } from 'react';
import {
    CaretLeft as ChevronLeft,
    CaretRight as ChevronRight,
    Plus,
    CaretDown as ChevronDown,
    X,
    CalendarBlank as CalendarIcon,
    Check
} from 'phosphor-react';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragEndEvent,
    useDraggable,
    useDroppable
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ITask, Status, PEOPLE, IBoard, STATUS_COLORS } from '../../types/boardTypes';
import { useRoomBoardData } from '../../hooks/useRoomBoardData';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import { CalendarEventModal } from './components/CalendarEventModal';

type CalendarViewMode = 'day' | '2days' | '3days' | 'workweek' | 'week' | 'month';

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1 PM to 12 AM (simplified)
const HOUR_LABELS = ['1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM', '12 AM'];

const pad = (n: number) => String(n).padStart(2, '0');
const formatKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const startOfWeek = (date: Date, mondayStart = false) => {
    const day = mondayStart ? (date.getDay() + 6) % 7 : date.getDay();
    return addDays(date, -day);
};
const isSameDay = (d1: Date, d2: Date) => formatKey(d1) === formatKey(d2);

// --- Mini Calendar Component ---
const MiniCalendar: React.FC<{
    currentDate: Date;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    onMonthChange: (date: Date) => void;
}> = ({ currentDate, selectedDate, onDateSelect, onMonthChange }) => {
    const [viewDate, setViewDate] = useState(currentDate);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length < 42) cells.push(null);

    const prevMonth = () => {
        const newDate = new Date(year, month - 1, 1);
        setViewDate(newDate);
    };

    const nextMonth = () => {
        const newDate = new Date(year, month + 1, 1);
        setViewDate(newDate);
    };

    return (
        <div className="w-full">
            {/* Mini Calendar Header */}
            <div className="flex items-center justify-between mb-2">
                <button onClick={prevMonth} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded">
                    <ChevronLeft size={14} className="text-stone-500" />
                </button>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {viewDate.toLocaleString('default', { year: 'numeric', month: 'long' })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded">
                    <ChevronRight size={14} className="text-stone-500" />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-1">
                {WEEKDAY_SHORT.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-medium text-stone-400 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((date, i) => {
                    if (!date) return <div key={i} className="w-6 h-6" />;

                    const isToday = isSameDay(date, today);
                    const isSelected = isSameDay(date, selectedDate);

                    return (
                        <button
                            key={i}
                            onClick={() => {
                                onDateSelect(date);
                                onMonthChange(date);
                            }}
                            className={`
                                w-6 h-6 text-[11px] rounded-full flex items-center justify-center transition-colors
                                ${isToday ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 font-semibold' : ''}
                                ${isSelected && !isToday ? 'ring-1 ring-stone-400' : ''}
                                ${!isToday && !isSelected ? 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400' : ''}
                            `}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// --- Draggable Task ---
const DraggableTask: React.FC<{ task: ITask; onClick: (e: React.MouseEvent) => void; compact?: boolean }> = ({ task, onClick, compact }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none' as const
    };

    const dotColor = STATUS_COLORS[task.status] || '#c4c4c4';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={`
                group flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-stone-800
                border border-stone-200 dark:border-stone-700 rounded
                hover:border-stone-400 transition-all cursor-grab active:cursor-grabbing select-none
                ${compact ? 'text-[10px]' : 'text-xs'}
            `}
        >
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
            <span className="font-medium text-stone-700 dark:text-stone-300 truncate">{task.name}</span>
        </div>
    );
};

// --- Droppable Day Cell (Month View) ---
const DroppableDayCell: React.FC<{
    date: Date;
    dateKey: string;
    tasks: { task: ITask; groupId: string }[];
    isToday: boolean;
    isCurrentMonth: boolean;
    onClick: () => void;
    onTaskClick: (task: ITask, groupId: string) => void;
}> = ({ date, dateKey, tasks, isToday, isCurrentMonth, onClick, onTaskClick }) => {
    const { setNodeRef, isOver } = useDroppable({ id: dateKey, data: { dateKey, date } });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`
                relative flex flex-col min-h-[100px] border-r border-b border-stone-200 dark:border-stone-700
                cursor-pointer transition-colors
                ${isOver ? 'bg-stone-100 dark:bg-stone-800' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'}
                ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
            `}
        >
            {/* Date Number */}
            <div className="p-1.5">
                <span className={`
                    inline-flex items-center justify-center w-6 h-6 text-xs rounded-sm
                    ${isToday ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 font-semibold' : ''}
                    ${!isToday && isCurrentMonth ? 'text-stone-700 dark:text-stone-300' : ''}
                    ${!isCurrentMonth ? 'text-stone-300 dark:text-stone-600' : ''}
                `}>
                    {date.getDate()}
                </span>
            </div>

            {/* Tasks */}
            <div className="flex-1 px-1 pb-1 space-y-0.5 overflow-hidden">
                {tasks.slice(0, 3).map(({ task, groupId }) => (
                    <DraggableTask
                        key={task.id}
                        task={task}
                        compact
                        onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task, groupId);
                        }}
                    />
                ))}
                {tasks.length > 3 && (
                    <div className="text-[10px] text-stone-500 px-1">+{tasks.length - 3} more</div>
                )}
            </div>
        </div>
    );
};

// --- Time Grid View (Day/Week) ---
const TimeGridView: React.FC<{
    days: Date[];
    tasksByDate: Record<string, { task: ITask; groupId: string }[]>;
    onDateClick: (date: Date) => void;
    onTaskClick: (task: ITask, groupId: string) => void;
}> = ({ days, tasksByDate, onDateClick, onTaskClick }) => {
    const today = new Date();

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Day Headers */}
            <div className="flex border-b border-stone-200 dark:border-stone-700 flex-shrink-0">
                {/* Time Column Spacer */}
                <div className="w-16 flex-shrink-0 border-r border-stone-200 dark:border-stone-700" />

                {/* Day Columns */}
                {days.map((day, i) => {
                    const isToday = isSameDay(day, today);
                    return (
                        <div
                            key={i}
                            className={`flex-1 p-3 text-center border-r border-stone-200 dark:border-stone-700 ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                            <div className={`text-2xl font-light ${isToday ? 'text-stone-900 dark:text-white' : 'text-stone-400'}`}>
                                {day.getDate()}
                            </div>
                            <div className={`text-xs ${isToday ? 'text-stone-700 dark:text-stone-300 font-medium' : 'text-stone-400'}`}>
                                {WEEKDAY_LABELS[day.getDay()]}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex">
                    {/* Time Labels Column */}
                    <div className="w-16 flex-shrink-0">
                        {HOUR_LABELS.map((label, i) => (
                            <div key={i} className="h-14 border-b border-stone-100 dark:border-stone-800 flex items-start justify-end pr-2 pt-0">
                                <span className="text-[11px] text-stone-400 -mt-2">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day Columns Grid */}
                    {days.map((day, dayIdx) => {
                        const dateKey = formatKey(day);
                        const dayTasks = tasksByDate[dateKey] || [];
                        const isToday = isSameDay(day, today);

                        return (
                            <div
                                key={dayIdx}
                                onClick={() => onDateClick(day)}
                                className={`flex-1 border-r border-stone-200 dark:border-stone-700 cursor-pointer relative ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                            >
                                {/* Hour Rows */}
                                {HOUR_LABELS.map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-14 border-b border-dashed border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/30"
                                    />
                                ))}

                                {/* Current Time Indicator */}
                                {isToday && (
                                    <div
                                        className="absolute left-0 right-0 border-t-2 border-blue-500 z-10"
                                        style={{
                                            top: `${((new Date().getHours() - 13) * 56) + (new Date().getMinutes() / 60 * 56)}px`
                                        }}
                                    >
                                        <div className="w-2 h-2 bg-blue-500 rounded-full -mt-1 -ml-1" />
                                    </div>
                                )}

                                {/* Tasks Overlay */}
                                <div className="absolute inset-0 p-1 pointer-events-none">
                                    <div className="space-y-1 pointer-events-auto">
                                        {dayTasks.map(({ task, groupId }) => (
                                            <DraggableTask
                                                key={task.id}
                                                task={task}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTaskClick(task, groupId);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
interface CalendarViewProps {
    roomId?: string;
    storageKey?: string;
    board?: IBoard;
    onUpdateTask?: (groupId: string, taskId: string, updates: Partial<ITask>) => void;
    onAddTask?: (groupId: string, name: string, defaults?: Partial<ITask>) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = (props) => {
    const { roomId, storageKey, board: propBoard, onUpdateTask, onAddTask } = props;

    const effectiveKey = propBoard
        ? `shadow-${roomId || 'calendar'}`
        : (storageKey || roomId || 'demo-board');

    const { board: hookBoard, addTask: hookAddTask, updateTask: hookUpdateTask } = useRoomBoardData(effectiveKey);

    const board = propBoard || hookBoard;
    const addTask = onAddTask || hookAddTask;
    const updateTask = onUpdateTask || hookUpdateTask;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState<CalendarViewMode>('month');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState(new Date());
    const [editingTask, setEditingTask] = useState<{ task: ITask; groupId: string } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const getDaysCount = () => {
        switch (calendarView) {
            case 'day': return 1;
            case '2days': return 2;
            case '3days': return 3;
            case 'workweek': return 5;
            case 'week': return 7;
            default: return 0;
        }
    };

    const isTimeView = calendarView !== 'month';

    const prev = () => {
        const days = getDaysCount();
        if (calendarView === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else if (calendarView === 'week' || calendarView === 'workweek') {
            setCurrentDate(addDays(currentDate, -7));
        } else {
            setCurrentDate(addDays(currentDate, -days));
        }
    };

    const next = () => {
        const days = getDaysCount();
        if (calendarView === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else if (calendarView === 'week' || calendarView === 'workweek') {
            setCurrentDate(addDays(currentDate, 7));
        } else {
            setCurrentDate(addDays(currentDate, days));
        }
    };

    const goToToday = () => setCurrentDate(new Date());

    const tasksByDate = useMemo(() => {
        const map: Record<string, { task: ITask; groupId: string }[]> = {};
        if (board && board.groups) {
            board.groups.forEach(group => {
                group.tasks.forEach(task => {
                    const dateStr = task.dueDate || task.date;
                    if (!dateStr) return;

                    const dateObj = new Date(dateStr);
                    const key = formatKey(dateObj);
                    if (!map[key]) map[key] = [];
                    map[key].push({ task, groupId: group.id });
                });
            });
        }
        return map;
    }, [board]);

    const monthGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startOffset = firstDay.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const cells: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month filler
        for (let i = startOffset - 1; i >= 0; i--) {
            cells.push({ date: new Date(year, month, -i), isCurrentMonth: false });
        }
        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
        }
        // Next month filler
        const remaining = 42 - cells.length;
        for (let i = 1; i <= remaining; i++) {
            cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return cells;
    }, [currentDate]);

    const viewDays = useMemo(() => {
        if (calendarView === 'month') return [];
        const count = getDaysCount();
        if (calendarView === 'week') {
            const start = startOfWeek(currentDate, false);
            return Array.from({ length: 7 }, (_, i) => addDays(start, i));
        }
        if (calendarView === 'workweek') {
            const start = startOfWeek(currentDate, true);
            return Array.from({ length: 5 }, (_, i) => addDays(start, i));
        }
        return Array.from({ length: count }, (_, i) => addDays(currentDate, i));
    }, [currentDate, calendarView]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const newDateKey = over.id as string;
        const [y, m, d] = newDateKey.split('-').map(Number);
        const newDate = new Date(y, m - 1, d);

        let groupId = '';
        let task: ITask | undefined;

        for (const g of board.groups) {
            const t = g.tasks.find(t => t.id === taskId);
            if (t) {
                groupId = g.id;
                task = t;
                break;
            }
        }

        if (groupId && task) {
            const dateStr = newDate.toISOString();
            updateTask(groupId, taskId, { dueDate: dateStr, date: dateStr });
        }
    };

    const onDateClick = (date: Date) => {
        setModalDate(date);
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const onTaskClick = (task: ITask, groupId: string) => {
        setEditingTask({ task, groupId });
        setModalDate(new Date(task.dueDate));
        setIsModalOpen(true);
    };

    const handleSaveTask = (updates: Partial<ITask>) => {
        const finalUpdates = { ...updates };
        if (finalUpdates.dueDate) {
            finalUpdates.date = finalUpdates.dueDate;
        }

        if (editingTask) {
            updateTask(editingTask.groupId, editingTask.task.id, finalUpdates);
        } else {
            const targetGroupId = board.groups[0]?.id;
            if (targetGroupId) {
                addTask(targetGroupId, finalUpdates.name || 'New Event', { ...finalUpdates, dueDate: finalUpdates.dueDate });
            }
        }
        setIsModalOpen(false);
    };

    const getHeaderTitle = () => {
        if (calendarView === 'month') {
            return currentDate.toLocaleString('default', { year: 'numeric', month: 'long' });
        }
        if (viewDays.length === 1) {
            return viewDays[0].toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        const first = viewDays[0];
        const last = viewDays[viewDays.length - 1];
        if (first.getMonth() === last.getMonth()) {
            return `${first.toLocaleString('default', { year: 'numeric', month: 'long' })} ${first.getDate()}-${last.getDate()}`;
        }
        return `${first.toLocaleString('default', { month: 'short', day: 'numeric' })} - ${last.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    const viewOptions: { label: string; value: CalendarViewMode }[] = [
        { label: 'Day', value: 'day' },
        { label: 'Work week', value: 'workweek' },
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
    ];

    return (
        <div className="flex h-full bg-white dark:bg-stone-900">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {/* Left Sidebar */}
                <div className={`${sidebarCollapsed ? 'w-0' : 'w-52'} flex-shrink-0 border-r border-stone-200 dark:border-stone-700 flex flex-col transition-all overflow-hidden`}>
                    <div className="p-4">
                        {/* New Event Button */}
                        <button
                            onClick={() => {
                                setModalDate(new Date());
                                setEditingTask(null);
                                setIsModalOpen(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded-md hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors text-sm font-medium"
                        >
                            <Plus size={16} />
                            New event
                        </button>
                    </div>

                    {/* Mini Calendar */}
                    <div className="px-4 pb-4">
                        <MiniCalendar
                            currentDate={currentDate}
                            selectedDate={currentDate}
                            onDateSelect={(date) => setCurrentDate(date)}
                            onMonthChange={(date) => setCurrentDate(date)}
                        />
                    </div>

                    <div className="border-t border-stone-200 dark:border-stone-700" />

                    {/* My Calendars */}
                    <div className="p-4 flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">My calendars</span>
                            <ChevronDown size={14} className="text-stone-400" />
                        </div>
                        <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                            <div className="w-3 h-3 rounded-sm bg-blue-500" />
                            <span className="text-sm text-stone-700 dark:text-stone-300">Calendar</span>
                            <Check size={14} className="text-stone-400 ml-auto" />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-4 px-4 py-3 border-b border-stone-200 dark:border-stone-700 flex-shrink-0">
                        {/* Today Button */}
                        <button
                            onClick={goToToday}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 dark:border-stone-600 rounded text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                        >
                            <CalendarIcon size={14} />
                            Today
                        </button>

                        {/* Navigation */}
                        <div className="flex items-center gap-1">
                            <button onClick={prev} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500 transition-colors">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={next} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500 transition-colors">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Title */}
                        <h1 className="text-lg font-medium text-stone-900 dark:text-white">
                            {getHeaderTitle()}
                        </h1>

                        {/* View Switcher */}
                        <div className="flex items-center gap-1 ml-auto border border-stone-200 dark:border-stone-700 rounded-md p-0.5">
                            {viewOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setCalendarView(opt.value)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors
                                        ${calendarView === opt.value
                                            ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    {isTimeView ? (
                        <TimeGridView
                            days={viewDays}
                            tasksByDate={tasksByDate}
                            onDateClick={onDateClick}
                            onTaskClick={onTaskClick}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 border-b border-stone-200 dark:border-stone-700 flex-shrink-0">
                                {WEEKDAY_LABELS.map((day, i) => (
                                    <div key={i} className="px-2 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 border-r border-stone-200 dark:border-stone-700 last:border-r-0">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Month Grid */}
                            <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
                                {monthGrid.map((cell, idx) => {
                                    const key = formatKey(cell.date);
                                    const cellTasks = tasksByDate[key] || [];
                                    const isToday = key === formatKey(new Date());

                                    return (
                                        <DroppableDayCell
                                            key={idx}
                                            date={cell.date}
                                            dateKey={key}
                                            tasks={cellTasks}
                                            isToday={isToday}
                                            isCurrentMonth={cell.isCurrentMonth}
                                            onClick={() => onDateClick(cell.date)}
                                            onTaskClick={onTaskClick}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <DragOverlay />
            </DndContext>

            <CalendarEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                initialDate={modalDate}
                existingTask={editingTask?.task}
            />
        </div>
    );
};

export default CalendarView;
