import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle, Circle, ArrowUp, ArrowDown } from 'phosphor-react';

const AnimatedBar: React.FC<{ width: string; delay: number; color: string }> = ({ width, delay, color }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <div ref={ref} className="h-8 bg-zinc-800 rounded-lg overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width } : { width: 0 }}
                transition={{ duration: 1, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
                className={`h-full ${color} rounded-lg`}
            />
        </div>
    );
};

const TaskItem: React.FC<{ task: string; completed: boolean; delay: number; avatar: string }> = ({ task, completed, delay, avatar }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5, delay }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer group"
        >
            {completed ? (
                <CheckCircle size={20} weight="fill" className="text-[#06C167] flex-shrink-0" />
            ) : (
                <Circle size={20} className="text-zinc-600 group-hover:text-zinc-500 flex-shrink-0" />
            )}
            <span className={`flex-1 text-sm ${completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                {task}
            </span>
            <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-medium">
                {avatar}
            </div>
        </motion.div>
    );
};

const StatCard: React.FC<{ label: string; value: string; change: number; delay: number }> = ({ label, value, change, delay }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const isPositive = change >= 0;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay }}
            className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50"
        >
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className={`flex items-center text-xs ${isPositive ? 'text-[#06C167]' : 'text-red-500'}`}>
                {isPositive ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
                <span className="ml-1">{Math.abs(change)}% from last week</span>
            </div>
        </motion.div>
    );
};

const LiveCursor: React.FC = () => {
    const [position, setPosition] = useState({ x: 200, y: 150 });

    useEffect(() => {
        const interval = setInterval(() => {
            setPosition({
                x: 100 + Math.random() * 300,
                y: 100 + Math.random() * 200
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            className="absolute pointer-events-none z-50"
            animate={{ x: position.x, y: position.y }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
        >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5.5 3L15 10.5L10 11.5L8 17L5.5 3Z" fill="#06C167" stroke="white" strokeWidth="1.5" />
            </svg>
            <div className="ml-4 mt-1 px-2 py-1 bg-[#06C167] text-white text-xs rounded-md whitespace-nowrap">
                Sarah K.
            </div>
        </motion.div>
    );
};

export const DashboardPreview: React.FC = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const tasks = [
        { task: "Review Q4 financial reports", completed: true, avatar: "JD" },
        { task: "Update project timeline for client", completed: true, avatar: "SK" },
        { task: "Prepare board presentation", completed: false, avatar: "MR" },
        { task: "Finalize vendor contracts", completed: false, avatar: "AL" },
        { task: "Schedule team retrospective", completed: false, avatar: "JD" },
    ];

    return (
        <section ref={sectionRef} className="py-32 bg-white dark:bg-black relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                        transition={{ duration: 0.7 }}
                    >
                        <span className="inline-block px-4 py-2 rounded-full bg-[#06C167]/10 text-[#06C167] text-sm font-semibold mb-6">
                            Dashboard Preview
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white tracking-tight mb-6 leading-tight">
                            See everything
                            <br />
                            <span className="text-[#06C167]">
                                at a glance
                            </span>
                        </h2>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                            Our intuitive dashboards give you complete visibility into your business.
                            Track projects, monitor KPIs, and make informed decisions with real-time data.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Real-time project tracking and updates",
                                "Customizable widgets and layouts",
                                "Team performance analytics",
                                "Automated reporting and exports"
                            ].map((item, i) => (
                                <motion.div
                                    key={item}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#06C167]/10 flex items-center justify-center">
                                        <CheckCircle size={14} weight="fill" className="text-[#06C167]" />
                                    </div>
                                    <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right - Dashboard Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-[#06C167]/10 rounded-3xl blur-3xl" />

                        <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
                            {/* Window Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <div className="w-2 h-2 rounded-full bg-[#06C167] animate-pulse" />
                                    3 collaborators
                                </div>
                            </div>

                            {/* Dashboard Content */}
                            <div className="p-6 relative">
                                <LiveCursor />

                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <StatCard label="Tasks Completed" value="147" change={12} delay={0.3} />
                                    <StatCard label="Active Projects" value="23" change={-3} delay={0.4} />
                                    <StatCard label="Team Velocity" value="94%" change={8} delay={0.5} />
                                </div>

                                {/* Chart Section */}
                                <div className="mb-6">
                                    <div className="text-sm text-zinc-400 mb-3">Weekly Progress</div>
                                    <div className="space-y-3">
                                        <AnimatedBar width="85%" delay={0.4} color="bg-[#06C167]" />
                                        <AnimatedBar width="72%" delay={0.5} color="bg-zinc-600" />
                                        <AnimatedBar width="93%" delay={0.6} color="bg-[#06C167]" />
                                        <AnimatedBar width="61%" delay={0.7} color="bg-zinc-600" />
                                    </div>
                                </div>

                                {/* Tasks List */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm text-zinc-400">Today's Tasks</div>
                                        <div className="text-xs text-[#06C167]">View all</div>
                                    </div>
                                    <div className="space-y-1">
                                        {tasks.map((task, i) => (
                                            <TaskItem key={task.task} {...task} delay={0.5 + i * 0.1} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-6 -right-6 bg-[#06C167] text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium"
                        >
                            +23% this week
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-4 -left-4 bg-white dark:bg-zinc-800 px-4 py-3 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#06C167]" />
                                <div>
                                    <div className="text-xs text-zinc-500">New notification</div>
                                    <div className="text-sm font-medium text-zinc-900 dark:text-white">Task completed!</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
