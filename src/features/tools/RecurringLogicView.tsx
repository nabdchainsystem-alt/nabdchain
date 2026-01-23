import React, { useEffect, useMemo, useState } from 'react';
import { CalendarBlank as CalendarClock, ClockCounterClockwise as History, Repeat, ArrowClockwise as RotateCw } from 'phosphor-react';
import { loadBoardTasks, RawTaskData } from './toolUtils';

type Frequency = 'weekly' | 'monthly' | 'custom';

interface RecurringRule {
    id: string;
    itemName: string;
    frequency: Frequency;
    intervalDays?: number;
    nextDate?: string;
    history: { id: string; occurredOn: string; note?: string }[];
}

const computeNextDate = (current: string | undefined, frequency: Frequency, intervalDays?: number) => {
    const base = current ? new Date(current) : new Date();
    if (frequency === 'weekly') base.setDate(base.getDate() + 7);
    else if (frequency === 'monthly') base.setMonth(base.getMonth() + 1);
    else base.setDate(base.getDate() + (intervalDays || 7));
    return base.toISOString().split('T')[0];
};

const RecurringLogicView: React.FC<{ boardId: string; fallbackTasks?: RawTaskData[] }> = ({ boardId, fallbackTasks = [] }) => {
    const storageKey = `recurring-logic-${boardId}`;
    const tasks = useMemo(() => loadBoardTasks(boardId, fallbackTasks), [boardId, fallbackTasks]);

    const [rules, setRules] = useState<RecurringRule[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch {
            // ignore
        }
        return [
            {
                id: 'rec-1',
                itemName: 'Weekly ops review',
                frequency: 'weekly',
                nextDate: computeNextDate(undefined, 'weekly'),
                history: []
            }
        ];
    });

    const [draft, setDraft] = useState<{ itemName: string; frequency: Frequency; intervalDays?: number }>({
        itemName: '',
        frequency: 'weekly',
        intervalDays: 7
    });

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(rules));
    }, [rules, storageKey]);

    const addRule = () => {
        if (!draft.itemName.trim()) return;
        const newRule: RecurringRule = {
            id: `rec-${Date.now()}`,
            itemName: draft.itemName,
            frequency: draft.frequency,
            intervalDays: draft.intervalDays,
            nextDate: computeNextDate(undefined, draft.frequency, draft.intervalDays),
            history: []
        };
        setRules((prev) => [newRule, ...prev]);
        setDraft({ itemName: '', frequency: 'weekly', intervalDays: 7 });
    };

    const generateNext = (rule: RecurringRule) => {
        const occurrenceDate = rule.nextDate || new Date().toISOString().split('T')[0];
        const nextDate = computeNextDate(rule.nextDate, rule.frequency, rule.intervalDays);

        setRules((prev) =>
            prev.map((r) =>
                r.id === rule.id
                    ? {
                          ...r,
                          nextDate,
                          history: [{ id: `hist-${Date.now()}`, occurredOn: occurrenceDate, note: 'Auto-created occurrence' }, ...r.history]
                      }
                    : r
            )
        );
    };

    return (
        <div className="h-full w-full flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-monday-dark-surface border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <Repeat size={18} className="text-slate-700" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Recurring logic</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Keep repeating work tidy and traceable.</span>
                    </div>
                </div>
            </div>

            {/* Builder */}
            <div className="bg-white dark:bg-monday-dark-surface border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <input
                        value={draft.itemName}
                        onChange={(e) => setDraft((d) => ({ ...d, itemName: e.target.value }))}
                        placeholder="Item name"
                        list={`recurring-tasks-${boardId}`}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-monday-dark-bg text-sm px-3 py-2 focus:outline-none md:col-span-2"
                    />
                    <datalist id={`recurring-tasks-${boardId}`}>
                        {tasks.slice(0, 15).map((task) => (
                            <option key={task.id} value={task.name} />
                        ))}
                    </datalist>
                    <select
                        value={draft.frequency}
                        onChange={(e) => setDraft((d) => ({ ...d, frequency: e.target.value as Frequency }))}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-monday-dark-bg text-sm px-3 py-2 focus:outline-none"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom (days)</option>
                    </select>
                    <input
                        type="number"
                        min={1}
                        value={draft.intervalDays ?? 7}
                        onChange={(e) => setDraft((d) => ({ ...d, intervalDays: Number(e.target.value) }))}
                        disabled={draft.frequency !== 'custom'}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-monday-dark-bg text-sm px-3 py-2 focus:outline-none disabled:bg-slate-100 disabled:dark:bg-monday-dark-surface"
                    />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Each recurrence keeps its own history. No forecasting or AI.</span>
                    <button
                        onClick={addRule}
                        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold shadow-sm hover:bg-slate-800"
                    >
                        Add recurring rule
                    </button>
                </div>
            </div>

            {/* Rules list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {rules.map((rule) => (
                    <div key={rule.id} className="bg-white dark:bg-monday-dark-surface border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold">{rule.frequency}</p>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{rule.itemName}</h3>
                                <p className="text-xs text-slate-500">Next: {rule.nextDate || 'Not scheduled'}</p>
                            </div>
                            <button
                                onClick={() => generateNext(rule)}
                                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-800"
                            >
                                Generate next
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <CalendarClock size={14} className="text-slate-600" />
                            <span>Interval: {rule.frequency === 'custom' ? `${rule.intervalDays} days` : rule.frequency}</span>
                            <span>•</span>
                            <span>History preserved per occurrence</span>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                                <History size={14} /> History
                            </div>
                            {rule.history.length === 0 && <p className="text-xs text-slate-500">No occurrences recorded yet.</p>}
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                                {rule.history.map((h) => (
                                    <div key={h.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="flex-1 truncate">{h.occurredOn}</span>
                                        {h.note && <span className="text-slate-500">{h.note}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {rules.length === 0 && <div className="text-sm text-slate-500">No recurring work yet. Add a rule to keep repeats consistent.</div>}

            <div className="bg-white dark:bg-monday-dark-surface border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <RotateCw size={18} className="text-slate-700" />
                <span>Recurring rules stay lightweight. Weekly, monthly, or custom intervals with preserved history per occurrence.</span>
            </div>
        </div>
    );
};

export default RecurringLogicView;
