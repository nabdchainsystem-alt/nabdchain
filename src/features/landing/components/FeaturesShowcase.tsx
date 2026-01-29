import React, { useRef, memo, useState, useCallback } from 'react';
import { useInView } from 'framer-motion';
import {
    Lightning,
    ChartLineUp,
    ShieldCheck,
    UsersThree,
    Robot,
    Cube,
    ArrowRight,
    TrendUp,
    Sparkle,
    Play
} from 'phosphor-react';

// Interactive gradient that follows mouse
const InteractiveBackground = memo(() => {
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    }, []);

    return (
        <div
            className="absolute inset-0 overflow-hidden pointer-events-auto"
            onMouseMove={handleMouseMove}
        >
            {/* Mouse-following gradient */}
            <div
                className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-30 transition-all duration-700 ease-out"
                style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.1) 50%, transparent 70%)',
                    left: `${mousePos.x}%`,
                    top: `${mousePos.y}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            />

            {/* Static animated orbs */}
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl"
                 style={{ animation: 'meshFloat 20s ease-in-out infinite' }} />
            <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-blue-500/8 rounded-full blur-3xl"
                 style={{ animation: 'meshFloat 25s ease-in-out infinite', animationDelay: '-8s' }} />

            {/* Animated grid lines */}
            <div className="absolute inset-0 opacity-[0.02]"
                 style={{
                     backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                     backgroundSize: '60px 60px'
                 }} />

            <style>{`
                @keyframes meshFloat {
                    0%, 100% { transform: translate(0, 0) scale(1) translateZ(0); }
                    33% { transform: translate(30px, -30px) scale(1.05) translateZ(0); }
                    66% { transform: translate(-20px, 20px) scale(0.95) translateZ(0); }
                }
            `}</style>
        </div>
    );
});

// Enhanced benefit card with glow border effect
interface BenefitCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    metric?: string;
    metricLabel?: string;
    className?: string;
    accentColor?: string;
    index?: number;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
    icon,
    title,
    description,
    metric,
    metricLabel,
    className = '',
    accentColor = 'violet',
    index = 0
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const colorMap: Record<string, string> = {
        violet: 'from-violet-500 to-purple-500',
        blue: 'from-blue-500 to-cyan-500',
        emerald: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500',
    };

    return (
        <div
            className={`group relative opacity-0 animate-fade-in-up ${className}`}
            style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: 'forwards' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Animated border glow */}
            <div className={`absolute -inset-[1px] rounded-2xl sm:rounded-3xl bg-gradient-to-r ${colorMap[accentColor]} opacity-0
                group-hover:opacity-100 blur-sm transition-opacity duration-500`} />

            <div className="relative h-full p-5 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl bg-zinc-900
                border border-zinc-800 group-hover:border-transparent
                transition-all duration-500 ease-out
                group-hover:-translate-y-1">

                {/* Subtle inner glow */}
                <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${colorMap[accentColor]}
                    opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                {/* Content */}
                <div className="relative z-10">
                    {/* Icon with pulse effect */}
                    <div className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/50
                        flex items-center justify-center mb-4
                        group-hover:bg-gradient-to-br group-hover:${colorMap[accentColor]} group-hover:border-transparent
                        transition-all duration-300`}>
                        <span className="text-zinc-400 group-hover:text-white transition-colors duration-300">
                            {icon}
                        </span>
                        {/* Pulse ring on hover */}
                        {isHovered && (
                            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colorMap[accentColor]} animate-ping opacity-20`} />
                        )}
                    </div>

                    {/* Metric with counter animation effect */}
                    {metric && (
                        <div className="mb-3">
                            <span className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${colorMap[accentColor]} bg-clip-text text-transparent
                                group-hover:scale-105 inline-block transition-transform duration-300`}>
                                {metric}
                            </span>
                            {metricLabel && (
                                <span className="block text-xs text-zinc-500 mt-1">{metricLabel}</span>
                            )}
                        </div>
                    )}

                    {/* Title & Description */}
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 group-hover:text-white/90 transition-colors">{title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-400 transition-colors">{description}</p>
                </div>
            </div>
        </div>
    );
};

// Large hero card with enhanced animations
const HeroCard: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group relative col-span-1 md:col-span-2 row-span-1 md:row-span-2 opacity-0 animate-fade-in-up"
            style={{ animationFillMode: 'forwards' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Animated border glow */}
            <div className="absolute -inset-[1px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500
                opacity-50 group-hover:opacity-100 blur-sm transition-opacity duration-500"
                style={{ backgroundSize: '200% 100%', animation: 'gradientShift 3s linear infinite' }} />

            <div className="relative h-full min-h-[300px] sm:min-h-[340px] md:min-h-[420px] p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl overflow-hidden
                bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950
                transition-all duration-500">

                {/* Animated gradient orbs */}
                <div className="absolute top-0 right-0 w-56 sm:w-80 h-56 sm:h-80 bg-violet-500/25 rounded-full blur-3xl
                    group-hover:bg-violet-400/35 transition-all duration-700"
                    style={{ animation: 'heroOrbFloat 8s ease-in-out infinite' }} />
                <div className="absolute bottom-0 left-0 w-44 sm:w-64 h-44 sm:h-64 bg-blue-500/20 rounded-full blur-3xl
                    group-hover:bg-blue-400/30 transition-all duration-700"
                    style={{ animation: 'heroOrbFloat 10s ease-in-out infinite', animationDelay: '-3s' }} />

                {/* Particle effect on hover */}
                {isHovered && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-violet-400 rounded-full"
                                style={{
                                    left: `${20 + i * 12}%`,
                                    bottom: '20%',
                                    animation: `particleRise ${1.5 + i * 0.2}s ease-out infinite`,
                                    animationDelay: `${i * 0.15}s`,
                                    opacity: 0.6
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-violet-500/20 border border-violet-500/30 mb-5
                            group-hover:bg-violet-500/30 group-hover:border-violet-400/50
                            group-hover:shadow-lg group-hover:shadow-violet-500/20
                            transition-all duration-300">
                            <Sparkle size={14} weight="fill" className="text-violet-400" style={{ animation: 'sparkle 2s ease-in-out infinite' }} />
                            <span className="text-xs font-medium text-violet-300">Core Benefit</span>
                        </div>

                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-[1.1]">
                            10x Your Team's
                            <br />
                            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-violet-400 bg-clip-text text-transparent"
                                  style={{ backgroundSize: '200% 100%', animation: 'gradientShift 4s linear infinite' }}>
                                Productivity
                            </span>
                        </h3>

                        <p className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-md leading-relaxed">
                            Replace scattered tools with one unified platform.
                            Watch efficiency soar as your team focuses on what matters most.
                        </p>
                    </div>

                    {/* Stats row with animated counters */}
                    <div className="flex gap-8 mt-6">
                        <div className="group/stat">
                            <div className="text-2xl sm:text-3xl font-bold text-white group-hover/stat:text-violet-300 transition-colors">85%</div>
                            <div className="text-xs sm:text-sm text-zinc-500">Less context switching</div>
                        </div>
                        <div className="group/stat">
                            <div className="text-2xl sm:text-3xl font-bold text-white group-hover/stat:text-blue-300 transition-colors">3hrs</div>
                            <div className="text-xs sm:text-sm text-zinc-500">Saved per day</div>
                        </div>
                    </div>
                </div>

                {/* Decorative trend icon */}
                <div className="hidden sm:block absolute bottom-6 right-6 opacity-5 group-hover:opacity-20 transition-opacity duration-500">
                    <TrendUp size={140} weight="thin" className="text-violet-400" />
                </div>

                {/* Keyframes */}
                <style>{`
                    @keyframes heroOrbFloat {
                        0%, 100% { transform: translate(0, 0) scale(1) translateZ(0); }
                        50% { transform: translate(-15px, 15px) scale(1.08) translateZ(0); }
                    }
                    @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        100% { background-position: 200% 50%; }
                    }
                    @keyframes particleRise {
                        0% { transform: translateY(0) scale(1); opacity: 0.6; }
                        100% { transform: translateY(-100px) scale(0); opacity: 0; }
                    }
                    @keyframes sparkle {
                        0%, 100% { transform: scale(1) rotate(0deg); }
                        50% { transform: scale(1.2) rotate(180deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export const FeaturesShowcase: React.FC = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    return (
        <section ref={sectionRef} className="py-20 sm:py-28 md:py-32 bg-zinc-950 relative overflow-hidden">
            <InteractiveBackground />

            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                {/* Compact Section Header */}
                {isInView && (
                    <div className="text-center mb-14 sm:mb-16 md:mb-20 opacity-0 animate-fade-in-up"
                         style={{ animationFillMode: 'forwards' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-zinc-900/80 border border-zinc-800 mb-6 backdrop-blur-sm
                            hover:border-violet-500/50 hover:bg-zinc-900 transition-all duration-300 cursor-default">
                            <Cube size={16} weight="duotone" className="text-violet-400" />
                            <span className="text-sm font-medium text-zinc-400">Why NABD</span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 leading-[1.05]">
                            <span className="text-white">Orchestrate Your </span>
                            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-violet-400 bg-clip-text text-transparent"
                                  style={{ backgroundSize: '200% 100%', animation: 'gradientShift 4s linear infinite' }}>
                                Empire
                            </span>
                        </h2>

                        <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                            One platform to unify operations, accelerate decisions, and unlock your team's full potential.
                        </p>
                    </div>
                )}

                {/* Bento Grid */}
                {isInView && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <HeroCard />

                        <BenefitCard
                            icon={<UsersThree size={22} weight="duotone" />}
                            title="Real-time Collaboration"
                            description="See changes as they happen. Work together from anywhere."
                            metric="Live"
                            metricLabel="Sync across devices"
                            accentColor="blue"
                            index={1}
                            className="col-span-1"
                        />

                        <BenefitCard
                            icon={<Robot size={22} weight="duotone" />}
                            title="Smart Automation"
                            description="AI handles repetitive work so you can focus on strategy."
                            metric="50+"
                            metricLabel="Automated workflows"
                            accentColor="violet"
                            index={2}
                            className="col-span-1"
                        />

                        <BenefitCard
                            icon={<Lightning size={22} weight="duotone" />}
                            title="Instant Insights"
                            description="Real-time dashboards that surface what matters most."
                            accentColor="amber"
                            index={3}
                            className="col-span-1"
                        />

                        <BenefitCard
                            icon={<ChartLineUp size={22} weight="duotone" />}
                            title="Predictive Analytics"
                            description="Forecast trends before they happen with AI predictions."
                            accentColor="emerald"
                            index={4}
                            className="col-span-1"
                        />

                        <BenefitCard
                            icon={<ShieldCheck size={22} weight="duotone" />}
                            title="Enterprise Security"
                            description="Bank-grade encryption. SOC 2 compliant. Your data stays yours."
                            metric="99.9%"
                            metricLabel="Uptime SLA"
                            accentColor="blue"
                            index={5}
                            className="col-span-1 sm:col-span-2"
                        />
                    </div>
                )}

                {/* Enhanced Bottom CTA */}
                {isInView && (
                    <div className="text-center mt-12 sm:mt-16 opacity-0 animate-fade-in-up"
                         style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                        <button className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full
                            bg-white text-zinc-900 font-semibold text-sm
                            hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5
                            transition-all duration-300">
                            <Play size={16} weight="fill" className="group-hover:scale-110 transition-transform" />
                            Explore All Features
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>

            {/* Global keyframes */}
            <style>{`
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
            `}</style>
        </section>
    );
};
