import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Check,
    X,
    ArrowRight,
    Clock,
    Calendar,
    Box,
    Layers,
    AlertCircle,
    PlayCircle,
    Plus,
    CornerDownLeft,
    Trash2,
    Sparkles,
    Send,
    PauseCircle
} from 'lucide-react';
import { useFocus } from '../../../contexts/FocusContext';
import { SYSTEMS } from '../data';

// --- Visual & Animation Components ---


interface SystemViewProps {
    thought: string;
    onExit: () => void;
    systemId?: string;
}

// Reusable invisible layout
const BaseSystemLayout: React.FC<SystemViewProps & { title?: string; children: React.ReactNode; sidebar?: React.ReactNode }> = ({
    thought,
    title,
    onExit,
    children,
    sidebar,
    systemId
}) => {
    return (
        <div className="flex h-full w-full">
            {/* Morphing Sidebar (Vertical Box) */}
            <motion.div
                layoutId={systemId ? `system-card-${systemId}` : undefined}
                className="w-20 lg:w-24 h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center py-8 z-20 shadow-sm relative overflow-hidden"
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1.2 }}
            >
                {/* Background Animation */}

                {/* System Icon */}
                <div className="mb-4 relative z-10 text-gray-900 dark:text-gray-100 flex flex-col items-center gap-2 mt-8">
                    {(() => {
                        const sys = SYSTEMS.find(s => s.id === systemId);
                        const Icon = sys?.icon;

                        if (!Icon) return null;

                        return (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                                className="p-2 bg-white/20 rounded-full backdrop-blur-sm shadow-sm ring-1 ring-black/5"
                            >
                                <Icon size={24} strokeWidth={1.5} />
                            </motion.div>
                        );
                    })()}
                </div>

                <div className="mb-8 relative z-10">
                    <button
                        onClick={onExit}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <motion.h2
                        layoutId={systemId ? `system-title-${systemId}` : undefined}
                        className="text-lg font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase rotate-180"
                        style={{ writingMode: 'vertical-rl' }}
                    >
                        {title}
                    </motion.h2>
                </div>
            </motion.div>

            {/* Main Content Area - Fades In */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.2 }}
                className="flex-1 flex h-full overflow-hidden relative"
            >
                <div className="flex-1 flex flex-col pt-8 pb-8 px-6 md:px-12 max-w-5xl mx-auto h-full overflow-hidden w-full">
                    {/* Content */}
                    <div className="flex-1 flex flex-col min-h-0 w-full">
                        {children}
                    </div>
                </div>

                {/* Internal Tool Sidebar (e.g. History) */}
                {sidebar && (
                    <div className="w-80 h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 hidden xl:flex flex-col">
                        {sidebar}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

// --- 1. Capture System (Redesigned) ---
export const CaptureSystem: React.FC<SystemViewProps> = (props) => {
    // Session State
    const [currentInput, setCurrentInput] = useState(props.thought || "");
    const [capturedItems, setCapturedItems] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);

    // Initial thought auto-capture if brief, otherwise load into editor
    useEffect(() => {
        // If the initial thought was "quick" (< 5 words), capture it immediately? 
        // For now, simpler: just populate input.
        // If empty init thought, focus is already on input.
    }, []);

    const handleCapture = () => {
        if (!currentInput.trim()) return;
        setCapturedItems(prev => [currentInput, ...prev]);
        setCurrentInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCapture();
        }
    };

    return (
        <BaseSystemLayout
            {...props}
            title="Rapid Capture"
            sidebar={
                <div className="h-full flex flex-col">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Session Log</h3>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        <AnimatePresence>
                            {capturedItems.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800 group relative"
                                >
                                    <p className="line-clamp-3">{item}</p>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {capturedItems.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-sm italic">
                                Captured thoughts will appear here...
                            </div>
                        )}
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-full items-center justify-center -mt-10">
                <div className="w-full max-w-2xl relative">
                    <label className="block text-sm font-medium text-gray-400 mb-4 ml-1">
                        What's on your mind? <span className="text-gray-300 font-light">(Press Enter to save)</span>
                    </label>

                    <div
                        className={`
                            relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm transition-all duration-200
                            border-2
                            ${isFocused
                                ? 'border-purple-100 dark:border-purple-900/30 shadow-md ring-4 ring-purple-50 dark:ring-purple-900/10'
                                : 'border-transparent hover:border-gray-100 dark:hover:border-gray-700'}
                        `}
                    >
                        <textarea
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-xl md:text-2xl leading-relaxed text-gray-800 dark:text-gray-100 resize-none font-sans min-h-[120px]"
                            placeholder="Type here..."
                            autoFocus
                        />

                        <div className="flex justify-between items-center mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                            <div className="flex gap-2">
                                {/* Prompt Chips */}
                                <button className="text-xs px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                                    Calls?
                                </button>
                                <button className="text-xs px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                                    Deadlines?
                                </button>
                                <button className="text-xs px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                                    Shopping?
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-300 font-mono">
                                    {currentInput.length > 0 ? `${currentInput.length} chars` : ''}
                                </span>
                                <button
                                    onClick={handleCapture}
                                    disabled={!currentInput.trim()}
                                    className={`
                                        p-2 rounded-full transition-all
                                        ${currentInput.trim()
                                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md transform hover:scale-105'
                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
                                    `}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-sm font-light">
                            "Your mind is for having ideas, not holding them." — <span className="italic">David Allen</span>
                        </p>
                    </div>
                </div>
            </div>
        </BaseSystemLayout>
    );
};

// --- 2. Clarify System (GTD Flow) ---
export const ClarifySystem: React.FC<SystemViewProps> = (props) => {
    const [step, setStep] = useState(0);

    const nextStep = () => setStep(s => s + 1);

    return (
        <BaseSystemLayout {...props} title="Clarify">
            <div className="flex flex-col h-full max-w-2xl mx-auto pt-10">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <h2 className="text-3xl font-light text-gray-800 dark:text-gray-100">Is this actionable?</h2>
                            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                                <p className="text-xl text-gray-600 dark:text-gray-300 italic">"{props.thought || 'Untitled Item'}"</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={nextStep} className="group flex flex-col items-center gap-3 px-6 py-8 rounded-2xl bg-white dark:bg-gray-800 border-2 border-transparent hover:border-blue-100 dark:hover:border-blue-900 shadow-sm hover:shadow-md transition-all">
                                    <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 group-hover:scale-110 transition-transform">
                                        <Check size={32} />
                                    </div>
                                    <span className="text-lg font-medium text-gray-800 dark:text-gray-100">Yes, do it</span>
                                </button>
                                <button onClick={props.onExit} className="group flex flex-col items-center gap-3 px-6 py-8 rounded-2xl bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                    <div className="p-4 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-500 group-hover:scale-110 transition-transform">
                                        <Box size={32} />
                                    </div>
                                    <span className="text-lg font-medium text-gray-800 dark:text-gray-100">No, file it</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <h2 className="text-2xl font-light text-gray-500">What is the very next physical action?</h2>
                            <input
                                type="text"
                                placeholder="e.g. Call Alice, Draft email..."
                                className="w-full text-3xl bg-transparent border-b border-gray-200 dark:border-gray-700 pb-2 focus:border-blue-500 outline-none"
                                autoFocus
                            />
                            <div className="flex gap-4 pt-4">
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setStep(0)}>Back</button>
                                <button className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg ml-auto">Create Action</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </BaseSystemLayout>
    );
};

// --- 3. Organize System ---
export const OrganizeSystem: React.FC<SystemViewProps> = (props) => (
    <BaseSystemLayout {...props} title="Organize">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-10">
            {[
                { label: 'Project', desc: 'Outcomes requiring multiple steps', icon: Layers },
                { label: 'Next Action', desc: 'Single physical tasks', icon: Check },
                { label: 'Waiting For', desc: 'Delegated / Pending', icon: Clock },
                { label: 'Someday/Maybe', desc: 'Ideas for the future', icon: Calendar },
            ].map(cat => (
                <button key={cat.label} className="flex gap-6 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-transparent hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-md transition-all text-left group">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                        <cat.icon size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">{cat.label}</h3>
                        <p className="text-gray-500 font-light">{cat.desc}</p>
                    </div>
                </button>
            ))}
        </div>
    </BaseSystemLayout>
);

// --- 4. Focus System ---
export const FocusSystem: React.FC<SystemViewProps> = (props) => {
    const { isActive, timeLeft, startFocus, stopFocus, formatTime } = useFocus();

    const handleToggle = () => {
        if (isActive) {
            stopFocus();
        } else {
            startFocus(25);
        }
    };

    return (
        <BaseSystemLayout {...props} title="Focus">
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-64 h-64 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center relative mb-12">
                    {isActive && (
                        <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full opacity-100 animate-spin" style={{ animationDuration: '4s' }} />
                    )}
                    {!isActive && (
                        <div className="absolute inset-0 border-t-2 border-gray-300 rounded-full opacity-20" />
                    )}
                    <span className="text-6xl font-light font-mono tabular-nums text-gray-800 dark:text-gray-100">
                        {formatTime(timeLeft)}
                    </span>
                </div>
                <button
                    onClick={handleToggle}
                    className={`
                        flex items-center gap-3 px-8 py-3 rounded-full shadow-lg transition-all
                        ${isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'}
                    `}
                >
                    {isActive ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                    <span className="font-medium tracking-wide">
                        {isActive ? 'End Session' : 'Enter Flow'}
                    </span>
                </button>
            </div>
        </BaseSystemLayout>
    );
};

// --- 5. Reset System ---
export const ResetSystem: React.FC<SystemViewProps> = (props) => (
    <BaseSystemLayout {...props} title="Reset">
        <div className="max-w-xl mx-auto space-y-12 text-center pt-10">
            <p className="text-2xl text-gray-500 font-light leading-relaxed">
                "Almost everything will work again if you unplug it for a few minutes, including you."
            </p>
            <div className="flex flex-col gap-4">
                <button className="w-full py-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-900/30 text-gray-600 hover:text-red-600 transition-all flex items-center justify-center gap-3 bg-white dark:bg-gray-800">
                    <AlertCircle size={20} />
                    <span>Clear non-essential tasks</span>
                </button>
                <button className="w-full py-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 transition-all bg-white dark:bg-gray-800">
                    Defer everything to tomorrow
                </button>
            </div>
        </div>
    </BaseSystemLayout>
);

// --- Placeholders for others using Base ---
export const PrioritySystem: React.FC<SystemViewProps> = (props) => (
    <BaseSystemLayout {...props} title="Priority">
        <p className="text-gray-500 text-xl font-light text-center mt-20">What is the single most important thing?</p>
        <div className="flex justify-center mt-10">
            <div className="w-24 h-24 bg-red-500 rounded-full animate-pulse opacity-20"></div>
        </div>
    </BaseSystemLayout>
);
export const PlanningSystem: React.FC<SystemViewProps> = (props) => <BaseSystemLayout {...props} title="Plan"><div className="h-full border-l border-gray-200 dark:border-gray-800 ml-8" /></BaseSystemLayout>;
export const IdeaSystem: React.FC<SystemViewProps> = (props) => <BaseSystemLayout {...props} title="Ideate"><div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 mt-10">Safe Harbor for Ideas</div></BaseSystemLayout>;
export const ReflectionSystem: React.FC<SystemViewProps> = (props) => <BaseSystemLayout {...props} title="Reflect"><textarea className="w-full h-full bg-transparent resize-none outline-none text-xl font-serif leading-loose text-gray-600 placeholder-gray-300 mt-10" placeholder="How did it go?" /></BaseSystemLayout>;
