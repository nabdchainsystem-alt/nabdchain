import React from 'react';
import { Inbox, CheckCircle2, Layers, CheckSquare, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export type GTDPhase = 'capture' | 'clarify' | 'organize' | 'reflect' | 'engage';

interface GTDTabsProps {
    activePhase: GTDPhase;
    onChange: (phase: GTDPhase) => void;
}

export const GTDTabs: React.FC<GTDTabsProps> = ({ activePhase, onChange }) => {
    const tabs: { id: GTDPhase; label: string; icon: any }[] = [
        { id: 'capture', label: 'CAPTURE', icon: Inbox },
        { id: 'clarify', label: 'CLARIFY', icon: CheckCircle2 },
        { id: 'organize', label: 'ORGANIZE', icon: Layers },
        { id: 'reflect', label: 'REFLECT', icon: CheckSquare },
        { id: 'engage', label: 'ENGAGE', icon: Zap },
    ];

    return (
        <div className="flex items-center justify-center gap-12 mb-10">
            {tabs.map((tab) => {
                const isActive = activePhase === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            relative flex items-center gap-2 text-xs font-bold tracking-[0.2em] transition-colors duration-300 uppercase
                            ${isActive ? 'text-[#1A1A1A] dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
                        `}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute -inset-x-4 -inset-y-2 bg-gray-100 dark:bg-white/5 rounded-full -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};
