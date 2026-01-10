import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HeroSection } from './components/HeroSection';
import { StatsSection } from './components/StatsSection';
import { ProcessSection } from './components/ProcessSection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { MarketplaceSection } from './components/MarketplaceSection';
import { PricingSection } from './components/PricingSection';

import { useClerk } from '../../auth-adapter';
import { DeveloperLoginModal } from '../auth/DeveloperLoginModal';

export const LandingPage: React.FC<{ onEnterSystem: () => void }> = ({ onEnterSystem }) => {
    const [isDevLoginOpen, setIsDevLoginOpen] = React.useState(false);
    const { openSignIn } = useClerk();
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

    const handleUserSign = () => {
        // Check if we are in Mock Mode
        const isMockMode = localStorage.getItem('nabd_dev_mode') === 'true' || import.meta.env.VITE_USE_MOCK_AUTH === 'true';

        if (isMockMode) {
            // User wants Real Login but is currently in Dev Mode. 
            // We must exit Dev Mode to load Clerk.
            if (window.confirm("Switch to Standard Mode? This will enable real Google authentication.")) {
                localStorage.removeItem('nabd_dev_mode');
                localStorage.removeItem('mock_auth_token');
                window.location.reload();
            }
        } else {
            // Standard Clerk Login
            openSignIn({
                appearance: {
                    variables: {
                        colorPrimary: '#2563EB',
                    }
                }
            });
        }
    };

    return (
        <div className="h-screen overflow-y-auto bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-[#2563EB]/20">
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
                    <div className="flex items-center gap-2 font-bold text-lg tracking-tight cursor-pointer" onClick={handleUserSign}>
                        <div className="w-5 h-5 bg-[#2563EB] rounded-md flex items-center justify-center text-white text-xs">N</div>
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
                    <button
                        onClick={handleUserSign}
                        className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
                    >
                        User Sign
                    </button>
                    <button
                        onClick={() => setIsDevLoginOpen(true)}
                        className="bg-[#0A0A0A] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
                    >
                        Developer Sign
                    </button>
                </div>
            </motion.nav>

            {/* Main Content */}
            <main className="pt-16">
                <HeroSection onEnterSystem={handleUserSign} />
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
                            <div className="w-5 h-5 bg-[#2563EB] rounded-md flex items-center justify-center text-white text-xs">N</div>
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
                            <li><a href="#" className="hover:text-[#2563EB]">Analytics</a></li>
                            <li><a href="#" className="hover:text-[#2563EB]">Network</a></li>
                            <li><a href="#" className="hover:text-[#2563EB]">Security</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-4 text-zinc-900">Resources</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><a href="#" className="hover:text-[#2563EB]">Docs</a></li>
                            <li><a href="#" className="hover:text-[#2563EB]">API</a></li>
                            <li><a href="#" className="hover:text-[#2563EB]">Status</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-4 text-zinc-900">Company</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><a href="#" className="hover:text-[#2563EB]">About</a></li>
                            <li><a href="#" className="hover:text-[#2563EB]">Contact</a></li>
                            <li>
                                <button
                                    onClick={() => setIsDevLoginOpen(true)}
                                    className="text-zinc-500 hover:text-zinc-900 transition-colors text-left"
                                >
                                    Developer Access
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </footer>

            <DeveloperLoginModal isOpen={isDevLoginOpen} onClose={() => setIsDevLoginOpen(false)} />
        </div>
    );
};
