import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, ArrowCounterClockwise, X } from 'phosphor-react';
import { useFocus } from '../../contexts/FocusContext';
import { useAppContext } from '../../contexts/AppContext';

export const FocusMode: React.FC = () => {
    const { isActive, isSessionActive, timeLeft, toggleFocus, resetFocus, cancelFocus, formatTime, startFocus } = useFocus();
    const { t, dir } = useAppContext();

    const handleStart = () => {
        if (!isSessionActive) {
            startFocus(25);
        }
    };

    return (
        <motion.div
            layout="position"
            key={dir}
            className={`flex items-center h-8 transition-colors duration-300 overflow-hidden ${isSessionActive
                ? 'ps-1 pe-2 py-0.5'
                : 'rounded hover:bg-gray-100 dark:hover:bg-monday-dark-hover w-8 h-8 flex items-center justify-center'
                }`}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
            {/* Stable Icon Button */}
            <button
                onClick={handleStart}
                className={`flex items-center justify-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${isSessionActive
                    ? 'w-7 h-7 text-gray-600 dark:text-gray-300'
                    : 'w-5 h-5 text-gray-500 dark:text-monday-dark-text-secondary'
                    }`}
                disabled={isSessionActive}
                title={!isSessionActive ? (t('start_focus') || "Start Focus Session") : ""}
            >
                <Timer size={isSessionActive ? 20 : 21} weight={isSessionActive ? "light" : "light"} />
            </button>

            {/* Collapsible Content */}
            <motion.div
                initial={false}
                animate={{
                    width: isSessionActive ? 'auto' : 0,
                    opacity: isSessionActive ? 1 : 0
                }}
                transition={{
                    width: { type: "spring", stiffness: 500, damping: 30 },
                    opacity: { duration: 0.2 }
                }}
                style={{ overflow: 'hidden' }}
                className="flex items-center"
            >
                <div className="flex items-center whitespace-nowrap ps-2">
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-200 tabular-nums text-sm w-[46px] text-center select-none">
                        {formatTime(timeLeft)}
                    </span>

                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleFocus(); }}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                            title={isActive ? t('pause') : t('resume')}
                        >
                            {isActive ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); resetFocus(); }}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                            title={t('reset')}
                        >
                            <ArrowCounterClockwise size={14} weight="light" />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); cancelFocus(); }}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 hover:text-red-600 transition-colors"
                            title={t('cancel_session')}
                        >
                            <X size={14} weight="light" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
