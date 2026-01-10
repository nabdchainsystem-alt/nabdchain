import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HeroSection } from './components/HeroSection';
import { StatsSection } from './components/StatsSection';
import { ProcessSection } from './components/ProcessSection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { MarketplaceSection } from './components/MarketplaceSection';
import { PricingSection } from './components/PricingSection';

export const LandingPage: React.FC<{ onEnterSystem: () => void }> = ({ onEnterSystem }) => {
    const { scrollY } = useScroll();
    const navBackground = useTransform(
        scrollY,
        [0, 50],
        ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)']
    );
    const navBorder = useTransform(
        scrollY,
        [0, 50],
        ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.05)']
    );
    const navBackdrop = useTransform(
        scrollY,
        [0, 50],
        ['blur(0px)', 'blur(12px)']
    );

    return (
        <div className="h-screen overflow-y-auto bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-[#6C47FF]/20">
            {/* Navbar */}
            <motion.nav
                style={{
                    backgroundColor: navBackground,
                    borderBottomWidth: 1,
                    borderBottomColor: navBorder,
                    backdropFilter: navBackdrop,
                    WebkitBackdropFilter: navBackdrop, // Safari support
                }}
                className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-12 transition-all duration-200"
            >
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2 font-bold text-lg tracking-tight cursor-pointer" onClick={onEnterSystem}>
                        <div className="w-5 h-5 bg-[#6C47FF] rounded-md flex items-center justify-center text-white text-xs">N</div>
                        <span>Nabd</span>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
                        <a href="#" className="hover:text-zinc-900 transition-colors">Dashboard</a>
                        <a href="#" className="hover:text-zinc-900 transition-colors">Analytics</a>
                        <a href="#" className="hover:text-zinc-900 transition-colors">Marketplace</a>
                        <a href="#" className="hover:text-zinc-900 transition-colors">Docs</a>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={onEnterSystem} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                        Sign in
                    </button>
                    <button onClick={onEnterSystem} className="text-sm font-medium bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all shadow-sm">
                        Enter System
                    </button>
                </div>
            </motion.nav>

            {/* Main Content */}
            <main className="pt-16">
                <HeroSection onEnterSystem={onEnterSystem} />
                <StatsSection />
                <ProcessSection />
                <MarketplaceSection />
                <AnalyticsSection />
                <PricingSection />
            </main>

            {/* Footer */}
            <footer className="bg-[#FAFAFA] border-t border-zinc-200 py-20">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 font-bold text-lg tracking-tight mb-6">
                            <div className="w-5 h-5 bg-[#6C47FF] rounded-md flex items-center justify-center text-white text-xs">N</div>
                            <span>Nabd System</span>
                        </div>
                        <div className="flex gap-4 mb-8">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 cursor-pointer transition-colors">𝕏</div>
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 cursor-pointer transition-colors">GH</div>
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 cursor-pointer transition-colors">in</div>
                        </div>
                        <p className="text-sm text-zinc-500">© 2026 Nabd Chain System.</p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-4 text-zinc-900">Platform</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><a href="#" className="hover:text-[#6C47FF]">Analytics</a></li>
                            <li><a href="#" className="hover:text-[#6C47FF]">Network</a></li>
                            <li><a href="#" className="hover:text-[#6C47FF]">Security</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-4 text-zinc-900">Resources</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><a href="#" className="hover:text-[#6C47FF]">Docs</a></li>
                            <li><a href="#" className="hover:text-[#6C47FF]">API</a></li>
                            <li><a href="#" className="hover:text-[#6C47FF]">Status</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-4 text-zinc-900">Company</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><a href="#" className="hover:text-[#6C47FF]">About</a></li>
                            <li><a href="#" className="hover:text-[#6C47FF]">Contact</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
};
