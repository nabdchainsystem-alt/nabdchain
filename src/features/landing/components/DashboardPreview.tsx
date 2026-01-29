import React, { useRef, memo } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle, Circle, ArrowUp, ArrowDown } from 'phosphor-react';

// Animated bar with smooth grow animation
const AnimatedBar: React.FC<{ width: string; index: number; isHighlighted?: boolean }> = memo(({ width, index, isHighlighted }) => (
    <div className="h-6 sm:h-8 bg-zinc-800 rounded-lg overflow-hidden relative">
        <div
            className={`h-full rounded-lg ${isHighlighted ? 'bg-gradient-to-r from-white to-zinc-200' : 'bg-gradient-to-r from-zinc-600 to-zinc-500'}`}
            style={{
                width: width,
                animation: `barGrow 1s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                animationDelay: `${0.3 + index * 0.15}s`,
                transform: 'scaleX(0)',
                transformOrigin: 'left'
            }}
        />
        {isHighlighted && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                 style={{ animation: 'shimmer 2s infinite', animationDelay: `${1 + index * 0.15}s` }} />
        )}
        <style>{`
            @keyframes barGrow {
                from { transform: scaleX(0); }
                to { transform: scaleX(1); }
            }
        `}</style>
    </div>
));

// Task item without individual useInView
const TaskItem: React.FC<{ task: string; completed: boolean; index: number; avatar: string }> = memo(({ task, completed, index, avatar }) => (
    <div
        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer group
                   opacity-0 animate-fade-in-up"
        style={{ animationDelay: `${0.4 + index * 0.08}s`, animationFillMode: 'forwards' }}
    >
        {completed ? (
            <CheckCircle size={18} weight="fill" className="text-white flex-shrink-0" />
        ) : (
            <Circle size={18} className="text-zinc-600 group-hover:text-zinc-500 flex-shrink-0" />
        )}
        <span className={`flex-1 text-xs sm:text-sm ${completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
            {task}
        </span>
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] sm:text-xs text-zinc-300 font-medium">
            {avatar}
        </div>
    </div>
));

// Stat card with smooth scale animation
const StatCard: React.FC<{ label: string; value: string; change: number; index: number }> = memo(({ label, value, change, index }) => {
    const isPositive = change >= 0;

    return (
        <div
            className="bg-zinc-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-zinc-700/50
                       hover:bg-zinc-800/70 hover:border-zinc-600/50 hover:shadow-lg
                       transition-all duration-300"
            style={{
                animation: 'cardPop 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                animationDelay: `${0.2 + index * 0.1}s`,
                opacity: 0,
                transform: 'scale(0.9)'
            }}
        >
            <div className="text-[10px] sm:text-xs text-zinc-500 mb-0.5 sm:mb-1">{label}</div>
            <div className="text-lg sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">{value}</div>
            <div className={`flex items-center text-[10px] sm:text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <ArrowUp size={10} weight="bold" /> : <ArrowDown size={10} weight="bold" />}
                <span className="ml-1">{Math.abs(change)}%</span>
            </div>
            <style>{`
                @keyframes cardPop {
                    from { opacity: 0; transform: scale(0.9) translateZ(0); }
                    to { opacity: 1; transform: scale(1) translateZ(0); }
                }
            `}</style>
        </div>
    );
});

// Animated cursor - hidden on mobile
const AnimatedCursor: React.FC = memo(() => (
    <div className="hidden md:block absolute pointer-events-none z-50"
         style={{
             left: 180,
             top: 140,
             animation: 'cursorMove 8s ease-in-out infinite'
         }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="drop-shadow-lg">
            <path d="M5.5 3L15 10.5L10 11.5L8 17L5.5 3Z" fill="white" stroke="#71717a" strokeWidth="1.5" />
        </svg>
        <div className="ml-4 mt-1 px-2 py-1 bg-violet-600 text-white text-xs rounded-md whitespace-nowrap shadow-lg"
             style={{ animation: 'cursorLabel 8s ease-in-out infinite' }}>
            Sarah K.
        </div>
        <style>{`
            @keyframes cursorMove {
                0%, 100% { transform: translate(0, 0) translateZ(0); }
                25% { transform: translate(60px, 40px) translateZ(0); }
                50% { transform: translate(120px, -20px) translateZ(0); }
                75% { transform: translate(40px, 60px) translateZ(0); }
            }
            @keyframes cursorLabel {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `}</style>
    </div>
));

export const DashboardPreview: React.FC = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-50px" });

    const tasks = [
        { task: "Review Q4 financial reports", completed: true, avatar: "JD" },
        { task: "Update project timeline", completed: true, avatar: "SK" },
        { task: "Prepare board presentation", completed: false, avatar: "MR" },
        { task: "Finalize vendor contracts", completed: false, avatar: "AL" },
    ];

    const features = [
        "Real-time project tracking",
        "Customizable widgets",
        "Team analytics",
        "Automated reports"
    ];

    return (
        <section ref={sectionRef} className="py-20 sm:py-28 md:py-36 bg-black relative overflow-hidden">
            {/* Animated Spotlight Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'spotlightPulse 8s ease-in-out infinite' }} />
            <div className="absolute top-20 left-1/3 w-[400px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'spotlightPulse 10s ease-in-out infinite', animationDelay: '-4s' }} />
            <style>{`
                @keyframes spotlightPulse {
                    0%, 100% { opacity: 0.6; transform: translate(-50%, 0) scale(1) translateZ(0); }
                    50% { opacity: 1; transform: translate(-50%, 0) scale(1.1) translateZ(0); }
                }
            `}</style>

            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    {isInView && (
                        <div className="opacity-0 animate-fade-in-up order-2 lg:order-1"
                             style={{ animationFillMode: 'forwards' }}>
                            <span className="inline-block px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-semibold mb-6 sm:mb-8">
                                Dashboard Preview
                            </span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 sm:mb-8 leading-[1.1]">
                                See everything
                                <br />
                                <span className="text-zinc-500">at a glance</span>
                            </h2>
                            <p className="text-lg sm:text-xl text-zinc-400 mb-8 sm:mb-10 leading-relaxed">
                                Our intuitive dashboards give you complete visibility into your business.
                                Track projects, monitor KPIs, and make informed decisions with real-time data.
                            </p>

                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                {features.map((item, i) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-2 opacity-0 animate-fade-in-up"
                                        style={{ animationDelay: `${0.2 + i * 0.08}s`, animationFillMode: 'forwards' }}
                                    >
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle size={12} weight="fill" className="text-zinc-400" />
                                        </div>
                                        <span className="text-xs sm:text-sm text-zinc-400">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Right - Dashboard Mockup */}
                    {isInView && (
                        <div
                            className="relative opacity-0 animate-fade-in-up order-1 lg:order-2"
                            style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
                        >
                            <div className="relative bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
                                {/* Window Header */}
                                <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-zinc-800">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-700" />
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-700" />
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-700" />
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
                                        <div className="w-2 h-2 rounded-full bg-zinc-400" />
                                        3 collaborators
                                    </div>
                                </div>

                                {/* Dashboard Content */}
                                <div className="p-3 sm:p-4 md:p-6 relative">
                                    <AnimatedCursor />

                                    {/* Stats Row - responsive grid */}
                                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                                        <StatCard label="Completed" value="147" change={12} index={0} />
                                        <StatCard label="Projects" value="23" change={-3} index={1} />
                                        <StatCard label="Velocity" value="94%" change={8} index={2} />
                                    </div>

                                    {/* Chart Section */}
                                    <div className="mb-4 sm:mb-6">
                                        <div className="text-xs sm:text-sm text-zinc-400 mb-2 sm:mb-3">Weekly Progress</div>
                                        <div className="space-y-2 sm:space-y-3">
                                            <AnimatedBar width="85%" index={0} isHighlighted />
                                            <AnimatedBar width="72%" index={1} />
                                            <AnimatedBar width="93%" index={2} isHighlighted />
                                            <AnimatedBar width="61%" index={3} />
                                        </div>
                                    </div>

                                    {/* Tasks List */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                                            <div className="text-xs sm:text-sm text-zinc-400">Today's Tasks</div>
                                            <div className="text-[10px] sm:text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer">View all</div>
                                        </div>
                                        <div className="space-y-0.5 sm:space-y-1">
                                            {tasks.map((task, i) => (
                                                <TaskItem key={task.task} {...task} index={i} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements - hidden on small mobile */}
                            <div className="hidden sm:block absolute -top-4 sm:-top-6 -right-2 sm:-right-6 bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg text-xs sm:text-sm font-medium border border-zinc-800">
                                +23% this week
                            </div>

                            <div className="hidden sm:block absolute -bottom-3 sm:-bottom-4 -left-2 sm:-left-4 bg-zinc-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-xl border border-zinc-700">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-700" />
                                    <div>
                                        <div className="text-[10px] sm:text-xs text-zinc-500">New notification</div>
                                        <div className="text-xs sm:text-sm font-medium text-white">Task completed!</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
