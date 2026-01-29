import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkle, ChartLineUp, Users, Buildings, Lightning } from 'phosphor-react';

const FloatingOrb: React.FC<{ size: number; x: number; y: number }> = ({ size, x, y }) => (
    <div
        className="absolute rounded-full opacity-[0.04]"
        style={{
            width: size,
            height: size,
            left: `${x}%`,
            top: `${y}%`,
            background: 'radial-gradient(circle, #a1a1aa 0%, transparent 70%)',
        }}
    />
);

const StatCounter: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-black dark:text-white">
            {value}
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">{label}</div>
    </div>
);

const NetworkBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Grid */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.15] dark:opacity-[0.1]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="network-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-zinc-900 dark:text-zinc-100" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#network-grid)" />
            </svg>

            {/* Animated Lines/Connections */}
            <div className="absolute inset-0">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            delay: i * 1.5,
                            ease: "linear"
                        }}
                        className="absolute bg-gradient-to-r from-transparent via-blue-500/50 to-transparent h-[1px] w-full"
                        style={{ top: `${20 + i * 30}%` }}
                    />
                ))}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={`v-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                            duration: 4 + i,
                            repeat: Infinity,
                            delay: i * 1.2,
                            ease: "linear"
                        }}
                        className="absolute bg-gradient-to-b from-transparent via-purple-500/50 to-transparent w-[1px] h-full"
                        style={{ left: `${25 + i * 25}%` }}
                    />
                ))}
            </div>

            {/* Glowing Orbs */}
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={`orb-${i}`}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeInOut"
                    }}
                    className="absolute w-32 h-32 rounded-full blur-[60px]"
                    style={{
                        background: i % 2 === 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                        top: `${Math.random() * 80}%`,
                        left: `${Math.random() * 80}%`,
                    }}
                />
            ))}
        </div>
    );
};

const FeaturePill: React.FC<{ icon: React.ReactNode; text: string; delay: number }> = ({ icon, text, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm"
    >
        <span className="text-zinc-600 dark:text-zinc-400">{icon}</span>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{text}</span>
    </motion.div>
);

export const HeroSection: React.FC<{ onEnterSystem?: () => void }> = ({ onEnterSystem }) => {
    return (
        <section className="relative min-h-[90vh] flex flex-col justify-center pt-32 pb-20 px-6 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-white dark:bg-black" />
            <NetworkBackground />

            {/* Main Content */}
            <div className="relative z-10 max-w-6xl mx-auto w-full">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        <Sparkle size={16} weight="fill" className="text-zinc-500" />
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
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
                        <span className="text-zinc-400 dark:text-zinc-500">
                            Perfectly Orchestrated
                        </span>
                    </h1>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-500 text-center max-w-3xl mx-auto mb-12 leading-relaxed"
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
                        border-2 border-zinc-300 dark:border-zinc-700
                        hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900
                        transition-all duration-200 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-colors">
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
                    <StatCounter value="50+" label="Ready-to-use Dashboards" />
                    <StatCounter value="99%" label="Uptime Guarantee" />
                    <StatCounter value="10x" label="Faster Decision Making" />
                </motion.div>
            </div>

            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none" />
        </section>
    );
};
