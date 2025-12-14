import React, { useState } from 'react';
import { Coffee, CheckCircle, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface EngageItem {
    id: string;
    title: string;
    createdAt: number;
}

interface GTDEngageViewProps {
    nextActions: EngageItem[];
    onComplete: (id: string) => void;
    onDelete: (id: string) => void;
}

export const GTDEngageView: React.FC<GTDEngageViewProps> = ({ nextActions, onComplete, onDelete }) => {
    const [filter, setFilter] = useState<'all' | 'completed'>('all');

    // For now, we only show active items in 'all'. 'completed' would need a separate list or state.
    // Assuming 'onComplete' moves them out of nextActions.

    return (

        <div className="w-full max-w-3xl mx-auto flex flex-col items-center pb-12">
            <div className="text-center mb-8">
                <h2 className="text-5xl font-black tracking-widest uppercase mb-8 text-[#1A1A1A] dark:text-white">Engage</h2>

                {/* Filter Tabs */}
                <div className="inline-flex items-center gap-1 p-1 bg-[#1A1A1A] dark:bg-white/10 rounded-full">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filter === 'all'
                            ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filter === 'completed'
                            ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Completed
                    </button>
                </div>
            </div>

            <div className="w-full">
                <AnimatePresence mode="wait">
                    {filter === 'all' && (
                        <motion.div
                            key="all"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full"
                        >
                            {nextActions.length > 0 ? (
                                <div className="space-y-3">
                                    {nextActions.map(item => (
                                        <div key={item.id} className="bg-white dark:bg-[#111] p-4 rounded-2xl flex items-center justify-between group border border-gray-100 dark:border-white/5 hover:border-green-500/50 transition-colors">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <button
                                                    onClick={() => onComplete(item.id)}
                                                    className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all flex-shrink-0"
                                                />
                                                <span className="text-base font-serif italic text-gray-800 dark:text-gray-200 truncate">{item.title}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest hidden sm:block">Next Action</span>
                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                    <Coffee className="w-10 h-10 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-serif italic text-gray-400 mb-2">Nothing here.</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Check other tabs or enjoy your break.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {filter === 'completed' && (
                        <motion.div
                            key="completed"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full flex justify-center py-20 opacity-50"
                        >
                            <div className="text-center">
                                <CheckCircle className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
                                <h3 className="text-xl font-serif italic text-gray-400 mb-2">No completed items yet.</h3>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Get to work!</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
