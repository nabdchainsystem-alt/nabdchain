import React from 'react';
import { ThumbsUp, ThumbsDown, ArrowRight, ArrowLeft, Layers, CheckCircle, User, Calendar, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GTDClarifyViewProps {
    items: { id: string; title: string; createdAt: number }[];
    initialItemId?: string | null;
    onProcess: (id: string, action: 'trash' | 'reference' | 'someday' | 'next' | 'project' | 'delegate' | 'scheduled' | 'done') => void;
}

export const GTDClarifyView: React.FC<GTDClarifyViewProps> = ({ items, initialItemId, onProcess }) => {
    // ... (rest of state items unchanged)
    const [currentIndex, setCurrentIndex] = React.useState(() => {
        if (initialItemId) {
            const index = items.findIndex(item => item.id === initialItemId);
            return index >= 0 ? index : 0;
        }
        return 0;
    });

    const [step, setStep] = React.useState<'decision' | 'non-actionable' | 'actionable'>('decision');

    // Clamp index when items array shrinks
    React.useEffect(() => {
        if (currentIndex >= items.length && items.length > 0) {
            setCurrentIndex(Math.max(0, items.length - 1));
        }
    }, [items.length, currentIndex]);

    const currentItem = items[currentIndex];

    // Safety check if no items
    if (!currentItem) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                    <ThumbsUp className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-3xl font-serif italic text-gray-800 dark:text-white mb-2">All Clear!</h2>
                <p className="text-gray-400">Your inbox is empty. Go capture more things.</p>
            </div>
        );
    }

    const handleNext = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setStep('decision');
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setStep('decision');
        }
    };

    const handleProcess = (action: 'trash' | 'reference' | 'someday' | 'next' | 'project' | 'delegate' | 'scheduled' | 'done') => {
        onProcess(currentItem.id, action);
        setStep('decision');
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-5xl font-black tracking-widest uppercase mb-8 text-[#1A1A1A] dark:text-white">Clarify</h2>

            {/* Item Card */}
            <div className="relative w-full mb-8 group">
                {/* Navigation Arrows */}
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 text-gray-300 hover:text-gray-600 dark:hover:text-white disabled:opacity-0 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentIndex === items.length - 1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 text-gray-300 hover:text-gray-600 dark:hover:text-white disabled:opacity-0 transition-all"
                >
                    <ArrowRight size={20} />
                </button>

                <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-[#111] rounded-[2rem] p-12 text-center shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-white/5 relative overflow-hidden"
                >
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest uppercase text-gray-300">
                        Item {currentIndex + 1} of {items.length}
                    </div>

                    <h3 className="text-3xl font-serif italic text-[#1A1A1A] dark:text-gray-100 mb-6 px-8 leading-tight">
                        "{currentItem.title || 'Untitled'}"
                    </h3>

                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">
                        <span>{new Date(currentItem.createdAt).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                        <span>,</span>
                        <span>{new Date(currentItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(currentItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </motion.div>
            </div>

            {/* Decision Area */}
            <AnimatePresence mode="wait">
                {step === 'decision' && (
                    <motion.div
                        key="decision"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full max-w-2xl bg-white dark:bg-[#111] rounded-[2rem] p-8 shadow-sm border border-gray-50 dark:border-white/5"
                    >
                        <h4 className="text-center font-serif italic text-lg text-gray-500 mb-8">Is this actionable?</h4>

                        <div className="grid grid-cols-2 gap-6">
                            <button
                                onClick={() => setStep('non-actionable')}
                                className="group flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-300"
                            >
                                <ThumbsDown className="w-6 h-6 text-gray-300 group-hover:text-red-500 mb-3 transition-colors" />
                                <span className="text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-red-500 mb-1">No</span>
                                <span className="text-[10px] text-center text-gray-400 group-hover:text-red-400">Trash, Reference, or Someday</span>
                            </button>

                            <button
                                onClick={() => setStep('actionable')}
                                className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-[#1A1A1A] dark:bg-white text-white dark:text-black shadow-xl hover:scale-[1.02] transition-all duration-300"
                            >
                                <ThumbsUp className="w-6 h-6 mb-3" />
                                <span className="text-base font-bold mb-1">Yes</span>
                                <span className="text-[10px] text-center opacity-60">Do, Delegate, Defer, or Project</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'non-actionable' && (
                    <motion.div
                        key="non-actionable"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full max-w-3xl bg-white dark:bg-[#111] rounded-[2rem] p-8 shadow-sm border border-gray-50 dark:border-white/5"
                    >
                        <h4 className="text-center font-serif italic text-lg text-gray-500 mb-8">Organize non-actionables</h4>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <button
                                onClick={() => handleProcess('trash')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-red-500 flex items-center justify-center mb-3 text-gray-400 group-hover:text-red-500 transition-colors">
                                    <Trash2Icon />
                                </div>
                                <span className="font-bold text-sm text-gray-800 dark:text-white mb-1">Trash</span>
                            </button>

                            <button
                                onClick={() => handleProcess('reference')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-blue-500 flex items-center justify-center mb-3 text-gray-400 group-hover:text-blue-500 transition-colors">
                                    <FileTextIcon />
                                </div>
                                <span className="font-bold text-sm text-gray-800 dark:text-white mb-1">Reference</span>
                                <span className="text-[10px] text-gray-400">File away for info</span>
                            </button>

                            <button
                                onClick={() => handleProcess('someday')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-orange-500 flex items-center justify-center mb-3 text-gray-400 group-hover:text-orange-500 transition-colors">
                                    <ClockIcon />
                                </div>
                                <span className="font-bold text-sm text-gray-800 dark:text-white mb-1">Someday / Maybe</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'actionable' && (
                    <motion.div
                        key="actionable"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full max-w-3xl bg-white dark:bg-[#111] rounded-[2rem] p-8 shadow-sm border border-gray-50 dark:border-white/5"
                    >
                        <h4 className="text-center font-serif italic text-lg text-gray-500 mb-8">What is the next step?</h4>

                        {/* Project Banner */}
                        <button
                            onClick={() => handleProcess('project')}
                            className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 p-4 rounded-xl flex items-center justify-between mb-6 group hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Layers size={16} />
                                </div>
                                <div className="text-left">
                                    <h5 className="font-bold text-sm text-blue-900 dark:text-blue-100">It's a Project</h5>
                                    <p className="text-[10px] text-blue-400 dark:text-blue-300">Requires multiple steps</p>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-blue-300 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Grid Options */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => handleProcess('done')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-green-500 flex items-center justify-center mb-3 text-gray-400 group-hover:text-green-500 transition-colors">
                                    <CheckCircle size={16} />
                                </div>
                                <span className="font-bold text-sm text-gray-800 dark:text-white mb-1">Do it (&lt; 2m)</span>
                                <span className="text-[10px] text-gray-400">Mark as Done</span>
                            </button>

                            <button
                                onClick={() => handleProcess('delegate')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-orange-400 flex items-center justify-center mb-3 text-gray-400 group-hover:text-orange-400 transition-colors">
                                    <User size={16} />
                                </div>
                                <span className="font-bold text-sm text-gray-800 dark:text-white mb-1">Delegate</span>
                            </button>

                            <button
                                onClick={() => handleProcess('next')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-purple-500 flex items-center justify-center mb-3 text-gray-400 group-hover:text-purple-500 transition-colors">
                                    <CheckSquare size={16} />
                                </div>
                                <span className="font-bold text-sm text-gray-800 dark:text-white mb-1">Next Actions</span>
                            </button>

                            <button
                                onClick={() => handleProcess('scheduled')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-blue-400 flex items-center justify-center mb-3 text-gray-400 group-hover:text-blue-400 transition-colors">
                                    <Calendar size={16} />
                                </div>
                                <span className="font-bold text-sm text-gray-800 dark:text-white mb-1">Defer (Calendar)</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

};

// Helper icons for the non-actionable section since I removed the SVGs to keep code clean
const Trash2Icon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const FileTextIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);
const ClockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
