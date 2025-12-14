import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeInput, AnalysisResult } from '../logic/intelligence';
import {
    ArrowRight,
    Sparkles,
    Zap,
    Target,
    Calendar,
    Layers,
    Lightbulb,
    PenTool,
    RotateCw,
    Search,
    Clock,
    CheckCircle2
} from 'lucide-react';

interface InitialStateProps {
    onStartConfig: (thought: string, state: string) => void;
}

const SYSTEMS = [
    { id: 'capture', label: 'Clear Mind', icon: PenTool, desc: 'Capture thoughts freely' },
    { id: 'focus', label: 'Focus Mode', icon: Target, desc: 'Deep work timer' },
    { id: 'plan', label: 'Planning', icon: Calendar, desc: 'Schedule & timeline' },
    { id: 'organize', label: 'Organize Work', icon: Layers, desc: 'Projects & tasks' },
    { id: 'clarify', label: 'Thinking Space', icon: Search, desc: 'Analyze & clarify' },
    { id: 'reflect', label: 'Reflection', icon: RotateCw, desc: 'Review progress' },
    { id: 'idea', label: 'Ideas', icon: Lightbulb, desc: 'Incubate concepts' },
    { id: 'reset', label: 'Stuck Mode', icon: Zap, desc: 'Unblock & reset' },
];

export const InitialState: React.FC<InitialStateProps> = ({ onStartConfig }) => {
    const [thought, setThought] = useState('');
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

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

    const handleSubmit = (stateId: string) => {
        onStartConfig(thought, stateId);
    };

    const recommendedId = analysis?.systemId;

    return (
        <div className="flex h-full w-full font-sans text-gray-800 dark:text-gray-100 p-8 gap-8">

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto">

                {/* 1. Header */}
                <div className="mb-10">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">Flow Hub</h1>
                    <p className="text-gray-500 text-sm font-medium">Start here. Decide how you want to work.</p>
                </div>

                {/* 2. Input Zone - Active Work Bench */}
                <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 pl-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-12">
                    <input
                        type="text"
                        value={thought}
                        onChange={(e) => setThought(e.target.value)}
                        placeholder="Type a thought, task, or idea..."
                        className="flex-1 bg-transparent text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none"
                        autoFocus
                    />
                    <button
                        onClick={() => {
                            if (analysis) handleSubmit(analysis.systemId);
                        }}
                        disabled={!thought}
                        className={`
                    px-6 py-2.5 rounded-md font-medium text-sm transition-all flex items-center gap-2
                    ${thought
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}
                `}
                    >
                        {analysis ? (
                            <>
                                <Sparkles size={16} />
                                <span>{analysis.suggestion.split(' ').slice(0, 3).join(' ')}...</span>
                            </>
                        ) : (
                            <span>Start</span>
                        )}
                        <ArrowRight size={16} />
                    </button>
                </div>

                {/* 3. System Selection Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 content-start">
                    {SYSTEMS.map(sys => {
                        const isRecommended = recommendedId === sys.id;
                        const Icon = sys.icon;

                        return (
                            <button
                                key={sys.id}
                                onClick={() => handleSubmit(sys.id)}
                                className={`
                            relative flex flex-col p-5 rounded-lg border text-left transition-all duration-200 group
                            ${isRecommended
                                        ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'}
                        `}
                            >
                                <div className={`mb-3 ${isRecommended ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                                    <Icon size={24} strokeWidth={1.5} />
                                </div>
                                <h3 className={`font-semibold text-sm mb-1 ${isRecommended ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {sys.label}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                    {sys.desc}
                                </p>

                                {isRecommended && (
                                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 shadow-sm animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>

            </div>

            {/* 4. Context Sidebar (Right) */}
            <div className="hidden xl:flex w-64 flex-col border-l border-gray-200 dark:border-gray-700 pl-8 pt-2">
                <div className="mb-8">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Memory</h4>
                    <div className="space-y-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">Last Session</div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Weekly Review</div>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">Pending</div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                                <span className="w-2 h-2 rounded-full bg-orange-400" />
                                3 items in Inbox
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">System Status</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span>All systems operational</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <Clock size={16} className="text-gray-400" />
                        <span>Focus Efficiency: 85%</span>
                    </div>
                </div>
            </div>

        </div>
    );
};
