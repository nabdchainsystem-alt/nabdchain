import React, { useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { FeaturesShowcase } from './components/FeaturesShowcase';
import { DashboardPreview } from './components/DashboardPreview';
import { ToolsShowcase } from './components/ToolsShowcase';
import { PricingSection } from './components/PricingSection';
import { MiniCompanyShowcase } from './components/MiniCompanyShowcase';
import { LiveDemoSection } from './components/LiveDemoSection';

import { DeveloperLoginModal } from '../auth/DeveloperLoginModal';
import { List, X, SignIn, UserPlus, ArrowRight } from 'phosphor-react';

interface LandingPageProps {
    onEnterSystem: () => void;
    onNavigateToSignIn?: () => void;
    onNavigateToSignUp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
    onEnterSystem,
    onNavigateToSignIn,
    onNavigateToSignUp
}) => {
    const [isDevLoginOpen, setIsDevLoginOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSignIn = () => {
        if (onNavigateToSignIn) {
            onNavigateToSignIn();
        } else {
            onEnterSystem();
        }
    };

    const handleSignUp = () => {
        if (onNavigateToSignUp) {
            onNavigateToSignUp();
        } else {
            onEnterSystem();
        }
    };

    const navLinks = [
        { label: 'Features', href: '#features' },
        { label: 'Demo', href: '#demo' },
        { label: 'Dashboard', href: '#dashboard' },
        { label: 'Pricing', href: '#pricing' },
    ];

    return (
        <div className="h-screen overflow-y-auto bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 scroll-smooth">
            {/* Navbar - responsive width */}
            <nav
                className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] md:w-[70%] max-w-4xl z-50 rounded-full
                    bg-white/90 dark:bg-zinc-900/90
                    border border-zinc-200/50 dark:border-zinc-700/50
                    backdrop-blur-md
                    shadow-lg shadow-black/5 dark:shadow-black/20"
            >
                <div className="w-full mx-auto px-3 sm:px-5 h-11 sm:h-12 flex items-center justify-between">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-black dark:bg-white rounded-md sm:rounded-lg flex items-center justify-center text-white dark:text-black text-xs sm:text-sm font-bold">
                            N
                        </div>
                        <span className="text-sm sm:text-base font-semibold tracking-tight">
                            nabd
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4 lg:gap-5">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Desktop Buttons */}
                        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={handleSignIn}
                                className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                Sign in
                            </button>
                            <button
                                onClick={handleSignUp}
                                className="h-7 sm:h-8 px-3 sm:px-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-xs sm:text-sm
                                hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors duration-200 flex items-center gap-1.5"
                            >
                                Dashboard
                                <ArrowRight size={12} weight="bold" />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <List size={20} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <>
                    {/* Invisible tap-to-close area */}
                    <div
                        className="fixed inset-0 z-40 sm:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    {/* Menu */}
                    <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[92%] z-50 sm:hidden
                        bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
                        <div className="p-4 space-y-1">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block py-2.5 px-3 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-3 mt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        handleSignIn();
                                    }}
                                    className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <SignIn size={16} />
                                    Sign In
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        handleSignUp();
                                    }}
                                    className="w-full h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserPlus size={16} />
                                    Get Started Free
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content */}
            <main>
                <HeroSection onEnterSystem={handleSignUp} />

                <div id="features">
                    <FeaturesShowcase />
                </div>

                <div id="mini-company">
                    <MiniCompanyShowcase onExplore={handleSignUp} />
                </div>

                <div id="dashboard">
                    <DashboardPreview />
                </div>

                <div id="demo">
                    <LiveDemoSection onTryDemo={handleSignUp} />
                </div>

                <div id="testimonials">
                    <ToolsShowcase />
                </div>

                <div id="pricing">
                    <PricingSection onGetStarted={handleSignUp} />
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-black text-white py-20 border-t border-zinc-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
                        {/* Brand Column */}
                        <div className="col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black text-lg font-bold">
                                    N
                                </div>
                                <span className="text-xl font-bold tracking-tight">
                                    Nabd
                                </span>
                            </div>
                            <p className="text-zinc-500 text-sm mb-6 max-w-xs">
                                The complete platform for modern business management.
                                Streamline operations, boost productivity, and drive growth.
                            </p>
                            <div className="flex gap-4">
                                {['X', 'GH', 'in', 'YT'].map((social) => (
                                    <a
                                        key={social}
                                        href="#"
                                        className="w-10 h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        {social}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Links Columns */}
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-zinc-500">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#mini-company" className="hover:text-white transition-colors">Mini Company</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Resources</h4>
                            <ul className="space-y-3 text-sm text-zinc-500">
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-3 text-sm text-zinc-500">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li>
                                    <button
                                        onClick={() => setIsDevLoginOpen(true)}
                                        className="hover:text-white transition-colors text-left"
                                    >
                                        Developer Access
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-zinc-600">
                            &copy; 2026 Nabd Chain System. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-zinc-600">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>

            <DeveloperLoginModal isOpen={isDevLoginOpen} onClose={() => setIsDevLoginOpen(false)} />
        </div>
    );
};
