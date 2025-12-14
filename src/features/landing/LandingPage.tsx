import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HeroSection } from './components/HeroSection';
import { StatsSection } from './components/StatsSection';
import { ProcessSection } from './components/ProcessSection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { MarketplaceSection } from './components/MarketplaceSection';
import { PricingSection } from './components/PricingSection';

interface LandingPageProps {
    onEnterSystem: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterSystem }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: containerRef });

    // Navigation Scroll Effects
    const navBackground = useTransform(scrollY, [0, 100], ["rgba(10, 10, 10, 0)", "rgba(10, 10, 10, 0.8)"]);
    const navBackdrop = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(12px)"]);
    const navBorder = useTransform(scrollY, [0, 100], ["rgba(255,255,255,0)", "rgba(255,255,255,0.05)"]);

    return (
        <div ref={containerRef} className="h-screen w-full bg-[#050505] text-white font-sans selection:bg-white/20 selection:text-white overflow-y-auto overflow-x-hidden">

            {/* Background Ambient Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-blue-900/20 to-purple-900/20 blur-[120px] mix-blend-screen opacity-40"
                />
            </div>

            {/* Navigation */}
            <motion.nav
                style={{ backgroundColor: navBackground, backdropFilter: navBackdrop, borderBottomColor: navBorder }}
                className="fixed top-0 w-full z-50 border-b border-transparent transition-all duration-300"
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative group cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                            <div className="relative w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white/90 rounded-md group-hover:scale-90 transition-transform" />
                            </div>
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            NABD CHAIN
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {['Platform', 'Solutions', 'Developers', 'Company'].map((item) => (
                            <button key={item} className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group">
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="hidden md:block text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            Sign In
                        </button>
                        <button
                            onClick={onEnterSystem}
                            className="px-5 py-2 rounded-lg bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all hover:scale-105"
                        >
                            Enter System
                        </button>
                    </div>
                </div>
            </motion.nav>

            <main>
                <HeroSection onEnterSystem={onEnterSystem} />
                <StatsSection />
                <ProcessSection />
                <AnalyticsSection />
                <MarketplaceSection />
                <PricingSection />

                {/* CTA Section */}
                <section className="py-40 px-6 relative overflow-hidden bg-gradient-to-b from-[#050505] to-[#020202]">
                    <div className="relative z-10 max-w-4xl mx-auto text-center">
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8">
                            Ready to Upgrade?
                        </h2>
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                            Join the future of enterprise management. Request access today and transform your workflow.
                        </p>
                        <button
                            onClick={onEnterSystem}
                            className="px-12 py-5 rounded-full bg-white text-black text-xl font-bold hover:bg-blue-50 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                        >
                            Initialize System
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-[#020202] pt-20 pb-10 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white/80 rounded-sm" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">NABD CHAIN</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Pioneering the next generation of enterprise operating systems.
                        </p>
                    </div>

                    {['Product', 'Company', 'Resources'].map((col) => (
                        <div key={col}>
                            <h4 className="font-bold mb-6">{col}</h4>
                            <ul className="space-y-4 text-sm text-gray-500">
                                <li className="hover:text-white cursor-pointer transition-colors">Overview</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Features</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Solutions</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
                    <p>© 2025 NABD Chain System. All rights reserved.</p>
                    <div className="flex gap-6">
                        <span className="cursor-pointer hover:text-gray-400">Privacy Policy</span>
                        <span className="cursor-pointer hover:text-gray-400">Terms of Service</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
