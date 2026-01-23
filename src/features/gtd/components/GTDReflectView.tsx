import React, { useState } from 'react';
import { Tray as Inbox, CheckCircle, Bell, Stack as Layers, Clock, CheckSquare, X } from 'phosphor-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReflectItem {
    id: string;
    title: string;
    createdAt: number;
}

interface GTDReflectViewProps {
    lists: {
        inbox: ReflectItem[];
        nextActions: ReflectItem[];
        waitingFor: ReflectItem[];
        projects: ReflectItem[];
        someday: ReflectItem[];
        completed: ReflectItem[];
    };
}

const StatCard: React.FC<{
    title: string;
    icon: React.ElementType;
    items: ReflectItem[];
    colorClass: string;
    emptyText: string;
    onClick: () => void;
}> = ({ title, icon: Icon, items, colorClass, emptyText, onClick }) => {
    const recentItems = items.slice(0, 3); // Show top 3 recent items

    return (
        <div className="bg-white dark:bg-monday-dark-bg rounded-3xl p-6 border border-gray-100 dark:border-white/5 flex flex-col items-start gap-4 hover:shadow-lg transition-shadow duration-300 cursor-pointer group h-full min-h-[200px]"
            onClick={onClick}
        >
            <div className="flex items-center gap-2 w-full mb-2">
                <div className={`p-2 rounded-full bg-gray-50 dark:bg-white/5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex-1 font-serif italic">{title}</h3>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-full uppercase tracking-wider">
                    {items.length}
                </span>
            </div>

            <div className="w-full h-[1px] bg-gray-50 dark:bg-white/5" />

            <div className="flex-1 w-full">
                {items.length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Recent Thoughts</p>
                        {recentItems.map(item => (
                            <div key={item.id} className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 font-serif">
                                • {item.title}
                            </div>
                        ))}
                        {items.length > 3 && (
                            <div className="text-[10px] text-gray-400 italic mt-2">
                                + {items.length - 3} more...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center h-full min-h-[80px]">
                        <span className="text-xs text-gray-300 italic">{emptyText}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const GTDReflectView: React.FC<GTDReflectViewProps> = ({ lists }) => {
    const [selectedCategory, setSelectedCategory] = useState<{ title: string; items: ReflectItem[] } | null>(null);

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center pb-12 relative">
            <div className="text-center mb-12">
                <h2 className="text-2xl font-black tracking-widest uppercase mb-4 text-[#1A1A1A] dark:text-white">Reflect</h2>
                <p className="text-gray-400 font-serif italic tracking-widest text-sm uppercase">Review your system</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4">
                <StatCard
                    title="Inbox"
                    icon={Inbox}
                    items={lists.inbox}
                    colorClass="text-blue-500"
                    emptyText="Empty"
                    onClick={() => setSelectedCategory({ title: 'Inbox', items: lists.inbox })}
                />
                <StatCard
                    title="Next Actions"
                    icon={CheckCircle}
                    items={lists.nextActions}
                    colorClass="text-green-500"
                    emptyText="Empty"
                    onClick={() => setSelectedCategory({ title: 'Next Actions', items: lists.nextActions })}
                />
                <StatCard
                    title="Waiting For"
                    icon={Bell}
                    items={lists.waitingFor}
                    colorClass="text-orange-400"
                    emptyText="Empty"
                    onClick={() => setSelectedCategory({ title: 'Waiting For', items: lists.waitingFor })}
                />
                <StatCard
                    title="Active Projects"
                    icon={Layers}
                    items={lists.projects}
                    colorClass="text-purple-500"
                    emptyText="Empty"
                    onClick={() => setSelectedCategory({ title: 'Active Projects', items: lists.projects })}
                />
                <StatCard
                    title="Someday / Maybe"
                    icon={Clock}
                    items={lists.someday}
                    colorClass="text-gray-400"
                    emptyText="Empty"
                    onClick={() => setSelectedCategory({ title: 'Someday / Maybe', items: lists.someday })}
                />
                <StatCard
                    title="Completed"
                    icon={CheckSquare}
                    items={lists.completed}
                    colorClass="text-blue-400"
                    emptyText="No completed items yet"
                    onClick={() => setSelectedCategory({ title: 'Completed', items: lists.completed })}
                />
            </div>

            {/* Expanded Modal */}
            <AnimatePresence>
                {selectedCategory && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCategory(null)}
                            className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-40"
                        />

                        {/* Modal Container */}
                        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                                className="bg-white dark:bg-monday-dark-bg w-full max-w-[600px] h-[600px] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col pointer-events-auto"
                            >
                                {/* Header */}
                                <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                                    <div>
                                        <h3 className="text-xl font-serif italic text-[#1A1A1A] dark:text-white mb-2">{selectedCategory.title}</h3>
                                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">{selectedCategory.items.length} Items</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* List */}
                                <div className="flex-1 overflow-y-auto p-8">
                                    {selectedCategory.items.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedCategory.items.map(item => (
                                                <div key={item.id} className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                                                    <div className="mt-1 w-2 h-2 rounded-full bg-gray-300 group-hover:bg-black dark:group-hover:bg-white transition-colors flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <h4 className="text-base text-gray-800 dark:text-gray-200 font-serif leading-snug mb-0.5">{item.title}</h4>
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-datetime">
                                                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 italic">
                                            <p>No items in this list.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
