import React, { useMemo, useState } from 'react';
import { Activity, Warning as AlertTriangle, ChartBar as BarChart3, SquaresFour as LayoutDashboard, ChartPie as PieChart, TrendUp as TrendingUp } from 'phosphor-react';
import { loadBoardTasks, isDoneStatus, parseDate, SimplifiedTask } from './toolUtils';
import { useAppContext } from '../../contexts/AppContext';

interface DashboardsViewProps {
    boardId: string;
    boardName?: string;
    fallbackTasks?: any[];
}

const WidgetCard = ({ title, value, subtitle, icon: Icon, color }: { title: string; value: string; subtitle: string; icon: any; color: string }) => (
    <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
            <Icon size={18} />
        </div>
        <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none">{value}</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{subtitle}</span>
        </div>
    </div>
);

const DashboardsView: React.FC<DashboardsViewProps> = ({ boardId, boardName = 'Board', fallbackTasks = [] }) => {
    const { t } = useAppContext();
    const [range, setRange] = useState<'week' | 'month' | 'quarter'>('week');
    const tasks = useMemo<SimplifiedTask[]>(() => loadBoardTasks(boardId, fallbackTasks), [boardId, fallbackTasks]);

    const now = new Date();
    const rangeEnds = useMemo(() => {
        const end = new Date(now);
        if (range === 'week') end.setDate(end.getDate() + 7);
        if (range === 'month') end.setDate(end.getDate() + 30);
        if (range === 'quarter') end.setDate(end.getDate() + 90);
        return end;
    }, [range, now]);

    const metrics = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter((t) => isDoneStatus(t.status)).length;
        const overdue = tasks.filter((t) => {
            const due = parseDate(t.dueDate);
            return due && due < now && !isDoneStatus(t.status);
        }).length;
        const upcoming = tasks.filter((t) => {
            const due = parseDate(t.dueDate);
            return due && due >= now && due <= rangeEnds;
        }).length;

        const completion = total ? Math.round((completed / total) * 100) : 0;
        const health = total ? Math.round(((total - overdue) / total) * 100) : 100;

        const statusBreakdown = tasks.reduce<Record<string, number>>((acc, task) => {
            const key = task.status || 'No status';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const priorities = tasks.reduce<Record<string, number>>((acc, task) => {
            const key = task.priority || 'Unspecified';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return { total, completed, overdue, upcoming, completion, health, statusBreakdown, priorities };
    }, [tasks, now, rangeEnds]);

    const topStatuses = Object.entries(metrics.statusBreakdown).slice(0, 5);

    return (
        <div className="h-full w-full flex flex-col gap-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                    <LayoutDashboard size={18} className="text-blue-500" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{t('dashboards')}</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{boardName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl p-1 shadow-sm">
                    {(['week', 'month', 'quarter'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => setRange(option)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                range === option ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {option === 'week' ? 'This week' : option === 'month' ? 'This month' : 'This quarter'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <WidgetCard title="Open items" value={String(metrics.total - metrics.completed)} subtitle="In progress or planned" icon={Activity} color="bg-blue-500 text-blue-600" />
                <WidgetCard title="Upcoming" value={String(metrics.upcoming)} subtitle={`Due within ${range}`} icon={BarChart3} color="bg-emerald-500 text-emerald-600" />
                <WidgetCard title="Overdue" value={String(metrics.overdue)} subtitle="Needs attention" icon={AlertTriangle} color="bg-amber-500 text-amber-600" />
                <WidgetCard title="Completion" value={`${metrics.completion}%`} subtitle={`${metrics.completed} of ${metrics.total} done`} icon={TrendingUp} color="bg-purple-500 text-purple-600" />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="col-span-2 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status distribution</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Fast overview across the team</p>
                        </div>
                        <PieChart size={18} className="text-gray-300" />
                    </div>
                    <div className="space-y-2">
                        {topStatuses.length === 0 && <p className="text-sm text-gray-500">No status data yet.</p>}
                        {topStatuses.map(([status, count]) => {
                            const ratio = metrics.total ? (count / metrics.total) * 100 : 0;
                            return (
                                <div key={status} className="flex items-center gap-3">
                                    <div className="w-24 text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">{status}</div>
                                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isDoneStatus(status) ? 'bg-emerald-400' : 'bg-blue-400'}`}
                                            style={{ width: `${ratio}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 w-8">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Readiness</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Health based on overdue risk</p>
                        </div>
                        <Activity size={18} className="text-gray-300" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-300">
                            {metrics.health}%
                        </div>
                        <div className="flex-1">
                            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-2">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${metrics.health}%` }} />
                            </div>
                            <p className="text-xs text-gray-500">Higher is better. Based on overdue vs total items.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Priorities and timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm col-span-2">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Timeline (read-only)</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Upcoming and overdue items within the selected range</p>
                        </div>
                        <BarChart3 size={18} className="text-gray-300" />
                    </div>
                    <div className="space-y-3">
                        {tasks
                            .filter((t) => parseDate(t.dueDate))
                            .sort((a, b) => {
                                const aDate = parseDate(a.dueDate)?.getTime() || 0;
                                const bDate = parseDate(b.dueDate)?.getTime() || 0;
                                return aDate - bDate;
                            })
                            .slice(0, 8)
                            .map((task) => {
                                const due = parseDate(task.dueDate);
                                const isOverdue = due ? due < now : false;
                                const withinRange = due ? due <= rangeEnds : false;

                                return (
                                    <div key={task.id} className="flex items-center gap-3 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-amber-500' : withinRange ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{task.name}</span>
                                                <span className="text-[11px] text-gray-500">{due ? due.toLocaleDateString() : 'No date'}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                                                <div
                                                    className={`h-full ${isOverdue ? 'bg-amber-400' : 'bg-blue-400'}`}
                                                    style={{ width: `${isOverdue ? 100 : 60}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        {tasks.length === 0 && <p className="text-sm text-gray-500">No items yet. Add tasks to see live dashboards.</p>}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Priority mix</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Based on existing tasks</p>
                        </div>
                        <AlertTriangle size={18} className="text-gray-300" />
                    </div>
                    <div className="space-y-2">
                        {Object.entries(metrics.priorities).length === 0 && <p className="text-sm text-gray-500">No priority data yet.</p>}
                        {Object.entries(metrics.priorities).map(([priority, count]) => {
                            const ratio = metrics.total ? (count / metrics.total) * 100 : 0;
                            return (
                                <div key={priority} className="flex items-center gap-3">
                                    <div className="w-24 text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">{priority}</div>
                                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${ratio}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-500 w-8">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardsView;
