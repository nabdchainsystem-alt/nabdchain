import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'phosphor-react';

export const HeroSection: React.FC<{ onEnterSystem?: () => void }> = ({ onEnterSystem }) => {
    return (
        <section className="relative pt-32 pb-40 px-6 overflow-hidden">
            {/* Background Pattern - Subtle Circuit/Grid */}
            <div className="absolute inset-0 bg-[#FAFAFA] dark:bg-monday-dark-bg" />
            <div className="absolute inset-0 dark:opacity-20" style={{
                backgroundImage: `radial-gradient(#E5E7EB 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
            }} />

            {/* Central Content */}
            <div className="relative z-10 max-w-5xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-monday-dark-text mb-8 leading-[1.1]">
                        The Ultimate <br />
                        <span className="text-[#2563EB]">Nabd Chain System</span>
                    </h1>
                    <p className="text-xl text-zinc-500 dark:text-monday-dark-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
                        Advanced analytics, neural network integration, and global marketplace management. The complete operating system for modern data teams.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={onEnterSystem} className="h-12 px-8 rounded-xl bg-[#2563EB] text-white font-medium hover:bg-[#1d4ed8] transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5">
                            Enter System
                        </button>
                        <button className="h-12 px-8 rounded-xl bg-white dark:bg-monday-dark-surface text-zinc-600 dark:text-monday-dark-text-secondary font-medium
                        border border-zinc-200 dark:border-monday-dark-border hover:bg-zinc-50 dark:hover:bg-monday-dark-hover hover:text-zinc-900 dark:hover:text-monday-dark-text transition-all flex items-center gap-2 group">
                            <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-monday-dark-hover flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-monday-dark-border transition-colors">
                                <Play size={10} fill="currentColor" className="ml-0.5" />
                            </div>
                            View Feature Tour
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Background Decorations simulating the "connected lines" */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-monday-dark-border to-transparent" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200 dark:via-monday-dark-border to-transparent" />
        </section>
    );
};
