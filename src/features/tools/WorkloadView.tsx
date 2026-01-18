import React, { useMemo, useState } from 'react';
import { CalendarBlank as CalendarClock, Gauge, Users } from 'phosphor-react';
import { isDoneStatus, loadBoardTasks, parseDate, SimplifiedTask } from './toolUtils';
import { useAppContext } from '../../contexts/AppContext';

interface WorkloadBucket {
    owner: string;
    scheduled: number;
    overdue: number;
    later: number;
    tasks: SimplifiedTask[];
}

const WorkloadView: React.FC<{ boardId: string; fallbackTasks?: any[] }> = ({ boardId, fallbackTasks = [] }) => {
    const { t } = useAppContext();
    const [range, setRange] = useState<'week' | 'month'>('week');
    const tasks = useMemo<SimplifiedTask[]>(() => loadBoardTasks(boardId, fallbackTasks), [boardId, fallbackTasks]);

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + (range === 'week' ? 7 : 30));
    const threshold = range === 'week' ? 8 : 20;

    const buckets = useMemo<WorkloadBucket[]>(() => {
        const map = new Map<string, WorkloadBucket>();

        tasks.forEach((task) => {
            const owner = task.owner || 'Unassigned';
            if (!map.has(owner)) {
                map.set(owner, { owner, scheduled: 0, overdue: 0, later: 0, tasks: [] });
            }
            const entry = map.get(owner)!;
            const due = parseDate(task.dueDate);
            if (isDoneStatus(task.status)) return;
            if (due && due < now) entry.overdue += 1;
            else if (due && due <= end) entry.scheduled += 1;
            else entry.later += 1;
            entry.tasks.push(task);
        });

        return Array.from(map.values()).sort((a, b) => b.scheduled + b.overdue - (a.scheduled + a.overdue));
    }, [tasks, end, now]);

    return (
        <div className="h-full w-full flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-xl shadow-sm">
                    <Users size={18} className="text-emerald-500" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{t('workload_view')}</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-monday-dark-text">{t('balance_capacity')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-xl p-1 shadow-sm">
                    {(['week', 'month'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => setRange(option)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                range === option ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-200' : 'text-gray-600 dark:text-monday-dark-text-secondary'
                            }`}
                        >
                            {option === 'week' ? t('this_week') : t('this_month')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {buckets.map((bucket) => {
                    const activeLoad = bucket.scheduled + bucket.overdue;
                    const loadRatio = Math.min(100, Math.round((activeLoad / threshold) * 100));
                    const overloaded = activeLoad > threshold;
                    const underload = activeLoad === 0;

                    return (
                        <div key={bucket.owner} className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-200 flex items-center justify-center font-semibold">
                                        {bucket.owner.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-monday-dark-text">{bucket.owner}</h4>
                                        <p className="text-xs text-gray-500">{activeLoad} {t('scheduled')} / {bucket.overdue} {t('overdue')}</p>
                                    </div>
                                </div>
                                <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${overloaded ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200' : underload ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-200' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200'}`}>
                                    {overloaded ? t('overloaded') : underload ? t('available') : t('healthy')}
                                </div>
                            </div>

                            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-monday-dark-hover overflow-hidden">
                                <div className={`h-full ${overloaded ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${loadRatio}%` }} />
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-monday-dark-text-secondary">
                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-monday-dark-bg border border-gray-100 dark:border-monday-dark-border text-center">
                                    <div className="font-bold text-gray-800 dark:text-monday-dark-text">{bucket.scheduled}</div>
                                    <div className="text-[11px] text-gray-500">{range === 'week' ? t('this_week') : t('this_month')}</div>
                                </div>
                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-monday-dark-bg border border-gray-100 dark:border-monday-dark-border text-center">
                                    <div className="font-bold text-amber-600">{bucket.overdue}</div>
                                    <div className="text-[11px] text-gray-500">{t('overdue')}</div>
                                </div>
                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-monday-dark-bg border border-gray-100 dark:border-monday-dark-border text-center">
                                    <div className="font-bold text-gray-800 dark:text-monday-dark-text">{bucket.later}</div>
                                    <div className="text-[11px] text-gray-500">{t('later')}</div>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 dark:text-monday-dark-text-muted flex items-center gap-2">
                                <CalendarClock size={14} /> {t('upcoming_items')}
                            </div>
                            <div className="space-y-1">
                                {bucket.tasks
                                    .filter((t) => {
                                        const due = parseDate(t.dueDate);
                                        return due && due <= end;
                                    })
                                    .slice(0, 4)
                                    .map((task) => {
                                        const due = parseDate(task.dueDate);
                                        const overdue = due ? due < now : false;
                                        return (
                                            <div key={task.id} className="flex items-center gap-2 text-xs text-gray-700 dark:text-monday-dark-text">
                                                <div className={`w-2 h-2 rounded-full ${overdue ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <span className="flex-1 truncate">{task.name}</span>
                                                <span className="text-gray-500">{due ? due.toLocaleDateString() : 'No date'}</span>
                                            </div>
                                        );
                                    })}
                                {bucket.tasks.filter((task) => {
                                    const due = parseDate(task.dueDate);
                                    return due && due <= end;
                                }).length === 0 && <div className="text-xs text-gray-500">{t('no_items_scheduled')}</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {buckets.length === 0 && <div className="text-sm text-gray-500">{t('no_workload_yet')}</div>}

            <div className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-monday-dark-border rounded-xl p-4 shadow-sm flex items-center gap-3 text-sm text-gray-600 dark:text-monday-dark-text-secondary">
                <Gauge size={18} className="text-emerald-500" />
                <span>{t('workload_indicator_help')}</span>
            </div>
        </div>
    );
};

export default WorkloadView;
