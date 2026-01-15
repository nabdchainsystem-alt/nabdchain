import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Eraser, ArrowUp, Command, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NabdFab: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [note, setNote] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Load note from local storage on mount
    useEffect(() => {
        const savedNote = localStorage.getItem('nabd-quick-note');
        if (savedNote) {
            setNote(savedNote);
        }
    }, []);

    // Save note to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('nabd-quick-note', note);
    }, [note]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Slight delay to ensure animation has set up layout
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    // Handle global shortcut (Cmd+K or similar if desired, but for now just FAB)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleClear = () => {
        setNote('');
        localStorage.removeItem('nabd-quick-note');
        inputRef.current?.focus();
    };

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex items-center justify-end pointer-events-none gap-4">

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: 40 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: 40 }}
                        transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 25,
                            mass: 0.8
                        }}
                        className="pointer-events-auto origin-bottom-right"
                    >
                        <div className="
                            w-[600px] 
                            bg-white/80 dark:bg-[#0f1115]/80 
                            backdrop-blur-2xl 
                            border border-white/20 dark:border-white/5 
                            ring-1 ring-black/5 dark:ring-white/5
                            shadow-[0_24px_64px_-12px_rgba(0,0,0,0.14)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)]
                            rounded-2xl 
                            flex flex-col 
                            overflow-hidden
                        ">

                            {/* Input Area */}
                            <div className="relative flex flex-col px-5 pt-5 pb-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1.5 p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-400">
                                        <Search size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            ref={inputRef}
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="What's on your mind?"
                                            className="
                                                w-full bg-transparent border-0 p-0 
                                                text-xl font-medium tracking-tight text-gray-900 dark:text-white 
                                                placeholder:text-gray-400 dark:placeholder:text-gray-500 
                                                focus:ring-0 resize-none leading-relaxed
                                                selection:bg-indigo-100 dark:selection:bg-indigo-900/30
                                            "
                                            style={{ minHeight: '48px', maxHeight: '300px' }}
                                            rows={1}
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                target.style.height = 'auto';
                                                target.style.height = `${Math.min(target.scrollHeight, 300)}px`;
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Divider with glass effect */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent opacity-50" />

                            {/* Footer / Meta */}
                            <div className="px-3 py-2 bg-gray-50/50 dark:bg-[#15171c]/50 flex items-center justify-between">
                                <div className="flex items-center gap-2 px-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        <Sparkles size={10} />
                                        <span>Nabd AI</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {note.length > 0 && (
                                        <>
                                            <button
                                                onClick={handleClear}
                                                className="
                                                    flex items-center gap-1.5 px-2 py-1 rounded-md 
                                                    text-[11px] font-medium text-gray-500 dark:text-gray-400 
                                                    hover:bg-gray-200/50 dark:hover:bg-gray-700/50 
                                                    transition-colors
                                                "
                                            >
                                                <Eraser size={12} />
                                                <span>Clear</span>
                                            </button>
                                            <div className="w-px h-3 bg-gray-300 dark:bg-gray-700 mx-1" />
                                            <button
                                                className="
                                                    flex items-center gap-1.5 px-2.5 py-1 rounded-md 
                                                    text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 
                                                    bg-indigo-50 dark:bg-indigo-500/10 
                                                    hover:bg-indigo-100 dark:hover:bg-indigo-500/20
                                                    transition-colors
                                                "
                                            >
                                                <span>Run Action</span>
                                                <div className="flex items-center gap-0.5 opacity-60">
                                                    <Command size={10} />
                                                    <ArrowUp size={10} />
                                                </div>
                                            </button>
                                        </>
                                    )}
                                    {note.length === 0 && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-600 font-medium px-2">
                                            Type to start...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button - Refined */}
            <motion.button
                layout
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)" }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    pointer-events-auto 
                    group
                    relative
                    w-12 h-12
                    rounded-2xl
                    flex items-center justify-center 
                    transition-all duration-300 
                    z-50
                    backdrop-blur-md
                    ${isOpen
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner'
                        : 'bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-700'
                    }
                `}
                aria-label={isOpen ? "Close NABD Bar" : "Open NABD Bar"}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -45, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 45, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X size={20} strokeWidth={2} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                        >
                            {/* Iconic Sparkles with subtle coloring */}
                            <Sparkles
                                size={20}
                                strokeWidth={2}
                                className="text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};
