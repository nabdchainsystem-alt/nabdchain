import { ZoomIn, ZoomOut, RotateCcw, Play, Pause, Zap, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProcessMapControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    isPaused: boolean;
    onTogglePause: () => void;
    speed: 1 | 2 | 4;
    onToggleSpeed: () => void;
    showDetails: boolean;
    onToggleDetails: () => void;
    onPan: (x: number, y: number) => void;
}

export const ProcessMapControls: React.FC<ProcessMapControlsProps> = ({
    zoom,
    onZoomIn,
    onZoomOut,
    onReset,
    isPaused,
    onTogglePause,
    speed,
    onToggleSpeed,
    showDetails,
    onToggleDetails,
    onPan
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-10 right-12 z-50 flex items-center gap-4 bg-white dark:bg-monday-dark-surface p-2 rounded-xl shadow-lg border border-gray-100 dark:border-monday-dark-border"
        >
            {/* Pan Controls */}
            <div className="grid grid-cols-3 gap-1 mr-2 border-r border-gray-100 dark:border-gray-700 pr-4">
                <div />
                <button onClick={() => onPan(0, 100)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500">
                    <div className="rotate-180"><Play size={10} fill="currentColor" /></div>
                </button>
                <div />
                <button onClick={() => onPan(100, 0)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500">
                    <div className="rotate-180"><Play size={10} fill="currentColor" /></div>
                </button>
                <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800" />
                <button onClick={() => onPan(-100, 0)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500">
                    <Play size={10} fill="currentColor" />
                </button>
                <div />
                <button onClick={() => onPan(0, -100)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500">
                    <div className="-rotate-90"><Play size={10} fill="currentColor" /></div>
                </button>
                <div />
            </div>

            <div className="flex items-center gap-1 border-r border-gray-100 dark:border-gray-700 pr-4 mr-1">
                <button
                    onClick={onTogglePause}
                    className={`p-2 rounded-lg transition-colors ${isPaused ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    title={isPaused ? "Resume Simulation" : "Pause Simulation"}
                >
                    {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                </button>
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                <button
                    onClick={onToggleSpeed}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 flex items-center gap-1 font-semibold text-xs min-w-[3rem] justify-center"
                    title="Simulation Speed"
                >
                    <Zap size={14} className={speed > 1 ? "text-yellow-500 fill-yellow-500" : ""} />
                    {speed}x
                </button>
                <button
                    onClick={onToggleDetails}
                    className={`p-2 rounded-lg transition-colors ${showDetails ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    title="Toggle Details"
                >
                    {showDetails ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
            </div>

            <div className="flex items-center gap-2 pl-4 border-l border-gray-100 dark:border-gray-700 ml-1">
                <button
                    onClick={onZoomOut}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                >
                    <ZoomOut size={18} />
                </button>
                <div className="w-12 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 select-none">
                    {Math.round(zoom * 100)}%
                </div>
                <button
                    onClick={onZoomIn}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                >
                    <ZoomIn size={18} />
                </button>
                <button
                    onClick={onReset}
                    className="ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                    title="Reset View"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
        </motion.div>
    );
};
