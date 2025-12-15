
import React from 'react';
import { useFocus } from '../../../contexts/FocusContext';
import { Target, X, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FocusWidget: React.FC = () => {
    const { isActive, timeLeft, stopFocus, formatTime } = useFocus();

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-4 p-2 pl-4 bg-gray-900 dark:bg-white rounded-full shadow-xl text-white dark:text-gray-900 border border-gray-800 dark:border-gray-200"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></span>
                            <Target size={16} className="text-blue-400 dark:text-blue-600 relative z-10" />
                        </div>
                        <span className="font-mono font-medium text-lg tracking-wider tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <button
                        onClick={stopFocus}
                        className="p-1.5 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100/50 transition-colors text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-gray-900"
                        title="End Session"
                    >
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
