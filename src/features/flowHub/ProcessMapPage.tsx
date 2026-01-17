import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';

const gridStyle = {
    backgroundSize: '40px 40px',
    backgroundImage:
        'linear-gradient(to right, rgba(200, 200, 200, 0.1) 1px, transparent 1px), ' +
        'linear-gradient(to bottom, rgba(200, 200, 200, 0.1) 1px, transparent 1px)'
};

type ProcessStatus = 'Delayed' | 'Expedited' | 'In Progress' | 'Pending' | 'Closed';
type WorkflowVariant = 'critical' | 'expedited' | 'normal' | 'pending' | 'closed' | 'early';

interface ProcessRow {
    id: string;
    created: string;
    category: string;
    stage: string;
    status: ProcessStatus;
    workflowVariant: WorkflowVariant;
}

const processRows: ProcessRow[] = [
    { id: 'PO-9021-X', created: 'Created 2h ago', category: 'Logistics', stage: 'Customs Clearance', status: 'Delayed', workflowVariant: 'critical' },
    { id: 'MF-3320-B', created: 'Updated 5m ago', category: 'Manufacturing', stage: 'Assembly Line B', status: 'Expedited', workflowVariant: 'expedited' },
    { id: 'PO-9022-A', created: 'Created 4h ago', category: 'Procurement', stage: 'Vendor Ack.', status: 'In Progress', workflowVariant: 'normal' },
    { id: 'LG-1102-P', created: 'Scheduled for Tomorrow', category: 'Distribution', stage: 'Awaiting Pick', status: 'Pending', workflowVariant: 'pending' },
    { id: 'PO-8821-C', created: 'Completed yesterday', category: 'Procurement', stage: 'Delivered', status: 'Closed', workflowVariant: 'closed' },
    { id: 'MF-4022-A', created: 'Started 1h ago', category: 'Manufacturing', stage: 'Milling', status: 'In Progress', workflowVariant: 'early' }
];

const statusStyles: Record<ProcessStatus, { className: string; dotClass?: string; icon?: string; pulse?: boolean }> = {
    Delayed: {
        className: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
        dotClass: 'bg-red-500',
        pulse: true
    },
    Expedited: {
        className: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
        dotClass: 'bg-amber-500'
    },
    'In Progress': {
        className: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
        dotClass: 'bg-blue-500'
    },
    Pending: {
        className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    },
    Closed: {
        className: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
        icon: 'check'
    }
};

const WorkflowSvg: React.FC<{ variant: WorkflowVariant; id: string }> = ({ variant, id }) => {
    if (variant === 'critical') {
        return (
            <svg className="w-full h-8" fill="none" viewBox="0 0 200 32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id={`${id}-grad-critical`} x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#ef4444', stopOpacity: 0.5 }} />
                        <stop offset="100%" style={{ stopColor: '#cbd5e1', stopOpacity: 0.2 }} />
                    </linearGradient>
                </defs>
                <path d="M 10,16 L 90,16" stroke={`url(#${id}-grad-critical)`} strokeLinecap="round" strokeWidth="2" />
                <path d="M 90,16 L 190,16" stroke="#e2e8f0" strokeDasharray="4,4" strokeWidth="1" />
                <circle cx="10" cy="16" fill="#ef4444" r="3" />
                <circle cx="50" cy="16" fill="#ef4444" r="3" />
                <g>
                    <circle className="animate-pulse" cx="90" cy="16" fill="#fee2e2" r="8" />
                    <circle cx="90" cy="16" fill="#ef4444" r="4" stroke="white" strokeWidth="1.5" />
                </g>
                <circle cx="130" cy="16" fill="#e2e8f0" r="3" />
                <circle cx="170" cy="16" fill="#e2e8f0" r="3" />
            </svg>
        );
    }

    if (variant === 'expedited') {
        return (
            <svg className="w-full h-8" fill="none" viewBox="0 0 200 32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id={`${id}-grad-urgent`} x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <path d="M 10,16 L 130,16" stroke={`url(#${id}-grad-urgent)`} strokeLinecap="round" strokeWidth="2" />
                <path d="M 130,16 L 190,16" stroke="#e2e8f0" strokeDasharray="4,4" strokeWidth="1" />
                <circle cx="10" cy="16" fill="#f59e0b" r="3" />
                <circle cx="50" cy="16" fill="#f59e0b" r="3" />
                <circle cx="90" cy="16" fill="#f59e0b" r="3" />
                <g>
                    <circle className="animate-ping opacity-75" cx="130" cy="16" fill="#fcd34d" r="6" />
                    <circle cx="130" cy="16" fill="#f59e0b" r="4" stroke="white" strokeWidth="1.5" />
                </g>
                <circle cx="170" cy="16" fill="#e2e8f0" r="3" />
            </svg>
        );
    }

    if (variant === 'normal') {
        return (
            <svg className="w-full h-8" fill="none" viewBox="0 0 200 32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id={`${id}-grad-normal`} x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#2b6cee', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#2b6cee', stopOpacity: 0.3 }} />
                    </linearGradient>
                </defs>
                <path d="M 10,16 L 70,16" stroke={`url(#${id}-grad-normal)`} strokeLinecap="round" strokeWidth="2" />
                <path d="M 70,16 L 190,16" stroke="#e2e8f0" strokeDasharray="4,4" strokeWidth="1" />
                <circle cx="10" cy="16" fill="#2b6cee" r="3" />
                <circle cx="50" cy="16" fill="#2b6cee" r="3" />
                <g>
                    <circle cx="70" cy="16" fill="#2b6cee" fillOpacity="0.2" r="8" />
                    <circle cx="70" cy="16" fill="#2b6cee" r="4" stroke="white" strokeWidth="1.5" />
                </g>
                <circle cx="90" cy="16" fill="#e2e8f0" r="3" />
                <circle cx="130" cy="16" fill="#e2e8f0" r="3" />
                <circle cx="170" cy="16" fill="#e2e8f0" r="3" />
            </svg>
        );
    }

    if (variant === 'pending') {
        return (
            <svg className="w-full h-8" fill="none" viewBox="0 0 200 32" xmlns="http://www.w3.org/2000/svg">
                <path d="M 10,16 L 190,16" stroke="#e2e8f0" strokeDasharray="4,4" strokeWidth="1" />
                <circle cx="10" cy="16" fill="#94a3b8" r="3" />
                <circle cx="50" cy="16" fill="#e2e8f0" r="3" />
                <circle cx="90" cy="16" fill="#e2e8f0" r="3" />
                <circle cx="130" cy="16" fill="#e2e8f0" r="3" />
                <circle cx="170" cy="16" fill="#e2e8f0" r="3" />
            </svg>
        );
    }

    if (variant === 'closed') {
        return (
            <svg className="w-full h-8" fill="none" viewBox="0 0 200 32" xmlns="http://www.w3.org/2000/svg">
                <path d="M 10,16 L 190,16" stroke="#10b981" strokeWidth="2" />
                <circle cx="10" cy="16" fill="#10b981" r="3" />
                <circle cx="50" cy="16" fill="#10b981" r="3" />
                <circle cx="90" cy="16" fill="#10b981" r="3" />
                <circle cx="130" cy="16" fill="#10b981" r="3" />
                <circle cx="190" cy="16" fill="#10b981" r="3" />
            </svg>
        );
    }

    return (
        <svg className="w-full h-8" fill="none" viewBox="0 0 200 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M 10,16 L 30,16" stroke="#2b6cee" strokeLinecap="round" strokeWidth="2" />
            <path d="M 30,16 L 190,16" stroke="#e2e8f0" strokeDasharray="4,4" strokeWidth="1" />
            <circle cx="10" cy="16" fill="#2b6cee" r="3" />
            <g>
                <circle cx="30" cy="16" fill="#2b6cee" fillOpacity="0.2" r="8" />
                <circle cx="30" cy="16" fill="#2b6cee" r="4" stroke="white" strokeWidth="1.5" />
            </g>
            <circle cx="70" cy="16" fill="#e2e8f0" r="3" />
            <circle cx="110" cy="16" fill="#e2e8f0" r="3" />
            <circle cx="150" cy="16" fill="#e2e8f0" r="3" />
        </svg>
    );
};

const StatusBadge: React.FC<{ status: ProcessStatus }> = ({ status }) => {
    const cfg = statusStyles[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${cfg.className}`}>
            {cfg.icon ? (
                <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
            ) : cfg.dotClass ? (
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass} ${cfg.pulse ? 'animate-pulse' : ''}`} />
            ) : null}
            {status}
        </span>
    );
};

export const ProcessMapPage: React.FC = () => {
    const { t } = useAppContext();
    const pathRef = useRef<SVGPathElement | null>(null);
    const [pathLength, setPathLength] = useState(1);
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [headPos, setHeadPos] = useState<{ x: number; y: number }>({ x: 50, y: 250 });
    const [view, setView] = useState<'list' | 'map'>('list');
    const [selectedProcess, setSelectedProcess] = useState<ProcessRow | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const stages = useMemo(
        () => [
            { label: 'Purchase Order', at: 0 },
            { label: 'Production', at: 0.25 },
            { label: 'QC Check', at: 0.5 },
            { label: 'Goods Receipt', at: 0.75 },
            { label: 'Invoicing', at: 1 }
        ],
        []
    );

    const currentStage = useMemo(() => {
        const idx = stages.findIndex((s, i) => progress <= (stages[i + 1]?.at ?? 1));
        return idx === -1 ? stages[stages.length - 1] : stages[idx];
    }, [progress, stages]);

    useEffect(() => {
        if (view !== 'map') return;
        const measure = () => {
            if (!pathRef.current) return;
            const len = pathRef.current.getTotalLength();
            setPathLength(len || 1);
        };
        requestAnimationFrame(measure);
    }, [view]);

    useEffect(() => {
        if (!isPlaying || view !== 'map') return;
        const id = window.setInterval(() => {
            setProgress(prev => {
                const next = prev + 0.006 * speed;
                if (next >= 1) {
                    setIsPlaying(false);
                    return 1;
                }
                return next;
            });
        }, 30);
        return () => window.clearInterval(id);
    }, [isPlaying, speed, view]);

    useEffect(() => {
        if (view !== 'map' || !pathRef.current || !pathLength) return;
        const dist = Math.max(0, Math.min(pathLength, pathLength * progress));
        const pt = pathRef.current.getPointAtLength(dist);
        setHeadPos({ x: pt.x, y: pt.y });
    }, [progress, pathLength, view]);

    useEffect(() => {
        if (view === 'map') {
            setProgress(0);
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    }, [view]);

    const handleRewind = () => {
        setProgress(0);
        setIsPlaying(true);
    };

    const handleSelectProcess = (process: ProcessRow) => {
        setSelectedProcess(process);
        setView('map');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedProcess(null);
        setIsFullscreen(false);
    };

    const renderListView = () => (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display h-full w-full overflow-hidden flex flex-row">
            <main className="flex-1 relative bg-white dark:bg-[#0f131a] overflow-hidden flex flex-col">
                <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" style={gridStyle} />
                <div className="px-6 pt-6 pb-2 z-30">
                    <div className="w-full bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800 p-2 pl-3 pr-3 flex items-center justify-between gap-4">
                        <div className="flex items-center pl-1">
                            <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer hover:bg-primary/20">
                                <span className="material-symbols-outlined text-primary text-2xl leading-none">hub</span>
                            </div>
                        </div>
                        <nav className="hidden md:flex items-center bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <a className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-primary transition-all duration-200 ease-out h-9" href="#">
                                <span className="material-symbols-outlined text-[20px] fill-current">dashboard</span>
                                <span className="text-xs font-bold uppercase tracking-wide">{t('overview')}</span>
                            </a>
                            <a className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors group h-9" href="#">
                                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                                <span className="text-xs font-medium uppercase tracking-wide">{t('procurement')}</span>
                            </a>
                            <a className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors group h-9" href="#">
                                <span className="material-symbols-outlined text-[20px]">factory</span>
                                <span className="text-xs font-medium uppercase tracking-wide">{t('production')}</span>
                            </a>
                            <a className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors group h-9" href="#">
                                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                                <span className="text-xs font-medium uppercase tracking-wide">{t('logistics')}</span>
                            </a>
                        </nav>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors relative">
                                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800 ring-2 ring-white dark:ring-surface-dark" />
                                </button>
                                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[22px]">settings</span>
                                </button>
                                <div
                                    className="w-10 h-10 rounded-full bg-slate-200 bg-center bg-cover border-2 border-white dark:border-slate-700 shadow-sm ml-1 cursor-pointer hover:border-primary transition-colors"
                                    style={{
                                        backgroundImage:
                                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuATsFD3yAbIuYntuO7yBSnGElNaLMccDRLKuydAM_6kJvS-f2zPyUA3_uMR2sCWcYg4hexgd-G5vHP2DRwZA6IfbM98zNVR30GqkCiv4Pfm8LN8w6zdhY4HerdYf6LBqaxxTgpJ-CmOI8PjhK4c7XhOjwDs4nvIbfubFYBPZOnvLuWIT8FVoAXa7zDvCMVnbnkD7iyH7emdyxoPnzk7x2KpuMzmCMYzJH6IlWYkuHRPCID3KAkQ_OmvBo13wOxIghoUEWDFIgaQqQz7')"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-4 z-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Processes</h2>
                            <p className="text-slate-500 text-sm mt-1">Real-time monitoring of global supply chain workflows</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
                                <input
                                    className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary w-64 shadow-sm"
                                    placeholder="Search PO, Shipment ID..."
                                    type="text"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium shadow-sm transition-colors">
                                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                <span>Filter</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {[
                            { label: 'All Processes (124)', active: true },
                            { label: 'Open Process', dot: 'bg-primary' },
                            { label: 'Urgent', dot: 'bg-amber-400' },
                            { label: 'Critical', dot: 'bg-red-500' },
                            { label: 'Pending', dot: 'bg-slate-400' },
                            { label: 'Closed', dot: 'bg-emerald-500' },
                            { label: 'Delays', dot: 'bg-rose-500' },
                            { label: 'Velocity', dot: 'bg-indigo-500' }
                        ].map(filter => (
                            <button
                                key={filter.label}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors shadow-sm flex items-center gap-2 ${filter.active
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {filter.dot && <span className={`w-1.5 h-1.5 rounded-full ${filter.dot}`} />}
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 w-full overflow-auto px-8 pb-8">
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                    <th className="p-4 pl-6">Process ID</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4 w-[300px]">Workflow Progress</th>
                                    <th className="p-4">Current Stage</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {processRows.map(process => (
                                    <tr
                                        key={process.id}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                        onClick={() => handleSelectProcess(process)}
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white">{process.id}</span>
                                                <span className="text-[10px] text-slate-400">{process.created}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{process.category}</td>
                                        <td className="p-4">
                                            <WorkflowSvg variant={process.workflowVariant} id={process.id} />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{process.stage}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={process.status} />
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <button
                                                className="text-slate-400 hover:text-primary transition-colors"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <span className="material-symbols-outlined">more_horiz</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
                        <p>Showing 1-6 of 124 processes</p>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>
                                Previous
                            </button>
                            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Next</button>
                        </div>
                    </div>
                </div>
            </main>

            <aside className="w-72 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark z-20 shrink-0 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">System Status</h2>
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1">Live Overview</p>
                        </div>
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white dark:border-surface-dark" />
                        </span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="group relative overflow-hidden rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-700/50 p-4 transition-all hover:shadow-md hover:border-primary/30">
                            <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Active</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">1,245</h3>
                                    </div>
                                    <div className="flex items-center mt-1 gap-1.5">
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400">+2.4% vs last week</span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-primary group-hover:text-white group-hover:bg-primary transition-colors">
                                    <span className="material-symbols-outlined text-xl">inventory_2</span>
                                </div>
                            </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-xl bg-red-50/60 border border-red-100 dark:bg-red-900/10 dark:border-red-900/20 p-4 transition-all hover:shadow-md hover:border-red-200">
                            <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <p className="text-[10px] font-bold text-red-600/80 dark:text-red-400/80 uppercase tracking-wider mb-1">Critical Issues</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-bold text-red-700 dark:text-red-400 tracking-tight">12</h3>
                                    </div>
                                    <div className="flex items-center mt-1 gap-1.5">
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Action Required</span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-red-500 group-hover:text-white group-hover:bg-red-500 transition-colors">
                                    <span className="material-symbols-outlined text-xl">warning</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-wider">Health Distribution</h3>
                            <span className="text-[10px] text-slate-400">Today</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden flex shadow-inner">
                                <div className="h-full bg-primary" style={{ width: '60%' }} />
                                <div className="h-full bg-amber-400" style={{ width: '25%' }} />
                                <div className="h-full bg-red-500" style={{ width: '15%' }} />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium px-0.5">
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" />Normal 60%</span>
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Risk 25%</span>
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Crit 15%</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h3 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-wider mb-1">Bottleneck Alerts</h3>
                        <div className="flex flex-col gap-2.5">
                            <div className="relative pl-3 border-l-2 border-red-500 py-0.5">
                                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Customs Hold - Zone 4</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Validating docs for 3 shipments.</p>
                            </div>
                            <div className="relative pl-3 border-l-2 border-amber-400 py-0.5">
                                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Throughput Dip</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Assembly Line B at 85%.</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h3 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-wider">Avg. Cycle Time</h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                            <div>
                                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Current</span>
                                <p className="text-slate-900 dark:text-white text-xl font-bold leading-none mt-1">4.2 Days</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-green-600 bg-green-100/50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-green-100 flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px]">trending_down</span>
                                    -0.5d
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1">vs last week</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark">
                    <button className="w-full group flex justify-center items-center gap-2 bg-slate-900 dark:bg-slate-700 hover:bg-primary dark:hover:bg-primary text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow-lg hover:shadow-primary/20 text-sm">
                        <span className="material-symbols-outlined text-lg group-hover:-translate-y-0.5 transition-transform">download</span>
                        Export Report
                    </button>
                </div>
            </aside>
        </div>
    );

    if (view === 'list') {
        return renderListView();
    }

    const displayStageLabel = selectedProcess?.stage || currentStage.label;
    const displayStatus = selectedProcess?.status || 'In Progress';
    const activeSegment = selectedProcess?.category;

    const showLeftSidebar = false;
    const showRightSidebar = !isFullscreen;

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display h-full w-full overflow-hidden flex flex-row relative`}>
            {/* Left sidebar currently disabled */}

            <main className="flex-1 relative bg-white dark:bg-[#0f131a] overflow-hidden flex flex-col">
                <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" style={gridStyle} />
                <div className="relative z-20 px-8 pt-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            <span className="material-symbols-outlined text-base">arrow_back</span>
                            Active Processes
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedProcess && (
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Process ID</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedProcess.id}</span>
                                </div>
                                <span className="text-slate-400">•</span>
                                <span className="text-sm text-slate-600 dark:text-slate-200">{selectedProcess.category}</span>
                                <StatusBadge status={displayStatus} />
                            </div>
                        )}
                        <button
                            onClick={() => setIsFullscreen(prev => !prev)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white border border-primary shadow-sm text-sm hover:bg-blue-700"
                            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
                        >
                            <span className="material-symbols-outlined text-base">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                        </button>
                    </div>
                </div>
                <div className="relative z-10 px-8 mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-500 shadow-sm">
                        Process Map
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-primary shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Live View
                    </span>
                </div>
                <div className="flex-1 w-full h-full flex items-center justify-center p-10 overflow-auto">
                    <div className="relative min-w-[800px] w-full max-w-[1200px] aspect-[16/9]">
                        <svg className="w-full h-full drop-shadow-lg" fill="none" viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style={{ stopColor: '#94a3b8', stopOpacity: 0.3 }} />
                                    <stop offset="30%" style={{ stopColor: '#2b6cee', stopOpacity: 1 }} />
                                    <stop offset="70%" style={{ stopColor: '#2b6cee', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#94a3b8', stopOpacity: 0.3 }} />
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <path
                                ref={pathRef}
                                d="M 50,250 C 150,250 150,250 250,250 L 450,250 C 550,250 550,150 650,150 L 850,150"
                                stroke="url(#lineGradient)"
                                strokeWidth="3"
                                fill="none"
                                className="opacity-80"
                                style={{
                                    strokeDasharray: `${pathLength} ${pathLength}`,
                                    strokeDashoffset: Math.max(0, pathLength - pathLength * progress),
                                    transition: 'stroke-dashoffset 0.12s ease-out'
                                }}
                            />
                            <path d="M 450,250 C 550,250 550,350 650,350 L 850,350" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" fill="none" />
                            <g transform="translate(50, 250)">
                                <circle r="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
                                <text
                                    x="0"
                                    y="30"
                                    textAnchor="middle"
                                    className="text-[10px] fill-slate-500 font-medium"
                                    style={{ fontFamily: 'Space Grotesk' }}
                                >
                                    Purchase Order
                                </text>
                            </g>
                            <g transform="translate(250, 250)">
                                <circle r="8" fill="#f8fafc" stroke="#2b6cee" strokeWidth="2" />
                                <text
                                    x="0"
                                    y="30"
                                    textAnchor="middle"
                                    className="text-[10px] fill-slate-500 font-medium"
                                    style={{ fontFamily: 'Space Grotesk' }}
                                >
                                    Production
                                </text>
                            </g>
                            <g transform="translate(450, 250)">
                                <polygon points="0,-12 12,0 0,12 -12,0" fill="#f8fafc" stroke="#2b6cee" strokeWidth="2" />
                                <text
                                    x="0"
                                    y="35"
                                    textAnchor="middle"
                                    className="text-[10px] fill-slate-500 font-medium"
                                    style={{ fontFamily: 'Space Grotesk' }}
                                >
                                    QC Check
                                </text>
                            </g>
                            <g transform="translate(650, 150)" style={{ filter: 'url(#glow)' }}>
                                <circle r="20" fill="#2b6cee" fillOpacity="0.15" />
                                <circle r="12" fill="#2b6cee" stroke="white" strokeWidth="2" />
                                <text
                                    x="0"
                                    y="40"
                                    textAnchor="middle"
                                    className="text-xs fill-primary font-bold"
                                    style={{ fontFamily: 'Space Grotesk' }}
                                >
                                    Goods Receipt
                                </text>
                            </g>
                            <g transform="translate(650, 350)">
                                <circle r="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                                <text
                                    x="0"
                                    y="30"
                                    textAnchor="middle"
                                    className="text-[10px] fill-slate-400 font-medium"
                                    style={{ fontFamily: 'Space Grotesk' }}
                                >
                                    Re-work
                                </text>
                            </g>
                            <g transform="translate(850, 150)">
                                <circle r="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                                <text
                                    x="0"
                                    y="30"
                                    textAnchor="middle"
                                    className="text-[10px] fill-slate-400 font-medium"
                                    style={{ fontFamily: 'Space Grotesk' }}
                                >
                                    Invoicing
                                </text>
                            </g>
                            <foreignObject x="680" y="110" width="140" height="50">
                                <div className="flex" xmlns="http://www.w3.org/1999/xhtml">
                                    <div className="bg-primary text-white text-[10px] px-2 py-1 rounded shadow-lg">
                                        {selectedProcess ? `Tracking ${selectedProcess.id}` : 'In Progress'}
                                    </div>
                                </div>
                            </foreignObject>
                            <g>
                                <circle cx={headPos.x} cy={headPos.y} r="10" fill="#2b6cee" fillOpacity="0.18" />
                                <circle
                                    cx={headPos.x}
                                    cy={headPos.y}
                                    r="6"
                                    fill="#2b6cee"
                                    stroke="white"
                                    strokeWidth="2"
                                    className="animate-pulse"
                                />
                            </g>
                        </svg>
                    </div>
                </div>
                <div className="absolute bottom-24 right-8 z-30 flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-2 shadow-sm pointer-events-auto">
                    <button
                        onClick={handleRewind}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        title="Rewind to start"
                    >
                        <span className="material-symbols-outlined text-base">replay</span>
                    </button>
                    <button
                        onClick={() => setIsPlaying(p => !p)}
                        className="p-2 rounded-full bg-primary text-white hover:bg-blue-700"
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        <span className="material-symbols-outlined text-base">{isPlaying ? 'pause' : 'play_arrow'}</span>
                    </button>
                    <div className="flex items-center gap-1">
                        {[0.5, 1, 2, 3].map(val => (
                            <button
                                key={val}
                                onClick={() => setSpeed(val)}
                                className={`px-2 py-1 rounded-md text-xs font-semibold border ${speed === val
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {val}x
                            </button>
                        ))}
                    </div>
                    <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-150"
                            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                        />
                    </div>
                </div>
                <div className="absolute bottom-6 left-0 w-full flex justify-center pointer-events-none">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-full px-6 py-2 flex items-center gap-6 shadow-sm pointer-events-auto">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary shadow-glow-sm" />
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Active Path</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 border border-slate-300 dark:border-slate-600 rotate-45 transform bg-white dark:bg-slate-800" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">Decision Point</span>
                        </div>
                    </div>
                </div>
            </main>

            {showRightSidebar && (
            <aside className="w-96 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark z-20 shrink-0 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Selected Stage</p>
                    <h2 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{displayStageLabel}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={displayStatus} />
                        <span className="text-slate-400 text-sm">•</span>
                        <span className="text-slate-500 text-sm">{selectedProcess ? `${selectedProcess.id} • ${selectedProcess.category}` : 'Warehouse A (Zone 4)'}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                <span className="text-xs font-medium uppercase">Lead Time</span>
                            </div>
                            <p className="text-slate-900 dark:text-white text-xl font-bold">14h 20m</p>
                            <p className="text-green-600 text-xs font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">arrow_downward</span>
                                10% vs avg
                            </p>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <span className="material-symbols-outlined text-sm">attach_money</span>
                                <span className="text-xs font-medium uppercase">Cost Var</span>
                            </div>
                            <p className="text-slate-900 dark:text-white text-xl font-bold">+2.4%</p>
                            <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">arrow_upward</span>
                                Over budget
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h3 className="text-slate-900 dark:text-white text-sm font-bold">Node Metrics</h3>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 text-sm">Throughput</span>
                            <span className="text-slate-900 dark:text-white text-sm font-medium">450 Units/hr</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 text-sm">Quality Pass Rate</span>
                            <span className="text-slate-900 dark:text-white text-sm font-medium">98.2%</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 text-sm">Pending Arrival</span>
                            <span className="text-slate-900 dark:text-white text-sm font-medium">2 Trucks</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h3 className="text-slate-900 dark:text-white text-sm font-bold">Live Feed</h3>
                        <div className="relative w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group cursor-pointer">
                            <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10 animate-pulse">
                                LIVE
                            </div>
                            <div
                                className="w-full h-40 bg-slate-200 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                data-alt="Live camera feed of the warehouse floor showing automated guided vehicles"
                                style={{
                                    backgroundImage:
                                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBYH6Q6wr_6lxM6omh1ngUbt2jNY0VVWy4EqADlKfflBPIAvZrSFbJLcNOtjQUMLmzNzlgItNBZAXCvkZ3XVCncE2VNEGOPa88pzweksFGMML4CUMfL_FX4cSChXEAqcxUKav1ftExEBzRsR6USw1pyLb3wSgDiu1mBRg8ocGTQl3XaCWE-FIFGKZBpM4bqti1ffMUE2Ee72Z1eu5_h4wOlvOGaZogMaWhRagX2138BbREbzEgmpEcKN5TPv1bAU5KG8lxDn83m9-GM")'
                                }}
                            />
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                                <p className="text-white text-xs font-medium">Camera 04 - Unloading Dock</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h3 className="text-slate-900 dark:text-white text-sm font-bold">Recent Activity</h3>
                        <div className="relative pl-4 border-l border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300" />
                                <p className="text-slate-500 text-xs mb-0.5">10 mins ago</p>
                                <p className="text-slate-800 dark:text-slate-200 text-sm">Batch #4092 cleared QC.</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-primary" />
                                <p className="text-slate-500 text-xs mb-0.5">24 mins ago</p>
                                <p className="text-slate-800 dark:text-slate-200 text-sm font-medium">Receipt started for Shipment A-12.</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300" />
                                <p className="text-slate-500 text-xs mb-0.5">1 hour ago</p>
                                <p className="text-slate-800 dark:text-slate-200 text-sm">Driver check-in completed.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark">
                    <button className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg">description</span>
                        Generate Report
                    </button>
                </div>
            </aside>
            )}
        </div>
    );
};

export default ProcessMapPage;
