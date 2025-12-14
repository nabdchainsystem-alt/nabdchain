import React, { useState } from 'react';
import { Inbox, CheckCircle, Bell, Layers, Clock, CheckSquare } from 'lucide-react';

interface GTDReflectViewProps {
    counts: {
        inbox: number;
        nextActions: number;
        waitingFor: number;
        projects: number;
        someday: number;
        completed: number;
    };
}

const StatCard: React.FC<{
    title: string;
    icon: React.ElementType;
    count: number;
    colorClass: string;
    emptyText: string;
}> = ({ title, icon: Icon, count, colorClass, emptyText }) => {
    return (
        <div className="bg-white dark:bg-[#111] rounded-3xl p-6 border border-gray-100 dark:border-white/5 flex flex-col items-start gap-3 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-2 w-full">
                <Icon className={`w-5 h-5 ${colorClass}`} />
                <h3 className="font-bold text-base text-gray-800 dark:text-white flex-1">{title}</h3>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-full uppercase tracking-wider">
                    Total: {count}
                </span>
            </div>

            <div className="w-full h-[1px] bg-gray-50 dark:bg-white/5 my-1" />

            <div className="flex-1 w-full flex items-center justify-center py-2">
                {count > 0 ? (
                    <div className="text-3xl font-serif italic text-gray-800 dark:text-gray-100">
                        {count} <span className="text-xs font-sans font-normal text-gray-400 not-italic uppercase tracking-widest">items</span>
                    </div>
                ) : (
                    <span className="text-[10px] text-gray-300 italic">{emptyText}</span>
                )}
            </div>
        </div>
    );
};

export const GTDReflectView: React.FC<GTDReflectViewProps> = ({ counts }) => {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center pb-12">
            <div className="text-center mb-8">
                <h2 className="text-5xl font-black tracking-widest uppercase mb-4 text-[#1A1A1A] dark:text-white">Reflect</h2>
                <p className="text-gray-400 font-serif italic tracking-widest text-sm uppercase">Today's Progress</p>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-full mb-10">
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${period === p
                            ? 'bg-white dark:bg-[#222] text-black dark:text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                <StatCard
                    title="Inbox"
                    icon={Inbox}
                    count={counts.inbox}
                    colorClass="text-blue-500"
                    emptyText="No items in this list."
                />
                <StatCard
                    title="Next Actions"
                    icon={CheckCircle}
                    count={counts.nextActions}
                    colorClass="text-green-500"
                    emptyText="No items in this list."
                />
                <StatCard
                    title="Waiting For"
                    icon={Bell}
                    count={counts.waitingFor}
                    colorClass="text-orange-400"
                    emptyText="No items in this list."
                />
                <StatCard
                    title="Active Projects"
                    icon={Layers}
                    count={counts.projects}
                    colorClass="text-purple-500"
                    emptyText="No items in this list."
                />
                <StatCard
                    title="Someday / Maybe"
                    icon={Clock}
                    count={counts.someday}
                    colorClass="text-gray-400"
                    emptyText="No items in this list."
                />
                <StatCard
                    title="Completed"
                    icon={CheckSquare}
                    count={counts.completed}
                    colorClass="text-blue-400"
                    emptyText="No items completed."
                />
            </div>
        </div>
    );
};
