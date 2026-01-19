import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowRight, Play, Sparkle, ChartLineUp, Users, Buildings, Lightning } from 'phosphor-react';

const FloatingOrb: React.FC<{ delay: number; size: number; x: number; y: number; color: string }> = ({ delay, size, x, y, color }) => (
    <motion.div
        className="absolute rounded-full blur-3xl opacity-20"
        style={{
            width: size,
            height: size,
            left: `${x}%`,
            top: `${y}%`,
            background: color,
        }}
        animate={{
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            ease: "easeInOut"
        }}
    />
);

const AnimatedCounter: React.FC<{ value: number; suffix: string; label: string }> = ({ value, suffix, label }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = animate(count, value, { duration: 2.5, ease: "easeOut" });
        const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
        return () => {
            controls.stop();
            unsubscribe();
        };
    }, [value, count, rounded]);

    return (
        <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-black dark:text-white">
                {displayValue}{suffix}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{label}</div>
        </div>
    );
};

const GridPattern: React.FC = () => (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-zinc-100 dark:text-zinc-800/50" />
            </pattern>
            <linearGradient id="fade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="fadeMask">
                <rect width="100%" height="100%" fill="url(#fade)" />
            </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" mask="url(#fadeMask)" />
    </svg>
);

const FeaturePill: React.FC<{ icon: React.ReactNode; text: string; delay: number }> = ({ icon, text, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm"
    >
        <span className="text-[#06C167]">{icon}</span>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{text}</span>
    </motion.div>
);

export const HeroSection: React.FC<{ onEnterSystem?: () => void }> = ({ onEnterSystem }) => {
    return (
        <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-32 px-6 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-zinc-50 to-white dark:from-black dark:via-zinc-950 dark:to-black" />
            <GridPattern />

            {/* Subtle Floating Orbs */}
            <FloatingOrb delay={0} size={600} x={-10} y={10} color="#06C167" />
            <FloatingOrb delay={2} size={400} x={80} y={60} color="#06C167" />
            <FloatingOrb delay={4} size={300} x={60} y={-10} color="#276EF1" />

            {/* Main Content */}
            <div className="relative z-10 max-w-6xl mx-auto w-full">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#06C167]/10 border border-[#06C167]/20">
                        <Sparkle size={16} weight="fill" className="text-[#06C167]" />
                        <span className="text-sm font-medium text-[#06C167]">
                            Introducing NABD 2.0 - The Future of Business Management
                        </span>
                    </div>
                </motion.div>

                {/* Main Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-black dark:text-white leading-[1.05]">
                        Your Business,
                        <br />
                        <span className="relative">
                            <span className="text-[#06C167]">
                                Perfectly Orchestrated
                            </span>
                        </span>
                    </h1>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 text-center max-w-3xl mx-auto mb-12 leading-relaxed"
                >
                    The all-in-one platform for project management, company operations,
                    and data-driven insights. Transform how your team works.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                >
                    <button
                        onClick={onEnterSystem}
                        className="group relative h-14 px-8 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-lg
                        hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200"
                    >
                        <span className="flex items-center gap-2">
                            Get Started Free
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    <button className="group h-14 px-8 rounded-xl bg-transparent text-black dark:text-white font-semibold text-lg
                        border-2 border-zinc-200 dark:border-zinc-800
                        hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900
                        transition-all duration-200 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#06C167] flex items-center justify-center text-white">
                            <Play size={16} weight="fill" className="ml-0.5" />
                        </div>
                        Watch Demo
                    </button>
                </motion.div>

                {/* Feature Pills */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-3 mb-20"
                >
                    <FeaturePill icon={<ChartLineUp size={18} weight="bold" />} text="Real-time Analytics" delay={0.5} />
                    <FeaturePill icon={<Users size={18} weight="bold" />} text="Team Collaboration" delay={0.6} />
                    <FeaturePill icon={<Buildings size={18} weight="bold" />} text="Company Management" delay={0.7} />
                    <FeaturePill icon={<Lightning size={18} weight="bold" />} text="Instant Insights" delay={0.8} />
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    className="flex flex-wrap justify-center gap-12 md:gap-20"
                >
                    <AnimatedCounter value={50} suffix="+" label="Ready-to-use Dashboards" />
                    <AnimatedCounter value={99} suffix="%" label="Uptime Guarantee" />
                    <AnimatedCounter value={10} suffix="x" label="Faster Decision Making" />
                </motion.div>
            </div>

            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none" />
        </section>
    );
};
