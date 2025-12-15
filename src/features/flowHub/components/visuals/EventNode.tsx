import React from 'react';
import { motion } from 'framer-motion';
import { FlowNode } from '../../visualLogic';

interface EventNodeProps {
    node: FlowNode;
    onClick: (node: FlowNode) => void;
    showDetails: boolean;
}

export const EventNode: React.FC<EventNodeProps> = ({ node, onClick, showDetails }) => {
    const isNeutral = node.type === 'neutral';
    const isActive = node.type === 'active';
    const isCompleted = node.type === 'completed';
    const isBlocked = node.type === 'blocked';

    // Base styles
    let baseColor = 'bg-gray-300 dark:bg-gray-600';
    let ringColor = 'ring-transparent';

    if (isActive) {
        baseColor = 'bg-blue-500';
        ringColor = 'ring-blue-400/30';
    } else if (isCompleted) {
        baseColor = 'bg-gray-800 dark:bg-gray-200';
    } else if (isBlocked) {
        baseColor = 'bg-red-400';
    }

    // Label styles
    const labelColor = isActive
        ? 'text-blue-600 dark:text-blue-400 font-bold'
        : isCompleted
            ? 'text-gray-500 dark:text-gray-400 font-semibold'
            : 'text-gray-300 dark:text-gray-600 font-medium';

    // Smooth transition for labels
    const labelOpacity = isNeutral ? 'opacity-0 group-hover:opacity-100' : 'opacity-100';

    return (
        <div className="relative group z-10 hover:z-50" style={{ pointerEvents: 'auto' }}>
            {/* Context Tooltip (Hover) - Moved DOWN to avoid overlapping header */}
            {showDetails && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                    {/* Arrow pointing UP */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 transform rotate-45 mb-[-5px] z-10"></div>

                    <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg px-4 py-3 text-xs z-20">
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-0.5">{node.label}</div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium tracking-wide text-[10px] uppercase">
                            <span>{node.details?.entity}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>{node.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* The Dot */}
            <motion.button
                onClick={() => onClick(node)}
                layoutId={`node-${node.id}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.2 }}
                className={`
                    w-4 h-4 rounded-full relative z-10 transition-colors duration-300
                    ${baseColor}
                    ${isActive ? 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}
                `}
            >
                {/* Pulse Ring for Active */}
                {isActive && (
                    <motion.span
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-blue-400"
                    />
                )}
            </motion.button>

            {/* Persistent Label (Refined Design) */}
            <div className={`
                absolute top-8 left-1/2 -translate-x-1/2 w-32 text-center pointer-events-none transition-all duration-500
                text-[10px] tracking-widest uppercase font-sans leading-tight
                ${labelColor} ${labelOpacity}
            `}>
                {node.label}
            </div>
        </div >
    );
};
