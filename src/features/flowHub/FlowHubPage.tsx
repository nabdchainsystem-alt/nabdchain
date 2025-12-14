import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { InitialState } from './components/InitialState';
import {
    CaptureSystem,
    ClarifySystem,
    OrganizeSystem,
    PrioritySystem,
    FocusSystem,
    PlanningSystem,
    IdeaSystem,
    ReflectionSystem,
    ResetSystem
} from './components/SystemViews';

const FlowHubPage: React.FC = () => {
    // --- State ---
    const [mode, setMode] = useState<'initial' | 'system'>('initial');
    const [thought, setThought] = useState('');
    const [activeSystemId, setActiveSystemId] = useState<string | null>(null);

    // --- Handlers ---
    const handleStartConfig = (userThought: string, systemId: string) => {
        setThought(userThought);
        setActiveSystemId(systemId);
        setMode('system');
    };

    const handleExitSystem = () => {
        setMode('initial');
        // Optional: clear thought or keep it? 
        // "The page starts neutral, clean, and empty-feeling." -> maybe clear thought
        setThought('');
        setActiveSystemId(null);
    };

    // --- Render Helpers ---
    const renderSystem = () => {
        const props = { thought, onExit: handleExitSystem };

        switch (activeSystemId) {
            case 'capture': return <CaptureSystem {...props} />;
            case 'clarify': return <ClarifySystem {...props} />;
            case 'organize': return <OrganizeSystem {...props} />;
            case 'priority': return <PrioritySystem {...props} />;
            case 'focus': return <FocusSystem {...props} />;
            case 'plan': return <PlanningSystem {...props} />;
            case 'idea': return <IdeaSystem {...props} />;
            case 'reflect': return <ReflectionSystem {...props} />;
            case 'reset': return <ResetSystem {...props} />;
            default: return <div>Unknown System</div>;
        }
    };

    return (
        <div className="h-full w-full bg-[#F9FAFB] dark:bg-monday-dark-bg overflow-hidden relative">
            <AnimatePresence mode="wait">
                {mode === 'initial' ? (
                    <motion.div
                        key="initial"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="h-full w-full"
                    >
                        <InitialState onStartConfig={handleStartConfig} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="system"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="h-full w-full"
                    >
                        {renderSystem()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FlowHubPage;
