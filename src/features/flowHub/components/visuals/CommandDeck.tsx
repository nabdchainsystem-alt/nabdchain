import React from 'react';
import { motion } from 'framer-motion';
import {
    Play, Pause, Zap,
    ZoomIn, ZoomOut, RotateCcw,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
    Maximize2
} from 'lucide-react';

interface CommandDeckProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    isPaused: boolean;
    onTogglePause: () => void;
    speed: 1 | 2 | 4;
    onToggleSpeed: () => void;
    onPan: (x: number, y: number) => void;
}

export const CommandDeck: React.FC<CommandDeckProps> = ({
    zoom, onZoomIn, onZoomOut, onReset,
    isPaused, onTogglePause,
    speed, onToggleSpeed,
    onPan,
}) => {
    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50"
        >
            <div className="flex items-center gap-2 p-2 px-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border border-white/20 ring-1 ring-black/5">

                {/* Navigation Group */}
                <div className="flex items-center gap-1 pr-4 border-r border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-1 w-[80px]">
                        <div />
                        <button onClick={() => onPan(0, 100)} className="btn-icon">
                            <ChevronUp size={14} />
                        </button>
                        <div />
                        <button onClick={() => onPan(100, 0)} className="btn-icon">
                            <ChevronLeft size={14} />
                        </button>
                        <div className="flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>
                        <button onClick={() => onPan(-100, 0)} className="btn-icon">
                            <ChevronRight size={14} />
                        </button>
                        <div />
                        <button onClick={() => onPan(0, -100)} className="btn-icon">
                            <ChevronDown size={14} />
                        </button>
                        <div />
                    </div>
                </div>

                {/* Playback Group */}
                <div className="flex items-center gap-2 px-2">
                    <button
                        onClick={onTogglePause}
                        className={`
                            flex items-center justify-center w-10 h-10 rounded-full transition-all
                            ${isPaused
                                ? 'bg-orange-50 text-orange-500 hover:bg-orange-100 ring-2 ring-orange-100'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200'}
                        `}
                    >
                        {isPaused ? <Play size={18} fill="currentColor" className="ml-0.5" /> : <Pause size={18} fill="currentColor" />}
                    </button>

                    <button
                        onClick={onToggleSpeed}
                        className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                        <Zap size={14} className={speed > 1 ? "text-yellow-500 fill-yellow-500" : ""} />
                        <span className="text-[9px] font-bold">{speed}x</span>
                    </button>
                </div>

                {/* View Group */}
                <div className="flex items-center gap-1 pl-4 border-l border-gray-200 dark:border-gray-700">
                    <button onClick={onZoomOut} className="btn-icon p-2">
                        <ZoomOut size={16} />
                    </button>
                    <span className="w-10 text-center text-xs font-mono text-gray-400 select-none">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={onZoomIn} className="btn-icon p-2">
                        <ZoomIn size={16} />
                    </button>
                    <button onClick={onReset} className="btn-icon p-2 text-gray-400 hover:text-gray-600">
                        <RotateCcw size={14} />
                    </button>
                </div>

            </div>

            <style jsx>{`
                .btn-icon {
                    @apply flex items-center justify-center p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hover:text-gray-800 dark:hover:text-gray-200;
                }
            `}</style>
        </motion.div>
    );
};
