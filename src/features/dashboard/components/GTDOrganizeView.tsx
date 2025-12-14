import React from 'react';
import { Layers, CheckCircle, Bell, Calendar, Clock, FileText, Plus, Trash2 } from 'lucide-react';

interface OrganizedItem {
    id: string;
    title: string;
    createdAt: number;
    scheduledAt?: number;
}

interface GTDOrganizeViewProps {
    projects: OrganizedItem[];
    nextActions: OrganizedItem[];
    waitingFor: OrganizedItem[];
    scheduled: OrganizedItem[];
    someday: OrganizedItem[];
    reference: OrganizedItem[];
    onDelete: (id: string) => void;
}

const ListCard: React.FC<{
    title: string;
    icon: React.ElementType;
    items: OrganizedItem[];
    colorClass: string;
    onDelete: (id: string) => void;
}> = ({ title, icon: Icon, items, colorClass, onDelete }) => {
    return (
        <div className="bg-white dark:bg-[#111] rounded-3xl p-4 border border-gray-100 dark:border-white/5 h-56 flex flex-col hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-full">
                        TOTAL: {items.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {items.length > 0 ? (
                    items.map(item => (
                        <div key={item.id} className="group relative flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors cursor-pointer">
                            <div className="flex flex-col flex-1 min-w-0 mr-2">
                                <span className="truncate font-medium">{item.title}</span>
                                {item.scheduledAt && (
                                    <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                        <Calendar size={8} />
                                        {new Date(item.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all text-gray-400 hover:text-red-500 shrink-0"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 opacity-50">
                        <span className="text-[10px] italic">Empty</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const GTDOrganizeView: React.FC<GTDOrganizeViewProps> = ({
    projects, nextActions, waitingFor, scheduled, someday, reference, onDelete
}) => {
    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center pb-12">
            <div className="text-center mb-10">
                <h2 className="text-5xl font-black tracking-widest uppercase mb-4 text-[#1A1A1A] dark:text-white">Organize</h2>
                <p className="text-gray-400 font-serif italic tracking-widest text-sm uppercase">Clarify outcomes & next actions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                <ListCard title="Projects" icon={Layers} items={projects} colorClass="text-purple-500" onDelete={onDelete} />
                <ListCard title="Next Actions" icon={CheckCircle} items={nextActions} colorClass="text-green-500" onDelete={onDelete} />
                <ListCard title="Waiting For" icon={Bell} items={waitingFor} colorClass="text-orange-400" onDelete={onDelete} />

                <ListCard title="Scheduled" icon={Calendar} items={scheduled} colorClass="text-blue-500" onDelete={onDelete} />
                <ListCard title="Someday / Maybe" icon={Clock} items={someday} colorClass="text-gray-400" onDelete={onDelete} />
                <ListCard title="Reference" icon={FileText} items={reference} colorClass="text-gray-500" onDelete={onDelete} />
            </div>
        </div>
    );
};
