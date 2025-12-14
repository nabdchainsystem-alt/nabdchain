import React, { useMemo, useState } from 'react';
import { Board, Task } from '../../types';
import {
    Calendar, CheckCircle2, ChevronDown, ChevronRight,
    Clock, AlertCircle, Circle, ArrowUpRight,
    Layout, Briefcase, Plus, TrendingUp,
    Filter, MoreHorizontal, CalendarDays
} from 'lucide-react';

interface MyWorkPageProps {
    boards: Board[];
    onNavigateToBoard: (view: 'board', boardId: string) => void;
}

type DateGroup = 'overdue' | 'today' | 'this_week' | 'later' | 'no_date';

interface GroupedTask extends Task {
    boardName: string;
    boardId: string;
    boardColor?: string; // Optional: if we had board colors
}

// --- Sub-components (Internal for now) ---

const StatCard = ({ label, count, icon: Icon, color, trend }: any) => (
    <div className="bg-white dark:bg-monday-dark-surface p-4 rounded-xl border border-gray-200/60 dark:border-monday-dark-border shadow-sm flex items-start justify-between group hover:shadow-md transition-all">
        <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{count}</h3>
                {trend && <span className="text-xs text-green-600 font-medium flex items-center gap-0.5"><TrendingUp size={10} /> {trend}</span>}
            </div>
        </div>
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
            <Icon size={20} className={color === 'bg-red-500' ? 'text-red-500' : color === 'bg-blue-500' ? 'text-blue-500' : color === 'bg-purple-500' ? 'text-purple-500' : 'text-gray-500'} />
        </div>
    </div>
);

const TaskCard = ({ task, onNavigate }: { task: GroupedTask, onNavigate: (id: string) => void }) => {
    const [isCompleted, setIsCompleted] = useState(task.status === 'Done');

    return (
        <div className="group relative bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-monday-blue/50 dark:hover:border-monday-blue/50 transition-all duration-200 flex items-center gap-4">

            {/* 1. Status Checkbox Custom */}
            <div
                className={`flex-shrink-0 w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all duration-200 ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-500 hover:border-monday-blue'}`}
                onClick={() => setIsCompleted(!isCompleted)}
            >
                {isCompleted && <CheckCircle2 size={14} className="text-white animate-in zoom-in duration-200" />}
            </div>

            {/* 2. Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className={`text-sm font-medium text-gray-800 dark:text-gray-100 truncate transition-all ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                    {task.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span
                        onClick={(e) => { e.stopPropagation(); onNavigate(task.boardId); }}
                        className="text-[10px] uppercase font-bold tracking-wide text-gray-500 dark:text-gray-400 hover:text-monday-blue cursor-pointer flex items-center gap-1"
                    >
                        <Briefcase size={10} />
                        {task.boardName}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{task.status}</span>
                </div>
            </div>

            {/* 3. Due Date Label */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 dark:bg-monday-dark-bg border border-gray-100 dark:border-monday-dark-border text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                <Calendar size={12} className="text-gray-400" />
                {task.date || 'No Date'}
            </div>

            {/* 4. Action Hover Trigger (Visual cue) */}
            <div className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-monday-dark-surface shadow-sm border border-gray-100 dark:border-monday-dark-border rounded p-1 transition-opacity">
                <ArrowUpRight size={16} className="text-gray-500 hover:text-monday-blue cursor-pointer" onClick={() => onNavigate(task.boardId)} />
            </div>
        </div>
    );
}

const EmptyDashboard = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative mb-6">
            <div className="w-20 h-20 bg-blue-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                <Layout size={40} className="text-monday-blue opacity-80" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center border-2 border-white dark:border-monday-dark-bg">
                <CheckCircle2 size={16} className="text-green-600" />
            </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">You're all caught up!</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
            No tasks are currently assigned to you. This is a great time to plan ahead or help your team.
        </p>
        <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-monday-blue hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2">
                <Plus size={16} /> Create Personal Task
            </button>
            <button className="px-5 py-2.5 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border hover:bg-gray-50 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-all">
                View All Boards
            </button>
        </div>
    </div>
);


export const MyWorkPage: React.FC<MyWorkPageProps> = ({ boards, onNavigateToBoard }) => {
    const [filter, setFilter] = useState<'all' | 'incomplete'>('all');

    // --- Logic ---
    const groupedTasks = useMemo(() => {
        const groups: Record<DateGroup, GroupedTask[]> = {
            overdue: [],
            today: [],
            this_week: [],
            later: [],
            no_date: []
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);

        let totalTasks = 0;

        boards.forEach(board => {
            board.tasks.forEach(task => {
                // Filter out done tasks if needed
                if (filter === 'incomplete' && task.status === 'Done') return;

                totalTasks++;
                const enhancedTask: GroupedTask = { ...task, boardName: board.name, boardId: board.id };

                if (!task.date) {
                    groups.no_date.push(enhancedTask);
                    return;
                }

                const taskDate = new Date(task.date);
                const taskDateOnly = new Date(taskDate);
                taskDateOnly.setHours(0, 0, 0, 0);

                if (taskDateOnly < today) {
                    groups.overdue.push(enhancedTask);
                } else if (taskDateOnly.getTime() === today.getTime()) {
                    groups.today.push(enhancedTask);
                } else if (taskDateOnly <= endOfWeek) {
                    groups.this_week.push(enhancedTask);
                } else {
                    groups.later.push(enhancedTask);
                }
            });
        });

        return { groups, totalTasks };
    }, [boards, filter]);

    const { groups, totalTasks } = groupedTasks;
    const isEmpty = totalTasks === 0;

    return (
        <div className="flex flex-col h-full w-full bg-[#F5F6F8] dark:bg-monday-dark-bg font-sans text-[#323338] dark:text-monday-dark-text animate-fade-in overflow-hidden">

            {/* 1. Header Section */}
            <div className="px-8 pt-8 pb-6 flex-shrink-0">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#323338] dark:text-white mb-1 tracking-tight">My Work</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Here is what's on your plate today.
                        </p>
                    </div>
                    <div className="flex items-center bg-white dark:bg-monday-dark-surface p-1 rounded-lg border border-gray-200 dark:border-monday-dark-border shadow-sm">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'all' ? 'bg-gray-100 dark:bg-monday-dark-bg text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-monday-dark-hover'}`}
                        >
                            All Tasks
                        </button>
                        <button
                            onClick={() => setFilter('incomplete')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'incomplete' ? 'bg-gray-100 dark:bg-monday-dark-bg text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-monday-dark-hover'}`}
                        >
                            Incomplete
                        </button>
                    </div>
                </div>

                {/* 2. Stats Grid (Integrated into Header area like Teams) */}
                {!isEmpty && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard
                            label="Due Today"
                            count={groups.today.length}
                            icon={CalendarDays}
                            color="bg-blue-500"
                            trend={groups.today.length > 0 ? "Focus here" : "Clear"}
                        />
                        <StatCard
                            label="Overdue"
                            count={groups.overdue.length}
                            icon={AlertCircle}
                            color="bg-red-500"
                            trend={groups.overdue.length > 0 ? "Needs Action" : "On Track"}
                        />
                        <StatCard
                            label="This Week"
                            count={groups.this_week.length}
                            icon={Clock}
                            color="bg-purple-500"
                        />
                    </div>
                )}
            </div>

            {/* 3. Main Content Area */}
            <div className="flex-1 px-8 pb-8 min-h-0 overflow-y-auto">
                {isEmpty ? (
                    <EmptyDashboard />
                ) : (
                    <div className="space-y-8 pb-20">
                        {/* CRITICAL: Overdue & Today */}
                        {(groups.overdue.length > 0 || groups.today.length > 0) && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500 delay-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Priority Focus</h2>
                                </div>
                                <div className="grid gap-3">
                                    {groups.overdue.map(task => <TaskCard key={task.id} task={task} onNavigate={(id) => onNavigateToBoard('board', id)} />)}
                                    {groups.today.map(task => <TaskCard key={task.id} task={task} onNavigate={(id) => onNavigateToBoard('board', id)} />)}
                                </div>
                            </div>
                        )}

                        {/* Upcoming */}
                        {groups.this_week.length > 0 && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500 delay-200">
                                <div className="flex items-center gap-2 mb-4 mt-8">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">This Week</h2>
                                </div>
                                <div className="grid gap-3 opacity-90">
                                    {groups.this_week.map(task => <TaskCard key={task.id} task={task} onNavigate={(id) => onNavigateToBoard('board', id)} />)}
                                </div>
                            </div>
                        )}

                        {/* Later / No Date */}
                        {(groups.later.length > 0 || groups.no_date.length > 0) && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500 delay-300">
                                <div className="flex items-center gap-2 mb-4 mt-8">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Backlog & Later</h2>
                                </div>
                                <div className="grid gap-3 opacity-75 grayscale-[0.2] hover:grayscale-0 transition-all">
                                    {groups.later.map(task => <TaskCard key={task.id} task={task} onNavigate={(id) => onNavigateToBoard('board', id)} />)}
                                    {groups.no_date.map(task => <TaskCard key={task.id} task={task} onNavigate={(id) => onNavigateToBoard('board', id)} />)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
