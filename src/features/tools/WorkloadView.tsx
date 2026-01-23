import React, { useMemo, useState } from 'react';
import { CaretDown, CaretRight, ChartBar, Clock, Lightning, Users, Warning, CheckCircle, Circle } from 'phosphor-react';
import { isDoneStatus, loadBoardTasks, parseDate, SimplifiedTask, RawTaskData } from './toolUtils';
import { useAppContext } from '../../contexts/AppContext';

interface WorkloadPerson {
    name: string;
    tasks: SimplifiedTask[];
    scheduledThisRange: number;
    overdue: number;
    dailyLoad: Record<string, number>;
    status: 'overloaded' | 'healthy' | 'available';
}

const CAPACITY_PER_DAY = 3;
const formatDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const WorkloadView: React.FC<{ boardId: string; fallbackTasks?: RawTaskData[] }> = ({ boardId, fallbackTasks = [] }) => {
    const { t } = useAppContext();
    const [range, setRange] = useState<'week' | 'month'>('week');
    const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());
    const tasks = useMemo<SimplifiedTask[]>(() => loadBoardTasks(boardId, fallbackTasks), [boardId, fallbackTasks]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayColumns = useMemo(() => {
        const numDays = range === 'week' ? 7 : 28;
        return Array.from({ length: numDays }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            return { date, isToday: i === 0, isWeekend: date.getDay() === 0 || date.getDay() === 6 };
        });
    }, [range]);

    const persons = useMemo<WorkloadPerson[]>(() => {
        const map = new Map<string, WorkloadPerson>();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + (range === 'week' ? 7 : 28));

        tasks.forEach((task) => {
            const owner = task.owner || 'Unassigned';
            if (!map.has(owner)) map.set(owner, { name: owner, tasks: [], scheduledThisRange: 0, overdue: 0, dailyLoad: {}, status: 'available' });

            const person = map.get(owner)!;
            person.tasks.push(task);
            if (isDoneStatus(task.status)) return;

            const due = parseDate(task.dueDate);
            if (!due) return;

            person.dailyLoad[formatDateKey(due)] = (person.dailyLoad[formatDateKey(due)] || 0) + 1;
            if (due < today) person.overdue++;
            if (due >= today && due <= endDate) person.scheduledThisRange++;
        });

        map.forEach((p) => {
            const load = p.scheduledThisRange + p.overdue;
            p.status = load > (range === 'week' ? 10 : 40) ? 'overloaded' : load === 0 ? 'available' : 'healthy';
        });

        return Array.from(map.values()).sort((a, b) => ({ overloaded: 0, healthy: 1, available: 2 }[a.status] - { overloaded: 0, healthy: 1, available: 2 }[b.status]));
    }, [tasks, range]);

    const stats = useMemo(() => ({
        total: persons.length,
        overloaded: persons.filter(p => p.status === 'overloaded').length,
        healthy: persons.filter(p => p.status === 'healthy').length,
        available: persons.filter(p => p.status === 'available').length,
        overdueTasks: tasks.filter(t => { const d = parseDate(t.dueDate); return d && d < today && !isDoneStatus(t.status); }).length
    }), [persons, tasks]);

    const togglePerson = (name: string) => setExpandedPersons(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
    const getLoadColor = (l: number) => l === 0 ? 'bg-stone-200 dark:bg-stone-700' : l <= CAPACITY_PER_DAY ? 'bg-emerald-500' : l <= CAPACITY_PER_DAY * 2 ? 'bg-amber-500' : 'bg-red-500';

    const StatusBadge = ({ status }: { status: WorkloadPerson['status'] }) => {
        const cfg = { overloaded: { I: Warning, l: 'Overloaded', c: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }, healthy: { I: CheckCircle, l: 'On Track', c: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' }, available: { I: Lightning, l: 'Available', c: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' } }[status];
        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${cfg.c}`}><cfg.I size={10} weight="fill" />{cfg.l}</span>;
    };

    if (!persons.length) return (
        <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
            <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center"><Users size={40} className="text-stone-400" /></div>
            <div className="text-center max-w-md">
                <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-2">No workload data yet</h3>
                <p className="text-sm text-stone-500">Assign team members and due dates to see workload distribution.</p>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white dark:bg-stone-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><ChartBar size={20} className="text-stone-600 dark:text-stone-400" /><h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">Workload</h1></div>
                    <div className="flex border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
                        {(['week', 'month'] as const).map(o => <button key={o} onClick={() => setRange(o)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${range === o ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>{o === 'week' ? 'This Week' : 'This Month'}</button>)}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" />{stats.overloaded} overloaded</span>
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" />{stats.healthy} on track</span>
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" />{stats.available} available</span>
                    {stats.overdueTasks > 0 && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-300"><Clock size={14} />{stats.overdueTasks} overdue</span>}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex border-b border-stone-200 dark:border-stone-700">
                    <div className="w-64 shrink-0 px-4 py-3 border-r border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-500 uppercase">Team ({stats.total})</div>
                    <div className="flex-1 flex overflow-x-auto">
                        {dayColumns.map((d, i) => <div key={i} className={`flex-1 min-w-[50px] py-2 text-center border-r border-stone-100 dark:border-stone-800 ${d.isToday ? 'bg-blue-50 dark:bg-blue-900/20' : d.isWeekend ? 'bg-stone-50 dark:bg-stone-800/50' : ''}`}><div className={`text-[10px] font-medium font-datetime ${d.isToday ? 'text-blue-600' : 'text-stone-400'}`}>{d.date.toLocaleDateString('en-US', { weekday: 'short' })}</div><div className={`text-sm font-semibold font-datetime ${d.isToday ? 'text-blue-600' : 'text-stone-700 dark:text-stone-300'}`}>{d.date.getDate()}</div></div>)}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {persons.map(p => {
                        const exp = expandedPersons.has(p.name);
                        const upcoming = p.tasks.filter(t => !isDoneStatus(t.status) && parseDate(t.dueDate)).sort((a, b) => (parseDate(a.dueDate)?.getTime() || 0) - (parseDate(b.dueDate)?.getTime() || 0));
                        return (
                            <div key={p.name} className="border-b border-stone-100 dark:border-stone-800">
                                <div className="flex hover:bg-stone-50 dark:hover:bg-stone-800/30">
                                    <div className="w-64 shrink-0 px-4 py-3 border-r border-stone-200 dark:border-stone-700 flex items-center gap-3">
                                        <button onClick={() => togglePerson(p.name)} className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded">{exp ? <CaretDown size={14} className="text-stone-500" /> : <CaretRight size={14} className="text-stone-500" />}</button>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-400 to-stone-600 flex items-center justify-center text-white text-xs font-semibold">{p.name.slice(0, 2).toUpperCase()}</div>
                                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{p.name}</span><StatusBadge status={p.status} /></div><div className="text-[11px] text-stone-500">{p.scheduledThisRange} tasks{p.overdue > 0 && <span className="text-amber-600"> · {p.overdue} overdue</span>}</div></div>
                                    </div>
                                    <div className="flex-1 flex overflow-x-auto">
                                        {dayColumns.map((d, i) => { const l = p.dailyLoad[formatDateKey(d.date)] || 0; return <div key={i} className={`flex-1 min-w-[50px] p-1.5 border-r border-stone-100 dark:border-stone-800 flex items-center justify-center ${d.isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : d.isWeekend ? 'bg-stone-50/50 dark:bg-stone-800/30' : ''}`}>{l > 0 ? <div className={`w-full h-6 rounded ${getLoadColor(l)} flex items-center justify-center`}><span className="text-[10px] font-semibold text-white">{l}</span></div> : <div className="w-full h-6 rounded bg-stone-100 dark:bg-stone-800 opacity-30" />}</div>; })}
                                    </div>
                                </div>
                                {exp && upcoming.length > 0 && <div className="bg-stone-50 dark:bg-stone-800/50 px-4 py-2 pl-20 space-y-1">{upcoming.slice(0, 6).map(t => { const d = parseDate(t.dueDate); return <div key={t.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white dark:hover:bg-stone-800"><Circle size={12} className={d && d < today ? 'text-amber-500' : 'text-stone-400'} weight="fill" /><span className="flex-1 text-sm text-stone-700 dark:text-stone-300 truncate">{t.name}</span><span className={`text-xs font-datetime ${d && d < today ? 'text-amber-600' : 'text-stone-400'}`}>{d?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>; })}{upcoming.length > 6 && <div className="text-xs text-stone-500 pl-3">+{upcoming.length - 6} more</div>}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-xs text-stone-500">
                <div className="flex items-center gap-4"><span className="font-medium">Daily load:</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" />1-3</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" />4-6</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" />7+</span></div>
            </div>
        </div>
    );
};

export default WorkloadView;
