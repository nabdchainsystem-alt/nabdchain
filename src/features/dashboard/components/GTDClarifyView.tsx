import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ThumbsUp, ThumbsDown, ArrowRight, ArrowLeft, Layers, CheckCircle, User, Calendar as CalendarIcon, CheckSquare, ChevronLeft, ChevronRight, Clock, FileText, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GTDClarifyViewProps {
    items: { id: string; title: string; createdAt: number }[];
    initialItemId?: string | null;
    onProcess: (id: string, action: 'trash' | 'reference' | 'someday' | 'next' | 'project' | 'delegate' | 'scheduled' | 'done', date?: number) => void;
}

export const GTDClarifyView: React.FC<GTDClarifyViewProps> = ({ items, initialItemId, onProcess }) => {
    // ... state ...
    const [currentIndex, setCurrentIndex] = React.useState(() => {
        if (initialItemId) {
            const index = items.findIndex(item => item.id === initialItemId);
            return index >= 0 ? index : 0;
        }
        return 0;
    });

    const [step, setStep] = React.useState<'decision' | 'non-actionable' | 'actionable' | 'schedule'>('decision');
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

    // Reset selected date when entering schedule step
    React.useEffect(() => {
        if (step === 'schedule') {
            setSelectedDate(new Date());
        }
    }, [step]);

    // Clamp index
    React.useEffect(() => {
        if (currentIndex >= items.length && items.length > 0) {
            setCurrentIndex(Math.max(0, items.length - 1));
        }
    }, [items.length, currentIndex]);

    const currentItem = items[currentIndex];

    // Calendar Helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const calendarData = useMemo(() => {
        return getDaysInMonth(currentMonth);
    }, [currentMonth]);

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

    const handleProcess = (action: 'trash' | 'reference' | 'someday' | 'next' | 'project' | 'delegate' | 'scheduled' | 'done', date?: number) => {
        onProcess(currentItem.id, action, date);
        setStep('decision');
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setSelectedDate(newDate);
    };

    const changeMonth = (delta: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-4xl font-black tracking-widest uppercase mb-6 text-[#1A1A1A] dark:text-white">Clarify</h2>

            {/* Safety check if no items */}
            {!currentItem ? (
                <div className="flex flex-col items-center justify-center p-8 text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <ThumbsUp className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-serif italic text-gray-800 dark:text-white mb-2">All Clear!</h3>
                    <p className="text-sm text-gray-400">Your inbox is empty. Go capture more things.</p>
                </div>
            ) : (
                <>
                    {/* Item Card */}
                    <div className="relative w-full mb-6 group">
                        {/* Navigation Arrows */}
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 text-gray-300 hover:text-gray-600 dark:hover:text-white disabled:opacity-0 transition-all"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex === items.length - 1}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 text-gray-300 hover:text-gray-600 dark:hover:text-white disabled:opacity-0 transition-all"
                        >
                            <ArrowRight size={16} />
                        </button>

                        <motion.div
                            key={currentItem.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-[#111] rounded-3xl p-8 text-center shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-white/5 relative overflow-hidden"
                        >
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest uppercase text-gray-300">
                                Item {currentIndex + 1} of {items.length}
                            </div>

                            <h3 className="text-2xl font-serif italic text-[#1A1A1A] dark:text-gray-100 mb-4 px-4 leading-tight">
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
                                className="w-full max-w-xl bg-white dark:bg-[#111] rounded-3xl p-6 shadow-sm border border-gray-50 dark:border-white/5"
                            >
                                <h4 className="text-center font-serif italic text-base text-gray-500 mb-6">Is this actionable?</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setStep('non-actionable')}
                                        className="group flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-300"
                                    >
                                        <ThumbsDown className="w-5 h-5 text-gray-300 group-hover:text-red-500 mb-2 transition-colors" />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-red-500 mb-0.5">No</span>
                                        <span className="text-[10px] text-center text-gray-400 group-hover:text-red-400">Trash, Reference, or Someday</span>
                                    </button>

                                    <button
                                        onClick={() => setStep('actionable')}
                                        className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-[#1A1A1A] dark:bg-white text-white dark:text-black shadow-xl hover:scale-[1.02] transition-all duration-300"
                                    >
                                        <ThumbsUp className="w-5 h-5 mb-2" />
                                        <span className="text-sm font-bold mb-0.5">Yes</span>
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
                                className="w-full max-w-2xl bg-white dark:bg-[#111] rounded-3xl p-6 shadow-sm border border-gray-50 dark:border-white/5"
                            >
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <button onClick={() => setStep('decision')} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                        <ArrowLeft size={16} />
                                    </button>
                                    <h4 className="text-center font-serif italic text-base text-gray-500">Organize non-actionables</h4>
                                    <div className="w-4" /> {/* Spacer */}
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-2">
                                    <button
                                        onClick={() => handleProcess('trash')}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-gray-300 group-hover:border-red-500 flex items-center justify-center mb-2 text-gray-400 group-hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </div>
                                        <span className="font-bold text-xs text-gray-800 dark:text-white mb-0.5">Trash</span>
                                    </button>

                                    <button
                                        onClick={() => handleProcess('reference')}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-gray-300 group-hover:border-blue-500 flex items-center justify-center mb-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                                            <FileText size={16} />
                                        </div>
                                        <span className="font-bold text-xs text-gray-800 dark:text-white mb-0.5">Reference</span>
                                        <span className="text-[10px] text-gray-400 scale-90">File away for info</span>
                                    </button>

                                    <button
                                        onClick={() => handleProcess('someday')}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-gray-300 group-hover:border-orange-500 flex items-center justify-center mb-2 text-gray-400 group-hover:text-orange-500 transition-colors">
                                            <Clock size={16} />
                                        </div>
                                        <span className="font-bold text-xs text-gray-800 dark:text-white mb-0.5">Someday / Maybe</span>
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
                                className="w-full max-w-2xl bg-white dark:bg-[#111] rounded-3xl p-6 shadow-sm border border-gray-50 dark:border-white/5"
                            >
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <button onClick={() => setStep('decision')} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                        <ArrowLeft size={16} />
                                    </button>
                                    <h4 className="text-center font-serif italic text-base text-gray-500">What is the next step?</h4>
                                    <div className="w-4" /> {/* Spacer */}
                                </div>

                                {/* Project Banner */}
                                <button
                                    onClick={() => handleProcess('project')}
                                    className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 p-3 rounded-xl flex items-center justify-between mb-4 group hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-500">
                                            <Layers size={14} />
                                        </div>
                                        <div className="text-left">
                                            <h5 className="font-bold text-xs text-blue-900 dark:text-blue-100">It's a Project</h5>
                                            <p className="text-[10px] text-blue-400 dark:text-blue-300">Requires multiple steps</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-blue-300 group-hover:translate-x-1 transition-transform" />
                                </button>

                                {/* Grid Options */}
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <button
                                        onClick={() => handleProcess('done')}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-gray-300 group-hover:border-green-500 flex items-center justify-center mb-2 text-gray-400 group-hover:text-green-500 transition-colors">
                                            <CheckCircle size={14} />
                                        </div>
                                        <span className="font-bold text-xs text-gray-800 dark:text-white mb-0.5">Do it (&lt; 2m)</span>
                                        <span className="text-[10px] text-gray-400">Mark as Done</span>
                                    </button>

                                    <button
                                        onClick={() => handleProcess('delegate')}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-gray-300 group-hover:border-orange-400 flex items-center justify-center mb-2 text-gray-400 group-hover:text-orange-400 transition-colors">
                                            <User size={14} />
                                        </div>
                                        <span className="font-bold text-xs text-gray-800 dark:text-white mb-0.5">Delegate</span>
                                    </button>

                                    <button
                                        onClick={() => handleProcess('next')}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-gray-300 group-hover:border-purple-500 flex items-center justify-center mb-2 text-gray-400 group-hover:text-purple-500 transition-colors">
                                            <CheckSquare size={14} />
                                        </div>
                                        <span className="font-bold text-xs text-gray-800 dark:text-white mb-0.5">Next Actions</span>
                                    </button>
                                    <button
                                        onClick={() => setStep('schedule')}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-gray-300 group-hover:border-blue-400 flex items-center justify-center mb-2 text-gray-400 group-hover:text-blue-400 transition-colors">
                                            <CalendarIcon size={14} />
                                        </div>
                                        <span className="font-bold text-xs text-gray-800 dark:text-white mb-0.5">Defer (Calendar)</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'schedule' && (
                            <motion.div
                                key="schedule"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-3xl max-h-[500px] bg-white dark:bg-[#111] rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col md:flex-row relative"
                            >
                                {/* LEFT SIDEBAR - Quick Actions */}
                                <div className="w-full md:w-48 bg-gray-50/50 dark:bg-black/20 border-r border-gray-100 dark:border-white/5 flex flex-col">
                                    <div className="p-3 flex-1 overflow-y-auto space-y-1">
                                        {[
                                            { label: 'Today', date: new Date(), sub: new Date().toLocaleDateString('en-US', { weekday: 'short' }) },
                                            { label: 'Tomorrow', date: new Date(Date.now() + 86400000), sub: new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short' }) },
                                            { label: 'Next week', date: new Date(Date.now() + 7 * 86400000), sub: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
                                            { label: 'Next weekend', date: (() => { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7); return d; })(), sub: (() => { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); })() },
                                            { label: '2 weeks', date: new Date(Date.now() + 14 * 86400000), sub: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
                                            { label: '4 weeks', date: new Date(Date.now() + 28 * 86400000), sub: new Date(Date.now() + 28 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
                                        ].map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedDate(option.date);
                                                    setCurrentMonth(new Date(option.date));
                                                }}
                                                className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between group transition-colors ${selectedDate && option.date.toDateString() === selectedDate.toDateString()
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                    : 'hover:bg-gray-200 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className={`text-xs font-medium ${selectedDate && option.date.toDateString() === selectedDate.toDateString() ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>{option.label}</span>
                                                <span className={`text-[10px] ${selectedDate && option.date.toDateString() === selectedDate.toDateString() ? 'text-blue-400 dark:text-blue-300' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>{option.sub}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-gray-100 dark:border-white/5">
                                        <button className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors">
                                            <span>Set Recurring</span>
                                            <ArrowRight size={12} className="opacity-50" />
                                        </button>
                                    </div>
                                </div>

                                {/* RIGHT CONTENT - Calendar */}
                                <div className="flex-1 p-5 flex flex-col">
                                    {/* Close Button Mobile / Desktop Absolute */}
                                    <button
                                        onClick={() => setStep('actionable')}
                                        className="absolute right-3 top-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>

                                    {/* Inputs Mockup */}
                                    <div className="flex gap-3 mb-6 pr-8">
                                        <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-lg flex items-center px-2.5 py-1.5 gap-2 opacity-50 cursor-not-allowed">
                                            <CalendarIcon size={14} className="text-gray-400" />
                                            <span className="text-xs text-gray-400 font-medium">Start date</span>
                                        </div>
                                        <div className="flex-1 bg-white dark:bg-black/20 border border-blue-100 dark:border-blue-500/30 rounded-lg flex items-center px-2.5 py-1.5 gap-2 shadow-sm">
                                            <CalendarIcon size={14} className="text-blue-500" />
                                            <span className="text-xs font-bold text-gray-800 dark:text-white">
                                                {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Due date'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Calendar Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-bold text-gray-900 dark:text-white font-serif">
                                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </span>
                                            <button
                                                onClick={() => setCurrentMonth(new Date())}
                                                className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                Today
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500">
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500">
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Grid */}
                                    <div className="flex-1">
                                        <div className="grid grid-cols-7 mb-2 text-center">
                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                                <div key={day} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                                            {Array.from({ length: calendarData.firstDay }).map((_, i) => (
                                                <div key={`empty-${i}`} />
                                            ))}
                                            {Array.from({ length: calendarData.days }).map((_, i) => {
                                                const day = i + 1;
                                                const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                                const isToday = d.toDateString() === new Date().toDateString();
                                                const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();

                                                return (
                                                    <div key={day} className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleDateClick(day)}
                                                            className={`
                                                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200
                                                                ${isSelected
                                                                    ? 'bg-blue-500 text-white shadow-lg scale-110'
                                                                    : isToday
                                                                        ? 'bg-red-50 text-red-500 border border-red-200 dark:bg-red-900/20 dark:border-red-500/30'
                                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                                                                }
                                                            `}
                                                        >
                                                            {day}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-2">
                                        <button
                                            onClick={() => setStep('actionable')}
                                            className="px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-xs font-bold text-gray-500 transition-colors uppercase tracking-wider"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedDate) {
                                                    handleProcess('scheduled', selectedDate.getTime());
                                                }
                                            }}
                                            disabled={!selectedDate}
                                            className="px-4 py-1.5 bg-[#1A1A1A] dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
};
