import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { HeroSection } from './components/HeroSection';
import { FeaturesShowcase } from './components/FeaturesShowcase';
import { DashboardPreview } from './components/DashboardPreview';
import { ToolsShowcase } from './components/ToolsShowcase';
import { PricingSection } from './components/PricingSection';
import { MiniCompanyShowcase } from './components/MiniCompanyShowcase';
import { LiveDemoSection } from './components/LiveDemoSection';
import { MarketplaceShowcase } from './components/MarketplaceShowcase';
import { LandingLanguage, getTranslation } from './translations';

import { DeveloperLoginModal } from '../auth/DeveloperLoginModal';
import { PortalLoginModal } from '../auth/PortalLoginModal';
import { PortalSignupModal } from '../auth/PortalSignupModal';
import { List, X, SignIn, UserPlus, ArrowRight, ArrowLeft, Translate } from 'phosphor-react';

// Section background types for navbar color switching
type SectionTheme = 'light' | 'dark';

// Language context for landing page
interface LandingContextType {
    lang: LandingLanguage;
    t: (key: string) => string;
    isRTL: boolean;
}

export const LandingContext = createContext<LandingContextType>({
    lang: 'en',
    t: (key: string) => key,
    isRTL: false,
});

export const useLandingContext = () => useContext(LandingContext);

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
    const [isPortalLoginOpen, setIsPortalLoginOpen] = useState(false);
    const [isPortalSignupOpen, setIsPortalSignupOpen] = useState(false);
    const [portalTab, setPortalTab] = useState<'buyer' | 'seller'>('buyer');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [navTheme, setNavTheme] = useState<SectionTheme>('light');
    const [lang, setLang] = useState<LandingLanguage>('en');

    const isRTL = lang === 'ar';
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    // Translation helper
    const t = (key: string): string => {
        try {
            return getTranslation(key as any, lang);
        } catch {
            return key;
        }
    };

    // Refs for sections to observe
    const heroRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const miniCompanyRef = useRef<HTMLDivElement>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);
    const demoRef = useRef<HTMLDivElement>(null);
    const marketplaceRef = useRef<HTMLDivElement>(null);
    const toolsRef = useRef<HTMLDivElement>(null);
    const boardViewsRef = useRef<HTMLDivElement | null>(null);
    const pricingRef = useRef<HTMLDivElement>(null);

    // Callback to receive boardViews element from ToolsShowcase
    const handleBoardViewsMount = useCallback((el: HTMLDivElement | null) => {
        boardViewsRef.current = el;
    }, []);

    // Track which section is in view and update navbar theme
    useEffect(() => {
        const sectionThemes: { ref: React.RefObject<HTMLDivElement>; theme: SectionTheme }[] = [
            { ref: heroRef, theme: 'light' },
            { ref: featuresRef, theme: 'dark' },
            { ref: miniCompanyRef, theme: 'light' },
            { ref: dashboardRef, theme: 'dark' },
            { ref: demoRef, theme: 'light' },
            { ref: marketplaceRef, theme: 'dark' },
            { ref: toolsRef, theme: 'dark' },
            { ref: boardViewsRef, theme: 'light' },
            { ref: pricingRef, theme: 'dark' },
        ];

        const checkNavbarTheme = () => {
            const navbarHeight = 60;

            for (let i = sectionThemes.length - 1; i >= 0; i--) {
                const section = sectionThemes[i];
                if (section.ref.current) {
                    const rect = section.ref.current.getBoundingClientRect();
                    if (rect.top <= navbarHeight) {
                        setNavTheme(section.theme);
                        return;
                    }
                }
            }
            setNavTheme('light');
        };

        const scrollContainer = document.querySelector('.h-screen.overflow-y-auto');

        checkNavbarTheme();

        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', checkNavbarTheme, { passive: true });
            return () => scrollContainer.removeEventListener('scroll', checkNavbarTheme);
        }
    }, []);

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

    const toggleLanguage = () => {
        setLang(prev => prev === 'en' ? 'ar' : 'en');
    };

    const navLinks = [
        { key: 'features', href: '#features' },
        { key: 'demo', href: '#demo' },
        { key: 'pricing', href: '#pricing' },
    ];

    return (
        <LandingContext.Provider value={{ lang, t, isRTL }}>
            <div
                dir={isRTL ? 'rtl' : 'ltr'}
                className={`h-screen overflow-y-auto bg-white dark:bg-black text-black dark:text-white selection:bg-zinc-200 dark:selection:bg-zinc-800 scroll-smooth ${isRTL ? 'font-arabic' : 'font-sans'}`}
                style={isRTL ? { fontFamily: "'Noto Kufi Arabic', system-ui, sans-serif" } : undefined}
            >
                {/* Top Announcement Bar */}
                <div className="fixed top-0 left-0 right-0 z-[60] bg-black text-white py-2 px-4 text-center text-sm">
                    <span className="text-zinc-300">
                        {isRTL ? 'نبض الآن متاح للجميع' : 'Nabd is now available for everyone'}
                    </span>
                    <span className="mx-2 text-zinc-500">·</span>
                    <a href="#pricing" className="text-white hover:underline font-medium">
                        {isRTL ? 'اعرف المزيد' : 'Learn more'} →
                    </a>
                </div>

                {/* Navbar - responsive width with dynamic theme */}
                <nav
                    className={`fixed top-10 sm:top-12 left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] md:w-[70%] max-w-4xl z-50 rounded-full
                        backdrop-blur-md shadow-lg transition-all duration-300
                        ${navTheme === 'light'
                            ? 'bg-white/90 border border-zinc-200/50 shadow-black/5 text-zinc-900'
                            : 'bg-zinc-900/90 border border-zinc-700/50 shadow-black/20 text-white'
                        }`}
                >
                    <div className="w-full mx-auto px-3 sm:px-5 h-11 sm:h-12 flex items-center justify-between">
                        {/* Logo */}
                        <div
                            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold transition-colors duration-300
                                ${navTheme === 'light' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
                                N
                            </div>
                            <span className="text-sm sm:text-base font-semibold tracking-tight">
                                {isRTL ? 'نبض' : 'nabd'}
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-4 lg:gap-5">
                            {navLinks.map((link) => (
                                <a
                                    key={link.key}
                                    href={link.href}
                                    className={`text-sm transition-colors ${navTheme === 'light'
                                        ? 'text-zinc-600 hover:text-zinc-900'
                                        : 'text-zinc-400 hover:text-white'}`}
                                >
                                    {t(link.key)}
                                </a>
                            ))}
                        </div>

                        {/* Auth Buttons & Language Toggle */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Language Toggle - Desktop */}
                            <button
                                onClick={toggleLanguage}
                                className={`hidden sm:flex items-center gap-1.5 text-xs sm:text-sm px-2.5 py-1.5 rounded-full transition-colors ${navTheme === 'light'
                                    ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                            >
                                <Translate size={14} />
                                {lang === 'en' ? 'AR' : 'EN'}
                            </button>

                            {/* Desktop Buttons */}
                            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={handleSignIn}
                                    className={`text-xs sm:text-sm transition-colors ${navTheme === 'light'
                                        ? 'text-zinc-600 hover:text-zinc-900'
                                        : 'text-zinc-400 hover:text-white'}`}
                                >
                                    {t('signIn')}
                                </button>
                                <button
                                    onClick={handleSignUp}
                                    className={`h-7 sm:h-8 px-3 sm:px-4 rounded-full text-xs sm:text-sm
                                    transition-colors duration-200 flex items-center gap-1.5
                                    ${navTheme === 'light'
                                        ? 'bg-zinc-900 text-white hover:bg-zinc-700'
                                        : 'bg-white text-zinc-900 hover:bg-zinc-200'}`}
                                >
                                    {t('signUp')}
                                    <ArrowIcon size={12} weight="bold" />
                                </button>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className={`sm:hidden w-8 h-8 flex items-center justify-center rounded-md transition-colors
                                    ${navTheme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800'}`}
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <List size={20} />}
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 sm:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <div className={`fixed top-24 left-1/2 -translate-x-1/2 w-[92%] z-50 sm:hidden rounded-2xl shadow-lg transition-colors
                            ${navTheme === 'light'
                                ? 'bg-white border border-zinc-200'
                                : 'bg-zinc-900 border border-zinc-800'}`}>
                            <div className="p-4 space-y-1">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.key}
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`block py-2.5 px-3 rounded-lg text-base font-medium transition-colors
                                            ${navTheme === 'light'
                                                ? 'text-zinc-700 hover:bg-zinc-100'
                                                : 'text-zinc-300 hover:bg-zinc-800'}`}
                                    >
                                        {t(link.key)}
                                    </a>
                                ))}

                                {/* Language Toggle - Mobile */}
                                <button
                                    onClick={() => {
                                        toggleLanguage();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full py-2.5 px-3 rounded-lg text-base font-medium transition-colors flex items-center gap-2
                                        ${navTheme === 'light'
                                            ? 'text-zinc-700 hover:bg-zinc-100'
                                            : 'text-zinc-300 hover:bg-zinc-800'}`}
                                >
                                    <Translate size={18} />
                                    {lang === 'en' ? 'العربية' : 'English'}
                                </button>

                                <div className={`pt-3 mt-2 border-t space-y-2 ${navTheme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            handleSignIn();
                                        }}
                                        className={`w-full h-11 rounded-xl border font-medium text-sm transition-colors flex items-center justify-center gap-2
                                            ${navTheme === 'light'
                                                ? 'border-zinc-200 text-zinc-900 hover:bg-zinc-50'
                                                : 'border-zinc-700 text-white hover:bg-zinc-800'}`}
                                    >
                                        <SignIn size={16} />
                                        {t('signIn')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            handleSignUp();
                                        }}
                                        className={`w-full h-11 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2
                                            ${navTheme === 'light'
                                                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                                                : 'bg-white text-zinc-900 hover:bg-zinc-100'}`}
                                    >
                                        <UserPlus size={16} />
                                        {t('getStarted')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Main Content */}
                <main>
                    <div ref={heroRef}>
                        <HeroSection onEnterSystem={handleSignUp} />
                    </div>

                    <div id="features" ref={featuresRef}>
                        <FeaturesShowcase />
                    </div>

                    <div id="mini-company" ref={miniCompanyRef}>
                        <MiniCompanyShowcase onExplore={handleSignUp} />
                    </div>

                    <div id="dashboard" ref={dashboardRef}>
                        <DashboardPreview />
                    </div>

                    <div id="demo" ref={demoRef}>
                        <LiveDemoSection onTryDemo={handleSignUp} />
                    </div>

                    <div id="marketplace" ref={marketplaceRef}>
                        <MarketplaceShowcase onExplore={handleSignUp} />
                    </div>

                    <div id="testimonials" ref={toolsRef}>
                        <ToolsShowcase onBoardViewsMount={handleBoardViewsMount} />
                    </div>

                    <div id="pricing" ref={pricingRef}>
                        <PricingSection onGetStarted={handleSignUp} />
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-black text-white py-20 border-t border-zinc-900">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
                            {/* Brand Column */}
                            <div className="col-span-2">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black text-lg font-bold">
                                        N
                                    </div>
                                    <span className="text-xl font-bold tracking-tight">
                                        {isRTL ? 'نبض' : 'Nabd'}
                                    </span>
                                </div>
                                <p className="text-zinc-500 text-sm mb-6 max-w-xs">
                                    {t('footerDesc')}
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
                                <h4 className="font-semibold mb-4">{t('product')}</h4>
                                <ul className="space-y-3 text-sm text-zinc-500">
                                    <li><a href="#features" className="hover:text-white transition-colors">{t('features')}</a></li>
                                    <li><a href="#mini-company" className="hover:text-white transition-colors">{isRTL ? 'الشركة المصغرة' : 'Mini Company'}</a></li>
                                    <li><a href="#pricing" className="hover:text-white transition-colors">{t('pricing')}</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">{t('changelog')}</a></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-4">{t('resources')}</h4>
                                <ul className="space-y-3 text-sm text-zinc-500">
                                    <li><a href="#" className="hover:text-white transition-colors">{t('documentation')}</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">{t('apiReference')}</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">{t('guides')}</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">{t('helpCenter')}</a></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-4">{t('company')}</h4>
                                <ul className="space-y-3 text-sm text-zinc-500">
                                    <li><a href="#" className="hover:text-white transition-colors">{t('about')}</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">{t('blog')}</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">{t('careers')}</a></li>
                                    <li>
                                        <button
                                            onClick={() => setIsDevLoginOpen(true)}
                                            className="hover:text-white transition-colors text-start"
                                        >
                                            {t('developerAccess')}
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-4">{isRTL ? 'البوابة' : 'Portal'}</h4>
                                <ul className="space-y-3 text-sm text-zinc-500">
                                    <li>
                                        <button
                                            onClick={() => {
                                                setPortalTab('buyer');
                                                setIsPortalLoginOpen(true);
                                            }}
                                            className="hover:text-white transition-colors text-start"
                                        >
                                            {isRTL ? 'تسجيل دخول المشتري' : 'Buyer Sign In'}
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => {
                                                setPortalTab('buyer');
                                                setIsPortalSignupOpen(true);
                                            }}
                                            className="hover:text-white transition-colors text-start"
                                        >
                                            {isRTL ? 'إنشاء حساب مشتري' : 'Buyer Sign Up'}
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => {
                                                setPortalTab('seller');
                                                setIsPortalLoginOpen(true);
                                            }}
                                            className="hover:text-white transition-colors text-start"
                                        >
                                            {isRTL ? 'تسجيل دخول البائع' : 'Seller Sign In'}
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => {
                                                setPortalTab('seller');
                                                setIsPortalSignupOpen(true);
                                            }}
                                            className="hover:text-white transition-colors text-start"
                                        >
                                            {isRTL ? 'إنشاء حساب بائع' : 'Seller Sign Up'}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-zinc-600">
                                &copy; 2026 {isRTL ? 'نظام نبض.' : 'Nabd Chain System.'} {t('allRightsReserved')}
                            </p>
                            <div className="flex gap-6 text-sm text-zinc-600">
                                <a href="#" className="hover:text-white transition-colors">{t('privacyPolicy')}</a>
                                <a href="#" className="hover:text-white transition-colors">{t('termsOfService')}</a>
                                <a href="#" className="hover:text-white transition-colors">{t('cookiePolicy')}</a>
                            </div>
                        </div>
                    </div>
                </footer>

                <DeveloperLoginModal isOpen={isDevLoginOpen} onClose={() => setIsDevLoginOpen(false)} />
                <PortalLoginModal isOpen={isPortalLoginOpen} onClose={() => setIsPortalLoginOpen(false)} defaultTab={portalTab} />
                <PortalSignupModal
                    isOpen={isPortalSignupOpen}
                    onClose={() => setIsPortalSignupOpen(false)}
                    defaultTab={portalTab}
                    onSwitchToLogin={() => {
                        setIsPortalSignupOpen(false);
                        setIsPortalLoginOpen(true);
                    }}
                />
            </div>
        </LandingContext.Provider>
    );
};
