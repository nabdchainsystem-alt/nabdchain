import React from 'react';
import { Tray as Inbox, CheckCircle as CheckCircle2, Stack as Layers, CheckSquare, Lightning as Zap } from 'phosphor-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../../contexts/AppContext';

export type GTDPhase = 'capture' | 'clarify' | 'organize' | 'reflect' | 'engage';

interface GTDTabsProps {
    activePhase: GTDPhase;
    onChange: (phase: GTDPhase) => void;
}

export const GTDTabs: React.FC<GTDTabsProps> = ({ activePhase, onChange }) => {
    const { t, language } = useAppContext();
    const isRTL = language === 'ar';
    const tabs: { id: GTDPhase; labelKey: string; icon: any }[] = [
        { id: 'capture', labelKey: 'capture', icon: Inbox },
        { id: 'clarify', labelKey: 'clarify', icon: CheckCircle2 },
        { id: 'organize', labelKey: 'organize', icon: Layers },
        { id: 'reflect', labelKey: 'reflect', icon: CheckSquare },
        { id: 'engage', labelKey: 'engage', icon: Zap },
    ];

    return (
        <div className="flex items-center justify-center gap-12">
            {tabs.map((tab) => {
                const isActive = activePhase === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            relative flex items-center gap-2 text-xs font-bold ${isRTL ? '' : 'tracking-[0.2em]'} transition-colors duration-300 uppercase
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
                        {t(tab.labelKey)}
                    </button>
                );
            })}
        </div>
    );
};
