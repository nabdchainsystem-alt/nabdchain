import React, { useEffect, useMemo, useState } from 'react';
import { Flag, LinkSimple as Link2, Target, User } from 'phosphor-react';
import { loadBoardTasks, SimplifiedTask, RawTaskData } from './toolUtils';
import { useAppContext } from '../../contexts/AppContext';

interface KeyResult {
    id: string;
    title: string;
    target: number;
    current: number;
    unit?: string;
    links: string[];
}

interface Objective {
    id: string;
    title: string;
    owner?: string;
    timeframe?: string;
    note?: string;
    keyResults: KeyResult[];
}

const GoalsOKRsView: React.FC<{ boardId: string; fallbackTasks?: RawTaskData[] }> = ({ boardId, fallbackTasks = [] }) => {
    const { t } = useAppContext();
    const storageKey = `goals-okrs-${boardId}`;
    const tasks = useMemo<SimplifiedTask[]>(() => loadBoardTasks(boardId, fallbackTasks), [boardId, fallbackTasks]);

    const [objectives, setObjectives] = useState<Objective[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch {
            // ignore
        }
        return [
            {
                id: 'obj-1',
                title: 'Stabilize delivery quality',
                owner: 'Ops',
                timeframe: 'Q3',
                keyResults: [
                    { id: 'kr-1', title: 'Reduce overdue items', target: 10, current: 4, unit: 'items', links: [] },
                    { id: 'kr-2', title: 'Improve completion rate', target: 90, current: 72, unit: '%', links: [] }
                ]
            }
        ];
    });

    const [draftObjective, setDraftObjective] = useState({ title: '', owner: '', timeframe: 'This quarter' });
    const [krDrafts, setKrDrafts] = useState<Record<string, { title: string; target: number; unit: string }>>({});

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(objectives));
    }, [objectives, storageKey]);

    const addObjective = () => {
        if (!draftObjective.title.trim()) return;
        const newObjective: Objective = {
            id: `obj-${Date.now()}`,
            title: draftObjective.title,
            owner: draftObjective.owner || 'Owner',
            timeframe: draftObjective.timeframe,
            keyResults: []
        };
        setObjectives((prev) => [newObjective, ...prev]);
        setDraftObjective({ title: '', owner: '', timeframe: 'This quarter' });
    };

    const addKeyResult = (objectiveId: string) => {
        const draft = krDrafts[objectiveId];
        if (!draft || !draft.title.trim()) return;
        const newKR: KeyResult = {
            id: `kr-${Date.now()}`,
            title: draft.title,
            target: Number(draft.target) || 1,
            current: 0,
            unit: draft.unit || '%',
            links: []
        };
        setObjectives((prev) =>
            prev.map((obj) => (obj.id === objectiveId ? { ...obj, keyResults: [...obj.keyResults, newKR] } : obj))
        );
        setKrDrafts((prev) => ({ ...prev, [objectiveId]: { title: '', target: 100, unit: draft.unit } }));
    };

    const linkTask = (objectiveId: string, krId: string, taskName: string) => {
        if (!taskName) return;
        setObjectives((prev) =>
            prev.map((obj) =>
                obj.id === objectiveId
                    ? {
                          ...obj,
                          keyResults: obj.keyResults.map((kr) =>
                              kr.id === krId && !kr.links.includes(taskName) ? { ...kr, links: [...kr.links, taskName] } : kr
                          )
                      }
                    : obj
            )
        );
    };

    const progressForKR = (kr: KeyResult) => {
        if (!kr.target) return 0;
        return Math.min(100, Math.round((kr.current / kr.target) * 100));
    };

    const progressForObjective = (objective: Objective) => {
        if (!objective.keyResults.length) return 0;
        const total = objective.keyResults.reduce((sum, kr) => sum + progressForKR(kr), 0);
        return Math.round(total / objective.keyResults.length);
    };

    return (
        <div className="h-full w-full flex flex-col gap-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-monday-dark-elevated text-slate-700 dark:text-monday-dark-text border border-slate-200 dark:border-monday-dark-border">
                        <Target size={18} />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">{t('goals_okrs')}</p>
                        <p className="text-sm text-slate-700 dark:text-monday-dark-text font-medium">{t('align_work_objectives')}</p>
                    </div>
                </div>
            </div>

            {/* Add objective */}
            <div className="bg-white dark:bg-monday-dark-surface border border-slate-200 dark:border-monday-dark-border rounded-xl p-4 shadow-sm flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                        value={draftObjective.title}
                        onChange={(e) => setDraftObjective((d) => ({ ...d, title: e.target.value }))}
                        placeholder={t('objective_title')}
                        className="rounded-lg border border-slate-200 dark:border-monday-dark-border bg-slate-50 dark:bg-monday-dark-bg text-sm px-3 py-2 focus:outline-none md:col-span-2"
                    />
                    <input
                        value={draftObjective.owner}
                        onChange={(e) => setDraftObjective((d) => ({ ...d, owner: e.target.value }))}
                        placeholder={t('owner_optional')}
                        className="rounded-lg border border-slate-200 dark:border-monday-dark-border bg-slate-50 dark:bg-monday-dark-bg text-sm px-3 py-2 focus:outline-none"
                    />
                    <input
                        value={draftObjective.timeframe}
                        onChange={(e) => setDraftObjective((d) => ({ ...d, timeframe: e.target.value }))}
                        placeholder={t('timeframe')}
                        className="rounded-lg border border-slate-200 dark:border-monday-dark-border bg-slate-50 dark:bg-monday-dark-bg text-sm px-3 py-2 focus:outline-none"
                />
            </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                        <Flag size={14} className="text-slate-500" />
                        <span>{t('key_results_focus')}</span>
                    </div>
                    <button
                        onClick={addObjective}
                        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold shadow-sm hover:bg-slate-800"
                    >
                        {t('add_objective')}
                    </button>
                </div>
            </div>

            {/* Objectives */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {objectives.map((objective) => (
                    <div key={objective.id} className="bg-white dark:bg-monday-dark-surface border border-slate-200 dark:border-monday-dark-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">{objective.timeframe}</p>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-monday-dark-text">{objective.title}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                    <User size={12} /> {objective.owner || t('unassigned')}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] font-semibold text-slate-500">{t('progress')}</span>
                                <div className="text-2xl font-semibold text-slate-800 dark:text-monday-dark-text">{progressForObjective(objective)}%</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {objective.keyResults.map((kr) => (
                                <div key={kr.id} className="p-3 rounded-lg border border-slate-100 dark:border-monday-dark-border bg-slate-50 dark:bg-monday-dark-surface">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-slate-800 dark:text-monday-dark-text">{kr.title}</div>
                                        <div className="text-xs text-slate-500">
                                            {kr.current}/{kr.target} {kr.unit || ''}
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-2">
                                        <div className="h-full bg-slate-700 rounded-full" style={{ width: `${progressForKR(kr)}%` }} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="range"
                                            min={0}
                                            max={kr.target || 1}
                                            value={kr.current}
                                            onChange={(e) =>
                                                setObjectives((prev) =>
                                                    prev.map((obj) =>
                                                        obj.id === objective.id
                                                            ? {
                                                                  ...obj,
                                                                  keyResults: obj.keyResults.map((k) =>
                                                                      k.id === kr.id ? { ...k, current: Number(e.target.value) } : k
                                                                  )
                                                              }
                                                            : obj
                                                    )
                                                )
                                            }
                                            className="flex-1 accent-slate-700"
                                        />
                                        <span className="text-xs text-slate-500 w-12 text-right">{progressForKR(kr)}%</span>
                                    </div>

                                    {/* Links to work items */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <select
                                            onChange={(e) => {
                                                linkTask(objective.id, kr.id, e.target.value);
                                                e.currentTarget.value = '';
                                            }}
                                            defaultValue=""
                                            className="flex-1 text-xs rounded-lg border border-slate-200 dark:border-monday-dark-border bg-white dark:bg-monday-dark-surface px-2 py-1"
                                        >
                                            <option value="">{t('link_work_item')}</option>
                                            {tasks.slice(0, 10).map((task) => (
                                                <option key={task.id} value={task.name}>
                                                    {task.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Link2 size={14} className="text-gray-400" />
                                    </div>

                                    {kr.links.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {kr.links.map((link) => (
                                                <span key={link} className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-monday-dark-text">
                                                    {link}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add KR */}
                        <div className="flex items-center gap-2">
                            <input
                                value={krDrafts[objective.id]?.title || ''}
                                onChange={(e) =>
                                    setKrDrafts((prev) => ({
                                        ...prev,
                                        [objective.id]: { ...(prev[objective.id] || { target: 100, unit: '%' }), title: e.target.value }
                                    }))
                                }
                                placeholder={t('key_result')}
                                className="flex-1 rounded-lg border border-gray-200 dark:border-monday-dark-border bg-gray-50 dark:bg-monday-dark-bg text-sm px-3 py-2 focus:outline-none"
                            />
                            <input
                                type="number"
                                value={krDrafts[objective.id]?.target ?? 100}
                                onChange={(e) =>
                                    setKrDrafts((prev) => ({
                                        ...prev,
                                        [objective.id]: { ...(prev[objective.id] || { title: '' }), target: Number(e.target.value), unit: prev[objective.id]?.unit || '%' }
                                    }))
                                }
                                className="w-20 rounded-lg border border-gray-200 dark:border-monday-dark-border bg-gray-50 dark:bg-monday-dark-bg text-sm px-3 py-2 focus:outline-none"
                            />
                            <input
                                value={krDrafts[objective.id]?.unit ?? '%'}
                                onChange={(e) =>
                                    setKrDrafts((prev) => ({
                                        ...prev,
                                        [objective.id]: { ...(prev[objective.id] || { title: '', target: 100 }), unit: e.target.value }
                                    }))
                                }
                                className="w-16 rounded-lg border border-gray-200 dark:border-monday-dark-border bg-gray-50 dark:bg-monday-dark-bg text-sm px-2 py-2 focus:outline-none text-center"
                            />
                            <button
                                onClick={() => addKeyResult(objective.id)}
                                className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold shadow-sm hover:bg-purple-700"
                            >
                                {t('add_kr')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {objectives.length === 0 && <div className="text-sm text-gray-500">{t('no_objectives_yet')}</div>}
        </div>
    );
};

export default GoalsOKRsView;
