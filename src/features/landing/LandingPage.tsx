import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HeroSection } from './components/HeroSection';
import { FeaturesShowcase } from './components/FeaturesShowcase';
import { DashboardPreview } from './components/DashboardPreview';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CTASection } from './components/CTASection';

import { useClerk } from '../../auth-adapter';
import { DeveloperLoginModal } from '../auth/DeveloperLoginModal';
import { List, X } from 'phosphor-react';

export const LandingPage: React.FC<{ onEnterSystem: () => void }> = ({ onEnterSystem }) => {
    const [isDevLoginOpen, setIsDevLoginOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { openSignIn } = useClerk();
    const { scrollY } = useScroll();

    const navBackground = useTransform(
        scrollY,
        [0, 100],
        ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']
    );
    const navBorder = useTransform(
        scrollY,
        [0, 100],
        ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.05)']
    );

    const handleUserSign = () => {
        // Clear mock mode if active, then open real sign-in
        const isMockMode = localStorage.getItem('nabd_dev_mode') === 'true';

        if (isMockMode) {
            localStorage.removeItem('nabd_dev_mode');
            localStorage.removeItem('mock_auth_token');
        }

        openSignIn({
            appearance: {
                variables: {
                    colorPrimary: '#000000',
                    colorText: '#000000',
                    colorTextSecondary: '#71717a',
                    colorBackground: '#ffffff',
                },
                elements: {
                    // Hide Google/social sign-in buttons
                    socialButtons: "hidden",
                    socialButtonsBlockButton: "hidden",
                    dividerRow: "hidden",
                    footer: "hidden",
                    formButtonPrimary: "bg-black hover:bg-zinc-800 text-white",
                }
            }
        });
    };

    const navLinks = [
        { label: 'Features', href: '#features' },
        { label: 'Dashboard', href: '#dashboard' },
        { label: 'Testimonials', href: '#testimonials' },
        { label: 'Pricing', href: '#pricing' },
    ];

    return (
        <div className="h-screen overflow-y-auto bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 scroll-smooth">
            {/* Navbar */}
            <motion.nav
                style={{
                    backgroundColor: navBackground,
                    borderBottomWidth: 1,
                    borderBottomColor: navBorder,
                }}
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={handleUserSign}
                    >
                        <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black text-lg font-bold">
                            N
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            Nabd
                        </span>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
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
                                onClick={handleUserSign}
                                className="h-10 px-5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-semibold
                                hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200"
                            >
                                User Sign
                            </button>
                            <button
                                onClick={() => setIsDevLoginOpen(true)}
                                className="h-10 px-5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-sm font-semibold
                                hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all duration-200"
                            >
                                Developer Sign
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
                                onClick={handleUserSign}
                                className="w-full h-12 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                            >
                                User Sign
                            </button>
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    setIsDevLoginOpen(true);
                                }}
                                className="w-full h-12 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Developer Sign
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.nav>

            {/* Main Content */}
            <main>
                <HeroSection onEnterSystem={handleUserSign} />

                <div id="features">
                    <FeaturesShowcase />
                </div>

                <div id="dashboard">
                    <DashboardPreview />
                </div>

                <div id="testimonials">
                    <TestimonialsSection />
                </div>

                <div id="pricing">
                    <CTASection onGetStarted={handleUserSign} />
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
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
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
