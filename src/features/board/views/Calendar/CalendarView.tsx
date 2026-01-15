import React, { useMemo, useState, useRef } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    ChevronDown,
    X,
    Calendar as CalendarIcon
} from 'lucide-react';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragEndEvent,
    useDraggable,
    useDroppable
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ITask, Status, PEOPLE, IBoard, STATUS_COLORS } from '../../types/boardTypes';
import { useRoomBoardData } from '../../hooks/useRoomBoardData';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import { CalendarEventModal } from './components/CalendarEventModal';
import { motion } from 'framer-motion';
import { User, UserCheck } from 'lucide-react';

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

// --- DND Components ---

const DraggableTask: React.FC<{ task: ITask; onClick: (e: React.MouseEvent) => void }> = ({ task, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none' as const
    };

    // New "Dot + Text" style
    // Use STATUS_COLORS for dynamic coloring
    const dotColor = STATUS_COLORS[task.status] || '#c4c4c4';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className="group flex items-center gap-2 px-2 py-1 bg-white dark:bg-[#252830] border border-gray-100 dark:border-gray-800 rounded shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing select-none mb-1 overflow-hidden"
        >
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
            <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate leading-tight">
                {task.name}
            </span>
        </div>
    );
};

interface DroppableDayProps {
    date: Date;
    dateKey: string;
    tasks: { task: ITask, groupId: string }[];
    isToday: boolean;
    isCurrentMonth: boolean;
    onClick: () => void;
    onTaskClick: (task: ITask, groupId: string) => void;
    isMonthView: boolean;
}

const DroppableDay: React.FC<DroppableDayProps> = ({ date, dateKey, tasks, isToday, isCurrentMonth, onClick, onTaskClick, isMonthView }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: dateKey,
        data: { dateKey, date }
    });

    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const moreTriggerRef = useRef<HTMLButtonElement>(null);

    const MAX_VISIBLE = isMonthView ? 3 : 9999;

    let visibleTasks = tasks;
    let hiddenCount = 0;

    if (tasks.length > MAX_VISIBLE) {
        visibleTasks = tasks.slice(0, MAX_VISIBLE - 1);
        hiddenCount = tasks.length - (MAX_VISIBLE - 1);
    }

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`
                relative flex flex-col transition-all cursor-pointer h-full min-h-[120px]
                border-b border-r border-gray-100 dark:border-gray-800
                bg-white dark:bg-[#1a1d24]
                ${isOver ? 'ring-inset ring-2 ring-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}
                ${isToday ? 'ring-inset ring-1 ring-black dark:ring-white z-10' : ''}
                group
            `}
        >
            <div className="flex-1 px-1.5 pt-2 pb-8 overflow-y-auto space-y-0.5 no-scrollbar">
                {visibleTasks.map(({ task, groupId }) => (
                    <DraggableTask
                        key={task.id}
                        task={task}
                        onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task, groupId);
                        }}
                    />
                ))}

                {hiddenCount > 0 && (
                    <>
                        <button
                            ref={moreTriggerRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMoreOpen(true);
                            }}
                            className="w-full text-left text-[10px] font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 px-1 py-0.5 rounded transition-colors"
                        >
                            + {hiddenCount} more
                        </button>

                        {isMoreOpen && (
                            <PortalPopup
                                triggerRef={moreTriggerRef}
                                onClose={() => setIsMoreOpen(false)}
                                align="start"
                                side="bottom"
                            >
                                <div className="w-64 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 flex flex-col gap-2 max-h-80 overflow-y-auto z-50">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                            {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsMoreOpen(false); }}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {tasks.map(({ task, groupId }) => (
                                            <DraggableTask
                                                key={`popup-${task.id}`}
                                                task={task}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTaskClick(task, groupId);
                                                    setIsMoreOpen(false);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </PortalPopup>
                        )}
                    </>
                )}
            </div>

            <div className={`
                absolute bottom-2 right-3 text-xs font-normal
                ${isToday ? 'text-black dark:text-white font-medium' : isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : 'text-gray-200 dark:text-gray-700'}
            `}>
                {date.getDate()}
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

    // If we are receiving properties from a parent (BoardView), we use a dummy key for the hook
    // to prevent it from overwriting the shared localStorage with potentially stale state.
    // If we are standalone, we use the roomId/storageKey to load data.
    const effectiveKey = propBoard
        ? `shadow-${roomId || 'calendar'}`
        : (storageKey || roomId || 'demo-board');

    const { board: hookBoard, addTask: hookAddTask, updateTask: hookUpdateTask } = useRoomBoardData(effectiveKey);

    const board = propBoard || hookBoard;
    const addTask = onAddTask || hookAddTask;
    const updateTask = onUpdateTask || hookUpdateTask;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState<CalendarViewMode>('monthly');

    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
    const viewMenuRef = useRef<HTMLDivElement>(null);
    useClickOutside(viewMenuRef, () => setIsViewMenuOpen(false));

    // Filter States
    const [isFilterActive, setIsFilterActive] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [isClosedFilterActive, setIsClosedFilterActive] = useState(false);
    const [isAssignedToMeActive, setIsAssignedToMeActive] = useState(false);
    const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
    const peopleMenuRef = useRef<HTMLDivElement>(null);
    useClickOutside(peopleMenuRef, () => setIsAssigneeMenuOpen(false));

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState(new Date());
    const [editingTask, setEditingTask] = useState<{ task: ITask, groupId: string } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const isScheduleView = calendarView === '5days' || calendarView === 'weekly' || calendarView === 'daily';

    const prev = () => {
        if (calendarView === 'daily') setCurrentDate(addDays(currentDate, -1));
        else if (calendarView === '5days' || calendarView === 'weekly') setCurrentDate(addDays(currentDate, -7));
        else if (calendarView === 'yearly') setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
        else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const next = () => {
        if (calendarView === 'daily') setCurrentDate(addDays(currentDate, 1));
        else if (calendarView === '5days') setCurrentDate(addDays(currentDate, 5));
        else if (calendarView === 'weekly') setCurrentDate(addDays(currentDate, 7));
        else if (calendarView === 'yearly') setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
        else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => setCurrentDate(new Date());

    const tasksByDate = useMemo(() => {
        const map: Record<string, { task: ITask, groupId: string }[]> = {};
        if (board && board.groups) {
            board.groups.forEach(group => {
                group.tasks.forEach(task => {
                    const dateStr = task.dueDate || task.date;
                    if (!dateStr) return;

                    // Filters
                    if (isClosedFilterActive) {
                        // If closed filter is ON, show ONLY Done tasks
                        if (task.status !== Status.Done) return;
                    }
                    if (filterText) {
                        if (!task.name.toLowerCase().includes(filterText.toLowerCase())) return;
                    }

                    // Assignment Filter Logic
                    if (isAssignedToMeActive) {
                        if (task.personId !== '1') return;
                    } else if (selectedAssigneeId) {
                        if (task.personId !== selectedAssigneeId) return;
                    }

                    const dateObj = new Date(dateStr);
                    const key = formatKey(dateObj);
                    if (!map[key]) map[key] = [];
                    map[key].push({ task, groupId: group.id });
                });
            });
        }
        return map;
    }, [board, isClosedFilterActive, filterText, isAssignedToMeActive, selectedAssigneeId]);

    const monthGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startOffset = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const cells: { date: Date, isCurrentMonth: boolean }[] = [];

        // Previous month filler
        for (let i = startOffset - 1; i >= 0; i--) {
            cells.push({ date: new Date(year, month, -i), isCurrentMonth: false });
        }
        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
        }
        // Next month filler
        const remaining = 42 - cells.length; // 6 rows * 7 cols
        for (let i = 1; i <= remaining; i++) {
            cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return cells;
    }, [currentDate]);

    const weekDays = useMemo(() => {
        if (calendarView === 'daily') return [currentDate];
        const start = startOfWeek(currentDate);
        return Array.from({ length: calendarView === '5days' ? 5 : 7 }, (_, i) => addDays(start, i));
    }, [currentDate, calendarView]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const newDateKey = over.id as string;
        const [y, m, d] = newDateKey.split('-').map(Number);
        const newDate = new Date(y, m - 1, d); // Construct date safely

        // Find the task's group
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
            updateTask(groupId, taskId, {
                dueDate: dateStr,
                date: dateStr // Sync both fields for compatibility
            });
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
        // Sync date field if dueDate is present
        const finalUpdates = { ...updates };
        if (finalUpdates.dueDate) {
            finalUpdates.date = finalUpdates.dueDate;
        }

        if (editingTask) {
            updateTask(editingTask.groupId, editingTask.task.id, finalUpdates);
        } else {
            // New task - add to first group or a default "Inbox" group if distinct
            const targetGroupId = board.groups[0]?.id;
            if (targetGroupId) {
                addTask(targetGroupId, finalUpdates.name || 'New Event', {
                    ...finalUpdates,
                    dueDate: finalUpdates.dueDate // Ensure date is passed
                });
            }
        }
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1a1d24]">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* --- Header Section --- */}
                <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    {/* Top Row: Title, Nav, Actions */}
                    <div className="flex items-center justify-start gap-4 pl-[24px] pr-[20px] py-3">
                        <div className="flex items-center gap-3">
                            {/* Today Button */}
                            <button
                                onClick={goToToday}
                                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Today
                            </button>

                            {/* Month Dropdown Stub (Visual) */}
                            {/* Month Dropdown / View Switcher */}
                            <div className="relative" ref={viewMenuRef}>
                                <button
                                    onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors"
                                >
                                    <span>
                                        {calendarView === 'daily' ? 'Day' :
                                            calendarView === '5days' ? '4 Days' :
                                                calendarView === 'weekly' ? 'Week' :
                                                    'Month'}
                                    </span>
                                    <ChevronDown size={12} className="text-gray-400" />
                                </button>

                                {isViewMenuOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                                        {[
                                            { label: 'Day', value: 'daily' },
                                            { label: '4 Days', value: '5days' },
                                            { label: 'Week', value: 'weekly' },
                                            { label: 'Month', value: 'monthly' },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setCalendarView(option.value as CalendarViewMode);
                                                    setIsViewMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                                                    ${calendarView === option.value ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
                                                `}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

                            {/* Navigation & Title */}
                            {/* Navigation & Title */}
                            <div className="flex items-center gap-1">
                                <button onClick={prev} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"><ChevronLeft size={16} /></button>
                                <button onClick={next} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"><ChevronRight size={16} /></button>
                                <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-2">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h1>
                            </div>


                            <div className="flex items-center gap-2">
                                {/* Filter Button & Input */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const newState = !isFilterActive;
                                            setIsFilterActive(newState);
                                            if (!newState) setFilterText('');
                                        }}
                                        className={`flex items-center gap-1 px-2 py-0.5 border rounded-full text-[11px] font-medium transition-colors
                                        ${isFilterActive ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                    `}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                        Filter
                                    </button>
                                    {isFilterActive && (
                                        <motion.input
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 120 }}
                                            type="text"
                                            placeholder="Search..."
                                            value={filterText}
                                            onChange={(e) => setFilterText(e.target.value)}
                                            className="text-xs px-2 py-1 bg-gray-50 dark:bg-[#252830] border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsClosedFilterActive(!isClosedFilterActive)}
                                    className={`flex items-center gap-1 px-2 py-0.5 border rounded-full text-[11px] font-medium transition-colors
                                    ${isClosedFilterActive ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                `}
                                >
                                    Closed
                                </button>

                                <button
                                    onClick={() => {
                                        const newState = !isAssignedToMeActive;
                                        setIsAssignedToMeActive(newState);
                                        if (newState) setSelectedAssigneeId(null); // Clear specific person if "Me" is active
                                    }}
                                    className={`flex items-center gap-1 px-2 py-0.5 border rounded-full text-[11px] font-medium transition-colors
                                    ${isAssignedToMeActive ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                `}
                                >
                                    <UserCheck size={10} />
                                    Assigned to me
                                </button>

                                {/* People Filter */}
                                <div className="relative" ref={peopleMenuRef}>
                                    <button
                                        onClick={() => setIsAssigneeMenuOpen(!isAssigneeMenuOpen)}
                                        className={`flex items-center gap-1 px-2 py-0.5 border rounded-full text-[11px] font-medium transition-colors
                                        ${selectedAssigneeId ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                    `}
                                    >
                                        <User size={10} />
                                        People
                                    </button>
                                    {isAssigneeMenuOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-800">
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">All Users</span>
                                                {selectedAssigneeId && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAssigneeId(null);
                                                            setIsAssigneeMenuOpen(false);
                                                        }}
                                                        className="text-[10px] text-red-500 hover:text-red-700 font-medium bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                            {PEOPLE.map(person => (
                                                <button
                                                    key={person.id}
                                                    onClick={() => {
                                                        setSelectedAssigneeId(person.id);
                                                        setIsAssignedToMeActive(false); // Clear "Assigned to me" when picking a person
                                                        setIsAssigneeMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2
                                                    ${selectedAssigneeId === person.id ? 'font-semibold text-blue-600' : 'text-gray-700 dark:text-gray-300'}
                                                `}
                                                >
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: person.color }} />
                                                    {person.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setModalDate(new Date());
                                setEditingTask(null);
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 ml-auto hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-xs font-medium"
                        >
                            <Plus size={14} />
                            <span>Add Task</span>
                        </button>
                    </div>

                    {/* Right: Search, Customization, Add Task */}






                </div>

                {/* --- Grid Section --- */}
                {/* Weekday Header */}
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1d24]">
                    {(!isScheduleView ? WEEKDAY_LABELS : weekDays.map(d => d.toLocaleDateString('default', { weekday: 'short' }))).map((day, i) => (
                        <div key={i} className="px-2 py-2 text-[11px] font-semibold text-gray-500 dark:text-gray-500 uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid Container */}
                <div className="flex-1 overflow-hidden relative bg-white dark:bg-[#151820]">
                    <motion.div
                        key={calendarView + currentDate.toISOString()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`
                            h-full bg-white dark:bg-[#1a1d24]
                            grid
                            ${isScheduleView
                                ? `grid-cols-${calendarView === '5days' ? '5' : '7'}`
                                : 'grid-cols-7 grid-rows-6'
                            }
                            sm:border-l sm:border-t border-[#E5E7EB] dark:border-gray-800
                        `}
                    >
                        {isScheduleView ? (
                            weekDays.map((day) => {
                                const key = formatKey(day);
                                const dayTasks = tasksByDate[key] || [];
                                const isToday = key === formatKey(new Date());

                                return (
                                    <DroppableDay
                                        key={key}
                                        date={day}
                                        dateKey={key}
                                        tasks={dayTasks}
                                        isToday={isToday}
                                        isCurrentMonth={true}
                                        onClick={() => onDateClick(day)}
                                        onTaskClick={onTaskClick}
                                        isMonthView={false}
                                    />
                                );
                            })
                        ) : (
                            monthGrid.map((cell, idx) => {
                                const key = formatKey(cell.date);
                                const cellTasks = tasksByDate[key] || [];
                                const isToday = key === formatKey(new Date());

                                return (
                                    <DroppableDay
                                        key={idx}
                                        date={cell.date}
                                        dateKey={key}
                                        tasks={cellTasks}
                                        isToday={isToday}
                                        isCurrentMonth={cell.isCurrentMonth}
                                        onClick={() => onDateClick(cell.date)}
                                        onTaskClick={onTaskClick}
                                        isMonthView={true}
                                    />
                                );
                            })
                        )}
                    </motion.div>
                </div>

                <DragOverlay>
                    {/* Optional: Custom Drag Preview */}
                </DragOverlay>
            </DndContext >

            <CalendarEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                initialDate={modalDate}
                existingTask={editingTask?.task}
            />
        </div >
    );
};

export default CalendarView;
