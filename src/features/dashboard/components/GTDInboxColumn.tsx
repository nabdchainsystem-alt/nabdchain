import React from 'react';
import { motion } from 'framer-motion';

interface GTDInboxColumnProps {
    title: string;
    subtitle: string;
    count: number;
    delay?: number;
    children?: React.ReactNode;
}

export const GTDInboxColumn: React.FC<GTDInboxColumnProps> = ({ title, subtitle, count, delay = 0, children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            className="flex flex-col h-[400px] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 bg-white dark:bg-[#111111] shadow-[0_2px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:shadow-[0_8px_40px_-5px_rgba(0,0,0,0.1)] transition-all duration-500"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-xs font-bold tracking-[0.15em] text-[#1A1A1A] dark:text-white uppercase mb-1">{title}</h3>
                    <p className="text-xs font-serif italic text-gray-400">{subtitle}</p>
                </div>
                {count > 0 && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold">
                        {count}
                    </div>
                )}
                {count === 0 && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 text-xs font-bold">
                        0
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col items-start justify-start w-full text-gray-300 dark:text-gray-600">
                {children ? (
                    children
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] tracking-widest uppercase opacity-40">Empty</div>
                )}
            </div>

            {/* Subtle Texture */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-white/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
    );
};
