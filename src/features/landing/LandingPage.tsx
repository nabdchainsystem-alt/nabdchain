import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HeroSection } from './components/HeroSection';
import { FeaturesShowcase } from './components/FeaturesShowcase';
import { DashboardPreview } from './components/DashboardPreview';
import { TestimonialsSection } from './components/TestimonialsSection';
import { PricingSection } from './components/PricingSection';
import { MiniCompanyShowcase } from './components/MiniCompanyShowcase';

import { DeveloperLoginModal } from '../auth/DeveloperLoginModal';
import { List, X, SignIn, UserPlus } from 'phosphor-react';

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
    const { scrollY } = useScroll();

    const navWidth = useTransform(scrollY, [0, 100], ['100%', '80%']);
    const navTop = useTransform(scrollY, [0, 100], ['0px', '24px']);
    const navRadius = useTransform(scrollY, [0, 100], ['0px', '24px']);
    const navBackground = useTransform(scrollY, [0, 100], ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.8)']);
    const navBorder = useTransform(scrollY, [0, 100], ['rgba(0, 0, 0, 0)', 'rgba(228, 228, 231, 0.4)']);
    const navBackdrop = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(12px)']);

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
        { label: 'Mini Company', href: '#mini-company' },
        { label: 'Dashboard', href: '#dashboard' },
        { label: 'Pricing', href: '#pricing' },
    ];

    return (
        <div className="h-screen overflow-y-auto bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 scroll-smooth">
            {/* Navbar */}
            <motion.nav
                style={{
                    width: navWidth,
                    top: navTop,
                    borderRadius: navRadius,
                    backgroundColor: navBackground,
                    borderWidth: 1,
                    borderColor: navBorder,
                    backdropFilter: navBackdrop,
                    left: '50%',
                    x: '-50%',
                }}
                className="fixed z-50 transition-all duration-300 max-w-7xl"
            >
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className="w-7 h-7 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black text-sm font-bold">
                            N
                        </div>
                        <span className="text-base font-semibold tracking-tight">
                            nabd
                        </span>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-5">
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
                    <div className="flex items-center gap-3">
                        {/* Desktop Buttons */}
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                onClick={handleSignIn}
                                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                Sign out
                            </button>
                            <button
                                onClick={handleSignUp}
                                className="h-8 px-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-sm
                                hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all duration-200 flex items-center gap-1.5"
                            >
                                Dashboard
                                <ArrowRight size={14} weight="bold" />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <List size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <motion.div
                    initial={false}
                    animate={{ height: isMobileMenuOpen ? 'auto' : 0 }}
                    className="md:hidden overflow-hidden bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-900"
                >
                    <div className="p-6 space-y-4">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block text-lg font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-4 space-y-3">
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleSignIn();
                                }}
                                className="w-full h-12 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
                            >
                                <SignIn size={18} />
                                Sign In
                            </button>
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleSignUp();
                                }}
                                className="w-full h-12 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <UserPlus size={18} />
                                Get Started Free
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.nav>

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

                <div id="testimonials">
                    <TestimonialsSection />
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
