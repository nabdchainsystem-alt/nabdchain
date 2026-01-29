import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, ChartBar, SquaresFour, Sparkle } from 'phosphor-react';

const icons = [
    { icon: Table, label: "Building tables...", color: "text-zinc-700 dark:text-zinc-300" },
    { icon: ChartBar, label: "Generating charts...", color: "text-zinc-600 dark:text-zinc-400" },
    { icon: SquaresFour, label: "Preparing dashboard...", color: "text-zinc-800 dark:text-zinc-200" }
];

interface MorphingLoaderProps {
    className?: string;
    fullScreen?: boolean;
}

export const MorphingLoader: React.FC<MorphingLoaderProps> = ({ className = "", fullScreen = false }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % icons.length);
        }, 500); // Switch every 500ms (3 icons × 500ms = 1.5s total)
        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = icons[currentIndex].icon;

    const content = (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                {/* Background Glow */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`absolute inset-0 rounded-full blur-xl bg-gradient-to-tr from-zinc-400/20 to-zinc-600/20`}
                />

                {/* Animated Icon */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.5, rotateX: -90 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotateX: 90 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700 relative z-10"
                    >
                        <CurrentIcon size={32} weight="duotone" className={icons[currentIndex].color} />
                    </motion.div>
                </AnimatePresence>

                {/* Orbiting Sparkle */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 p-1 bg-white dark:bg-zinc-900 rounded-full shadow-lg border border-zinc-100 dark:border-zinc-700">
                        <Sparkle size={12} weight="fill" className="text-zinc-400 dark:text-zinc-500" />
                    </div>
                </motion.div>
            </div>

            {/* Text Label */}
            <div className="h-6 overflow-hidden relative w-full text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute w-full text-sm font-medium text-zinc-500 dark:text-zinc-400"
                    >
                        {icons[currentIndex].label}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
                {content}
            </div>
        );
    }

    return content;
};
