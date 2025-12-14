import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, ArrowRight, Clock, Calendar, Box, Layers, AlertCircle, PlayCircle, Plus } from 'lucide-react';

interface SystemViewProps {
    thought: string;
    onExit: () => void;
}

// Reusable invisible layout
const BaseSystemLayout: React.FC<SystemViewProps & { title?: string; children: React.ReactNode }> = ({
    thought,
    title,
    onExit,
    children,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto h-full flex flex-col pt-12 pb-8 px-6 md:px-0"
        >
            {/* Invisible Navbar */}
            <div className="flex items-center justify-between mb-16 opacity-50 hover:opacity-100 transition-opacity">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-light">Back</span>
                </button>
                {title && <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{title} MODE</span>}
            </div>

            {/* Main Content Area - No Cards */}
            <div className="flex-1 flex flex-col">
                {/* The Original Thought - As Context, not data */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-normal text-gray-900 dark:text-gray-100 leading-tight">
                        {thought || "Untitled Thought"}
                    </h1>
                </div>

                <div className="flex-1">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

// --- 1. Capture System ---
export const CaptureSystem: React.FC<SystemViewProps> = (props) => (
    <BaseSystemLayout {...props} title="Capture">
        <div className="relative h-full flex flex-col">
            <textarea
                className="w-full flex-1 bg-transparent border-none focus:ring-0 p-0 text-xl md:text-2xl leading-relaxed text-gray-600 dark:text-gray-300 resize-none placeholder-gray-300 dark:placeholder-gray-700 font-serif"
                placeholder="Expand on this... allow your mind to wander..."
                autoFocus
            />
            <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#FAFAFA] dark:from-monday-dark-bg to-transparent pointer-events-none" />
        </div>
    </BaseSystemLayout>
);

// --- 2. Clarify System (GTD Flow) ---
export const ClarifySystem: React.FC<SystemViewProps> = (props) => {
    const [step, setStep] = useState(0);

    const nextStep = () => setStep(s => s + 1);

    return (
        <BaseSystemLayout {...props} title="Clarify">
            <div className="flex flex-col h-full max-w-2xl">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <h2 className="text-2xl font-light text-gray-500">Is this actionable?</h2>
                            <div className="flex gap-4">
                                <button onClick={nextStep} className="group flex items-center gap-3 px-6 py-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all">
                                    <Check size={20} />
                                    <span className="text-lg">Yes, it demands action</span>
                                </button>
                                <button onClick={props.onExit} className="group flex items-center gap-3 px-6 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                                    <Box size={20} />
                                    <span className="text-lg">No, file it for later</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
            {[
                { label: 'Project', desc: 'Outcomes requiring multiple steps', icon: Layers },
                { label: 'Next Action', desc: 'Single physical tasks', icon: Check },
                { label: 'Waiting For', desc: 'Delegated / Pending', icon: Clock },
                { label: 'Someday/Maybe', desc: 'Ideas for the future', icon: Calendar },
            ].map(cat => (
                <button key={cat.label} className="flex gap-6 p-6 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all text-left group">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                        <cat.icon size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl text-gray-800 dark:text-gray-200 mb-1">{cat.label}</h3>
                        <p className="text-gray-500 font-light">{cat.desc}</p>
                    </div>
                </button>
            ))}
        </div>
    </BaseSystemLayout>
);

// --- 4. Focus System ---
export const FocusSystem: React.FC<SystemViewProps> = (props) => (
    <BaseSystemLayout {...props} title="Focus">
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="w-64 h-64 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center relative mb-12">
                <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full opacity-20 animate-spin transition-all duration-[10s]" />
                <span className="text-6xl font-light font-mono tabular-nums text-gray-800 dark:text-gray-100">25:00</span>
            </div>
            <button className="flex items-center gap-3 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:opacity-90 transition-opacity">
                <PlayCircle size={20} />
                <span className="font-medium tracking-wide">Enter Flow</span>
            </button>
        </div>
    </BaseSystemLayout>
);

// --- 5. Reset System ---
export const ResetSystem: React.FC<SystemViewProps> = (props) => (
    <BaseSystemLayout {...props} title="Reset">
        <div className="max-w-xl mx-auto space-y-12 text-center">
            <p className="text-2xl text-gray-500 font-light leading-relaxed">
                "Almost everything will work again if you unplug it for a few minutes, including you."
            </p>
            <div className="flex flex-col gap-4">
                <button className="w-full py-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-900/30 text-gray-600 hover:text-red-600 transition-all flex items-center justify-center gap-3">
                    <AlertCircle size={20} />
                    <span>Clear non-essential tasks</span>
                </button>
                <button className="w-full py-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all">
                    Defer everything to tomorrow
                </button>
            </div>
        </div>
    </BaseSystemLayout>
);

// --- Placeholders for others using Base ---
export const PrioritySystem: React.FC<SystemViewProps> = (props) => (
    <BaseSystemLayout {...props} title="Priority">
        <p className="text-gray-500 text-xl font-light">What is the single most important thing?</p>
        {/* Simplified Priority Matrix logic here */}
    </BaseSystemLayout>
);
export const PlanningSystem: React.FC<SystemViewProps> = (props) => <BaseSystemLayout {...props} title="Plan"><div className="h-full border-l border-gray-200 dark:border-gray-800 ml-8" /></BaseSystemLayout>;
export const IdeaSystem: React.FC<SystemViewProps> = (props) => <BaseSystemLayout {...props} title="Ideate"><div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400">Safe Harbor for Ideas</div></BaseSystemLayout>;
export const ReflectionSystem: React.FC<SystemViewProps> = (props) => <BaseSystemLayout {...props} title="Reflect"><textarea className="w-full h-full bg-transparent resize-none outline-none text-xl font-serif leading-loose text-gray-600 placeholder-gray-300" placeholder="How did it go?" /></BaseSystemLayout>;
