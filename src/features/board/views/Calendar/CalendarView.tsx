import React, { useMemo, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Plus as PlusIcon
} from 'lucide-react';
import { ITask, Status } from '../../types/boardTypes';
import { useRoomBoardData } from '../../hooks/useRoomBoardData';

type CalendarViewMode = 'daily' | '5days' | 'weekly' | 'monthly' | 'yearly';

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const pad = (n: number) => String(n).padStart(2, '0');
const formatKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const startOfWeek = (date: Date) => {
    const day = (date.getDay() + 6) % 7; // Monday start
    return addDays(date, -day);
};

interface CalendarViewProps {
    roomId?: string;
    storageKey?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ roomId, storageKey }) => {
    const effectiveKey = storageKey || (roomId ? `board-${roomId}` : 'demo-board');
    const { board } = useRoomBoardData(effectiveKey);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState<CalendarViewMode>('monthly');

    const isScheduleView = calendarView === '5days' || calendarView === 'weekly';

    const prev = () => {
        if (calendarView === 'daily') setCurrentDate(addDays(currentDate, -1));
        else if (calendarView === '5days' || calendarView === 'weekly') setCurrentDate(addDays(currentDate, -7));
        else if (calendarView === 'yearly') setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
        else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const next = () => {
        if (calendarView === 'daily') setCurrentDate(addDays(currentDate, 1));
        else if (calendarView === '5days' || calendarView === 'weekly') setCurrentDate(addDays(currentDate, 7));
        else if (calendarView === 'yearly') setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
        else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => setCurrentDate(new Date());

    const tasksByDate = useMemo(() => {
        const map: Record<string, ITask[]> = {};
        board.groups.forEach(group => {
            group.tasks.forEach(task => {
                if (!task.dueDate) return;
                const dateObj = new Date(task.dueDate);
                const key = formatKey(dateObj);
                if (!map[key]) map[key] = [];
                map[key].push(task);
            });
        });
        return map;
    }, [board]);

    const taskCountsByMonth = useMemo(() => {
        const counts: Record<string, number> = {};
        Object.keys(tasksByDate).forEach(key => {
            const [y, m] = key.split('-');
            if (!y || !m) return;
            const monthKey = `${y}-${m}`;
            counts[monthKey] = (counts[monthKey] || 0) + (tasksByDate[key]?.length || 0);
        });
        return counts;
    }, [tasksByDate]);

    const workWeekDays = useMemo(() => {
        const start = startOfWeek(currentDate);
        return Array.from({ length: 5 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    const fullWeekDays = useMemo(() => {
        const start = startOfWeek(currentDate);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    const scheduleTimeSlots = useMemo(
        () => ['All day', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'],
        []
    );

    const monthGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startOffset = (firstDay.getDay() + 6) % 7; // Monday start
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const cells: Array<Date | null> = Array(startOffset).fill(null);
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push(new Date(year, month, d));
        }
        while (cells.length % 7 !== 0) cells.push(null);
        const rows = Math.ceil(cells.length / 7);
        return { cells, rows };
    }, [currentDate]);

    const calendarViewOptions: { value: CalendarViewMode; label: string }[] = [
        { value: 'daily', label: 'Daily' },
        { value: '5days', label: '5 Days' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];

    const todayKey = formatKey(new Date());
    const focusedDateKey = formatKey(currentDate);
    const focusedTasks = tasksByDate[focusedDateKey] || [];

    const statusChip = (label: string, value: number, color: string) => (
        <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${color}`}>
            {label} {value}
        </span>
    );

    const renderTaskPill = (task: ITask) => {
        let color = 'bg-gray-100 text-gray-700 border border-gray-200';
        if (task.status === Status.Done) color = 'bg-green-50 text-green-700 border border-green-100';
        else if (task.status === Status.Working) color = 'bg-orange-50 text-orange-700 border border-orange-100';
        else if (task.status === Status.Stuck) color = 'bg-rose-50 text-rose-700 border border-rose-100';
        return (
            <span key={task.id} className={`px-2 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 ${color}`}>
                {task.name}
            </span>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1a1d24]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors">
                        <PlusIcon size={16} /> New Item
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <PlusIcon size={16} /> Add widget
                    </button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search"
                            className="pl-8 pr-3 py-1.5 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded-md text-sm outline-none transition-colors w-24 focus:w-48 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-1.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                        {calendarViewOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setCalendarView(option.value)}
                                className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${calendarView === option.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={goToToday} className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Today
                    </button>
                    <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden">
                        <button onClick={prev} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 border-r border-gray-300 dark:border-gray-700 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={next} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <span className="text-sm font-semibold w-40 text-center text-gray-800 dark:text-gray-200">
                        {calendarView === 'yearly'
                            ? currentDate.getFullYear()
                            : calendarView === 'daily'
                                ? currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                                : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                    </span>

                    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ml-2">
                        Month <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 overflow-hidden">
                {isScheduleView ? (
                    <div className="h-full flex flex-col border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#151820]">
                        <div
                            className="grid border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40 text-[11px] font-semibold text-gray-600 dark:text-gray-300"
                            style={{ gridTemplateColumns: `80px repeat(${calendarView === '5days' ? workWeekDays.length : fullWeekDays.length}, minmax(0, 1fr))` }}
                        >
                            <div className="px-3 py-2 uppercase tracking-wide text-left">All day</div>
                            {(calendarView === '5days' ? workWeekDays : fullWeekDays).map(day => {
                                const key = formatKey(day);
                                const tasks = tasksByDate[key] || [];
                                return (
                                    <div key={key} className="px-3 py-2 border-l border-gray-200 dark:border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                                                    {day.toLocaleDateString('default', { weekday: 'long' })}
                                                </span>
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    {day.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/30">
                                                    {tasks.length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {tasks.slice(0, 3).map(renderTaskPill)}
                                            {tasks.length > 3 && (
                                                <span className="text-[10px] text-gray-500">+{tasks.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: `80px repeat(${calendarView === '5days' ? workWeekDays.length : fullWeekDays.length}, minmax(0, 1fr))` }}>
                            <div className="border-r border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/30 text-[11px] text-gray-500 dark:text-gray-400">
                                {scheduleTimeSlots.map((slot, idx) => (
                                    <div key={slot} className={`h-full px-3 flex items-start ${idx === 0 ? 'pt-2 pb-1' : 'py-4'} border-b border-gray-200 dark:border-gray-800`}>
                                        {slot}
                                    </div>
                                ))}
                            </div>
                            {(calendarView === '5days' ? workWeekDays : fullWeekDays).map(day => {
                                const key = formatKey(day);
                                const tasks = tasksByDate[key] || [];
                                return (
                                    <div key={key} className="grid border-r border-gray-200 dark:border-gray-800" style={{ gridTemplateRows: `repeat(${scheduleTimeSlots.length}, minmax(0, 1fr))` }}>
                                        {scheduleTimeSlots.map((slot, idx) => (
                                            <div key={slot} className="relative border-b border-gray-200 dark:border-gray-800">
                                                {idx === 0 && tasks.length === 0 && (
                                                    <div className="absolute inset-x-2 top-2 text-[11px] text-gray-400 dark:text-gray-600">No entries</div>
                                                )}
                                                {idx === 0 && tasks.length > 0 && (
                                                    <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1">
                                                        {tasks.slice(0, 4).map(renderTaskPill)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <div
                            className="grid text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                            style={{ gridTemplateColumns: `repeat(${calendarView === 'yearly' ? 4 : 7}, minmax(0, 1fr))` }}
                        >
                            {calendarView === 'yearly'
                                ? ['Q1', 'Q2', 'Q3', 'Q4']
                                : WEEKDAY_LABELS.map(label => <div key={label} className="text-center py-1">{label}</div>)}
                        </div>

                        <div
                            className="grid text-sm mt-2 flex-1"
                            style={{
                                gridTemplateColumns: calendarView === 'yearly'
                                    ? 'repeat(4, minmax(0, 1fr))'
                                    : 'repeat(7, minmax(0, 1fr))',
                                gridTemplateRows: calendarView === 'yearly'
                                    ? 'repeat(3, minmax(0, 1fr))'
                                    : `repeat(${monthGrid.rows}, minmax(0, 1fr))`,
                                gap: calendarView === 'monthly' ? '0px' : '8px'
                            }}
                        >
                            {(calendarView === 'yearly'
                                ? Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1))
                                : monthGrid.cells
                            ).map((day, idx) => {
                                const dateObj = day as Date | null;
                                if (!dateObj) {
                                    return <div key={idx} className="h-full rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40"></div>;
                                }
                                const key = formatKey(dateObj);
                                const tasks = calendarView === 'yearly'
                                    ? taskCountsByMonth[`${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}`] || 0
                                    : (tasksByDate[key]?.length || 0);
                                const isToday = calendarView === 'yearly'
                                    ? (dateObj.getFullYear() === new Date().getFullYear() && dateObj.getMonth() === new Date().getMonth())
                                    : key === todayKey;
                                const dayLabel = calendarView === 'yearly'
                                    ? dateObj.toLocaleString('default', { month: 'short' })
                                    : dateObj.getDate();
                                const subLabel = calendarView === 'yearly'
                                    ? dateObj.getFullYear().toString()
                                    : dateObj.toLocaleString('default', { month: 'short' });
                                const isFocusedDay = calendarView === 'daily' && key === focusedDateKey;

                                return (
                                    <div
                                        key={key}
                                        className={`h-full ${calendarView === 'monthly' ? 'rounded-none' : 'rounded-lg'} border bg-white dark:bg-[#161922] flex flex-col p-2 transition-colors ${isToday
                                            ? 'border-blue-400 shadow-sm'
                                            : 'border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-500/40'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-200">
                                            <div className="flex items-baseline gap-1">
                                                <span>{dayLabel}</span>
                                                {subLabel && calendarView !== 'yearly' && (
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{subLabel}</span>
                                                )}
                                            </div>
                                            {tasks > 0 ? <span className="w-2 h-2 rounded-full bg-blue-500" /> : null}
                                        </div>
                                        <div className="mt-auto space-y-1">
                                            <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                                <span>Total</span>
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-300">{tasks}</span>
                                            </div>
                                        </div>
                                        {isFocusedDay && (
                                            <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2 space-y-2 text-[11px]">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {statusChip('Total', focusedTasks.length, 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700')}
                                                    {statusChip('Done', focusedTasks.filter(t => t.status === Status.Done).length, 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-200 dark:border-green-500/30')}
                                                    {statusChip('Working', focusedTasks.filter(t => t.status === Status.Working).length, 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-200 dark:border-orange-500/30')}
                                                    {statusChip('Stuck', focusedTasks.filter(t => t.status === Status.Stuck).length, 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/30')}
                                                </div>
                                                <div className="space-y-1 max-h-28 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                    {focusedTasks.length > 0 ? focusedTasks.slice(0, 4).map(task => (
                                                        <div key={task.id} className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1f222a] px-2 py-1">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">{task.name}</span>
                                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">{task.status}</span>
                                                            </div>
                                                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                                                                {task.dueDate ? task.dueDate.split('T')[0] : '—'}
                                                            </span>
                                                        </div>
                                                    )) : (
                                                        <div className="text-[11px] text-gray-500 dark:text-gray-400">No tasks</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

function ChevronDown({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

export default CalendarView;
