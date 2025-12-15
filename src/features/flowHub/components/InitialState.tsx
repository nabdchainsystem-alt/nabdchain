import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeInput, AnalysisResult, getPlaceholders, getSuggestionBasedOnTime } from '../logic/intelligence';
import { SYSTEMS, getTypeColor } from '../data';
import {
    ArrowRight,
    Sparkles,
    Activity,
    History,
    Clock,
    Zap,
    MoveRight
} from 'lucide-react';

interface InitialStateProps {
    onStartConfig: (thought: string, state: string) => void;
}

export const InitialState: React.FC<InitialStateProps> = ({ onStartConfig }) => {
    // --- State ---
    const [thought, setThought] = useState('');
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
    const [suggestedSystemId, setSuggestedSystemId] = useState<string>('capture');

    // --- Effects ---
    // 1. Determine Suggested Path (Time-based for now, could be Usage-based)
    useEffect(() => {
        const timeBasedId = getSuggestionBasedOnTime();
        setSuggestedSystemId(timeBasedId);
    }, []);

    // 2. Input Analysis Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (thought.length > 2) {
                setAnalysis(analyzeInput(thought));
            } else {
                setAnalysis(null);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [thought]);

    // --- Derived State ---
    const activeResultId = analysis?.systemId || suggestedSystemId;

    // The "Dominant" card is the one focused OR the suggested one if none are focused.
    // However, if the user has typed enough to get an analysis result, THAT becomes dominant.
    const dominantCardId = focusedCardId || (analysis?.systemId ? analysis.systemId : suggestedSystemId);

    // Placeholder Logic
    const currentPlaceholder = getPlaceholders(focusedCardId || activeResultId);

    // --- Handlers ---
    const handleSubmit = (stateId: string) => {
        onStartConfig(thought, stateId);
    };

    return (
        <div className="flex flex-col h-full w-full font-sans text-gray-800 dark:text-gray-100 overflow-y-auto overflow-x-hidden relative selection:bg-blue-100 selection:text-blue-900">

            {/* Background Ambience (Subtle) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent rounded-full blur-3xl opacity-50" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full px-6 py-12 z-10">

                {/* 1. PRIMARY FOCUS AREA: The Input Anchor */}
                <div className="w-full max-w-2xl mx-auto mb-16 relative group">
                    <motion.div
                        layout
                        className={`
                            relative z-20 flex items-center gap-4 bg-white dark:bg-gray-800/80 backdrop-blur-xl 
                            rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 
                            transition-all duration-500 ease-out
                            ${focusedCardId ? 'w-[102%] -ml-[1%]' : 'w-full'}
                            ${thought ? 'shadow-md ring-1 ring-blue-500/20' : 'hover:shadow-md'}
                        `}
                    >
                        <input
                            type="text"
                            value={thought}
                            onChange={(e) => setThought(e.target.value)}
                            placeholder={currentPlaceholder}
                            className={`
                                flex-1 bg-transparent text-xl md:text-2xl font-medium 
                                text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 
                                outline-none transition-all duration-300 px-8 py-6
                                ${focusedCardId ? 'tracking-tight' : 'tracking-normal'}
                            `}
                            autoFocus
                        />
                        <div className="pr-4 pl-2">
                            <button
                                onClick={() => handleSubmit(dominantCardId)}
                                disabled={!thought && !dominantCardId}
                                className={`
                                    h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300
                                    ${thought
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 rotate-0 opacity-100'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 rotate-90 opacity-0 group-hover:opacity-100'}
                                `}
                            >
                                <ArrowRight size={20} activeIndex={0} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Passive System Line hanging below input */}
                    <div className="absolute -bottom-8 left-0 w-full text-center">
                        <AnimatePresence mode='wait'>
                            <motion.p
                                key={currentPlaceholder} // Use placeholder as a proxy for mode change to trigger animation
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="text-xs text-gray-400 font-medium tracking-wide uppercase opacity-60"
                            >
                                {focusedCardId ? SYSTEMS.find(s => s.id === focusedCardId)?.label : "Clarity before action"}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>

                {/* 2. SECONDARY GUIDANCE LAYER: System Mode Cards */}
                <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative">
                    {SYSTEMS.map(sys => {
                        const isSuggested = activeResultId === sys.id;
                        const isDominant = dominantCardId === sys.id;
                        const Icon = sys.icon;

                        // "Center of Gravity" scale
                        const scale = isDominant ? 1.05 : 1;
                        const opacity = !dominantCardId || isDominant ? 1 : 0.7; // Fade others slightly

                        return (
                            <motion.button
                                key={sys.id}
                                layoutId={`system-card-${sys.id}`}
                                onClick={() => handleSubmit(sys.id)}
                                onMouseEnter={() => setFocusedCardId(sys.id)}
                                onMouseLeave={() => setFocusedCardId(null)}
                                animate={{
                                    scale,
                                    opacity
                                }}
                                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }} // Soft purposeful ease
                                className={`
                                    group relative flex flex-col p-6 rounded-2xl text-left border h-48
                                    transition-all duration-300
                                    ${isDominant
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-500/5 z-10'
                                        : 'bg-white/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 shadow-sm hover:border-gray-200'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-4 w-full">
                                    <div className={`
                                        transition-colors duration-300
                                        ${isDominant ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                                    `}>
                                        <Icon size={28} strokeWidth={isDominant ? 2 : 1.5} />
                                    </div>
                                    <span className={`
                                        text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full transition-all
                                        ${isDominant ? 'bg-white dark:bg-gray-800 text-gray-500 shadow-sm' : 'opacity-0 group-hover:opacity-100 bg-gray-100 dark:bg-gray-700 text-gray-400'}
                                    `}>
                                        {sys.type}
                                    </span>
                                </div>

                                <div className="mt-auto relative z-10">
                                    <motion.h3
                                        layoutId={`system-title-${sys.id}`}
                                        className={`
                                            font-bold text-base mb-1 transition-colors duration-300
                                            ${isDominant ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
                                        `}
                                    >
                                        {sys.label}
                                    </motion.h3>
                                    <p className={`
                                        text-xs font-medium leading-relaxed transition-colors duration-300
                                        ${isDominant ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-gray-400'}
                                    `}>
                                        {sys.desc}
                                    </p>
                                </div>

                                {/* Micro-hint for Ready State */}
                                {thought && isDominant && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute bottom-4 right-4 text-blue-500"
                                    >
                                        <MoveRight size={16} />
                                    </motion.div>
                                )}

                                {/* Suggested Path Indicator */}
                                {isSuggested && !thought && !focusedCardId && (
                                    <div className="absolute top-4 right-4">
                                        <span className="flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* 3. PASSIVE AWARENESS LAYER: Memory */}
            <div className="w-full max-w-6xl mx-auto px-8 pb-8 pt-4">
                <div className="flex flex-col md:flex-row items-center justify-between opacity-60 hover:opacity-100 transition-opacity duration-500 border-t border-gray-100 dark:border-gray-800 pt-6">

                    {/* System Pulse */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                            <Activity size={14} className="text-green-500" />
                            <span>System Load: Low</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                            <Clock size={14} />
                            <span>Efficiency: 94%</span>
                        </div>
                    </div>

                    {/* Passive Line */}
                    <div className="hidden md:block text-xs font-medium text-gray-400 italic">
                        "Your flow adapts as you do."
                    </div>

                    {/* Memory Stats */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-right">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last</div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Clarify</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
                        <div className="flex items-center gap-2 text-right">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top</div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Focus Mode</div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};
