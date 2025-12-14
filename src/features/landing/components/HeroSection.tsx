import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
    onEnterSystem: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onEnterSystem }) => {
    const { scrollY } = useScroll();
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
    const heroY = useTransform(scrollY, [0, 500], [0, 100]);

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
            <motion.div
                style={{ opacity: heroOpacity, y: heroY }}
                className="relative z-10 max-w-5xl mx-auto text-center"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-blue-200 mb-8 backdrop-blur-md"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    SYSTEM V3.0 ONLINE
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85]"
                >
                    <span className="block text-white">CONTROL</span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-600">
                        EVERYTHING
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12"
                >
                    The ultimate operating system for modern enterprises.
                    Unify your data, workflow, and teams in one monochromatic ecosystem.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <button
                        onClick={onEnterSystem}
                        className="group relative px-8 py-4 rounded-xl bg-white text-black text-lg font-bold overflow-hidden transition-all hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-2">
                            Start Access
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    <button className="px-8 py-4 rounded-xl bg-white/5 text-white border border-white/10 text-lg font-bold hover:bg-white/10 transition-all backdrop-blur-sm">
                        View Documentation
                    </button>
                </motion.div>
            </motion.div>

            {/* Hero 3D Abstract Element */}
            <div className="absolute inset-x-0 bottom-0 h-[400px] w-full perspective-1000 overflow-hidden opacity-30 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent z-10" />
                <motion.div
                    animate={{ backgroundPosition: ["0% 0%", "0% 100%"] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-full h-[200%] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [transform:rotateX(60deg)_translateY(-20%)]"
                />
            </div>
        </section>
    );
};
