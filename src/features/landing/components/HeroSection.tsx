import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'phosphor-react';

// Animated grid background with flowing light effects - GPU accelerated CSS animations
const NetworkBackground = memo(() => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none will-change-transform">
        {/* Base Grid */}
        <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]"
            style={{
                backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                                  linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
            }}
        />

        {/* Flowing horizontal beams */}
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
             style={{ top: '25%', animation: 'flowBeamH 8s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent"
             style={{ top: '55%', animation: 'flowBeamH 10s cubic-bezier(0.4, 0, 0.2, 1) infinite', animationDelay: '-3s' }} />

        {/* Floating gradient orbs - smooth breathing animation */}
        <div className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5 blur-3xl"
             style={{ animation: 'orbFloat 10s ease-in-out infinite' }} />
        <div className="absolute top-[50%] right-[5%] w-96 h-96 rounded-full bg-gradient-to-br from-violet-500/8 to-purple-500/5 blur-3xl"
             style={{ animation: 'orbFloat 12s ease-in-out infinite', animationDelay: '-4s' }} />

        {/* CSS Keyframes - GPU accelerated with transform/opacity only */}
        <style>{`
            @keyframes flowBeamH {
                0% { opacity: 0; transform: translateX(-100%) translateZ(0); }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { opacity: 0; transform: translateX(100%) translateZ(0); }
            }
            @keyframes orbFloat {
                0%, 100% { opacity: 0.6; transform: translate(0, 0) scale(1) translateZ(0); }
                33% { opacity: 0.8; transform: translate(20px, -20px) scale(1.05) translateZ(0); }
                66% { opacity: 0.7; transform: translate(-15px, 15px) scale(0.98) translateZ(0); }
            }
        `}</style>
    </div>
));

// Fictional company logo with simple geometric icon
const CompanyLogo: React.FC<{ name: string; icon: React.ReactNode }> = ({ name, icon }) => (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 opacity-40 hover:opacity-70 transition-opacity">
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
        <span className="text-sm sm:text-base font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide">{name}</span>
    </div>
);

// Simple geometric SVG icons for fictional companies
const LogoIcons = {
    cube: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    hexagon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/></svg>,
    circle: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>,
    triangle: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>,
    diamond: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l10 10-10 10L2 12l10-10z"/></svg>,
    square: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
};

export const HeroSection: React.FC<{ onEnterSystem?: () => void }> = ({ onEnterSystem }) => {
    const companies = [
        { name: 'Nexora', icon: LogoIcons.hexagon },
        { name: 'Veltrix', icon: LogoIcons.cube },
        { name: 'Quantix', icon: LogoIcons.diamond },
        { name: 'Synthra', icon: LogoIcons.triangle },
        { name: 'Lumina', icon: LogoIcons.circle },
        { name: 'Zephyr', icon: LogoIcons.square },
    ];

    return (
        <section className="relative min-h-[85vh] sm:min-h-[90vh] flex flex-col justify-center overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-white dark:bg-black" />
            <NetworkBackground />

            {/* Main Content Container */}
            <div className="relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20"
                >
                    {/* Main Heading */}
                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-black dark:text-white leading-[1.08]">
                            More than Project Management.
                            <br />
                            <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                                Complete Business Operations
                            </span>
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 text-center max-w-3xl mx-auto mb-10 sm:mb-12 leading-relaxed">
                        The all-in-one platform to manage projects, run operations, and unlock data-driven insights.
                        Built for teams who want to move fast.
                    </p>

                    {/* CTA Button */}
                    <div className="flex items-center justify-center mb-20 sm:mb-24 lg:mb-28">
                        <button
                            onClick={onEnterSystem}
                            className="group relative h-12 sm:h-14 px-7 sm:px-8 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold text-base sm:text-lg
                            hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 shadow-lg shadow-black/10 dark:shadow-white/10"
                        >
                            <span className="flex items-center gap-2">
                                Start building for free
                                <ArrowRight size={20} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        </button>
                    </div>

                    {/* Trusted By Section */}
                    <div className="text-center">
                        <p className="text-sm sm:text-base text-zinc-400 dark:text-zinc-500 mb-6 sm:mb-8 font-medium">
                            Trusted by fast-growing companies across the region
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10">
                            {companies.map((company) => (
                                <CompanyLogo key={company.name} name={company.name} icon={company.icon} />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-40 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none" />
        </section>
    );
};
