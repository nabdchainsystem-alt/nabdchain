import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
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
import { List, X, ArrowRight, ArrowLeft, Translate } from 'phosphor-react';

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

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterSystem, onNavigateToSignIn, onNavigateToSignUp }) => {
  const [isDevLoginOpen, setIsDevLoginOpen] = useState(false);
  const [isPortalLoginOpen, setIsPortalLoginOpen] = useState(false);
  const [isPortalSignupOpen, setIsPortalSignupOpen] = useState(false);
  const [portalTab, setPortalTab] = useState<'buyer' | 'seller'>('buyer');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<LandingLanguage>('en');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const t = (key: string): string => {
    try {
      return getTranslation(key as Parameters<typeof getTranslation>[0], lang);
    } catch {
      return key;
    }
  };

  // Track scroll for navbar background
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrolled(container.scrollTop > 50);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
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
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  return (
    <LandingContext.Provider value={{ lang, t, isRTL }}>
      <div
        ref={scrollContainerRef}
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`h-screen overflow-y-auto bg-white text-zinc-900 scroll-smooth ${isRTL ? 'font-arabic' : ''}`}
        style={
          isRTL
            ? { fontFamily: "'Noto Kufi Arabic', system-ui, sans-serif" }
            : { fontFamily: "'SF Pro Display', 'SF Pro Text', 'Figtree', system-ui, -apple-system, sans-serif" }
        }
      >
        {/* ── Apple-style Navbar ── */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500
            ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-zinc-200/60' : 'bg-transparent'}`}
        >
          <div className="max-w-[1024px] mx-auto px-6 h-12 flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                N
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-zinc-900">{isRTL ? 'نبض' : 'nabd'}</span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-7">
              {[
                { key: 'features', href: '#features' },
                { key: 'demo', href: '#demo' },
                { key: 'pricing', href: '#pricing' },
              ].map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  {t(link.key)}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <Translate size={14} />
                {lang === 'en' ? 'AR' : 'EN'}
              </button>

              <div className="hidden sm:flex items-center gap-4">
                <button onClick={handleSignIn} className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                  {t('signIn')}
                </button>
                <button
                  onClick={handleSignUp}
                  className="h-7 px-4 rounded-full bg-zinc-900 text-white text-xs font-medium
                    hover:bg-zinc-700 transition-all duration-200 flex items-center gap-1.5"
                >
                  {t('getStarted')}
                  <ArrowIcon size={11} weight="bold" />
                </button>
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden w-8 h-8 flex items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                {isMobileMenuOpen ? <X size={18} /> : <List size={18} />}
              </button>
            </div>
          </div>
        </nav>

        {/* ── Mobile Menu ── */}
        {isMobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed top-12 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-xl border-b border-zinc-200">
              <div className="max-w-[1024px] mx-auto p-5 space-y-1">
                {[
                  { key: 'features', href: '#features' },
                  { key: 'demo', href: '#demo' },
                  { key: 'pricing', href: '#pricing' },
                ].map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2.5 text-base font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    {t(link.key)}
                  </a>
                ))}

                <button
                  onClick={() => {
                    toggleLanguage();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-base font-medium text-zinc-700 flex items-center gap-2"
                >
                  <Translate size={18} />
                  {lang === 'en' ? 'العربية' : 'English'}
                </button>

                <div className="pt-4 mt-3 border-t border-zinc-100 space-y-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignIn();
                    }}
                    className="w-full h-11 rounded-xl border border-zinc-200 text-zinc-900 text-sm font-medium"
                  >
                    {t('signIn')}
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignUp();
                    }}
                    className="w-full h-11 rounded-xl bg-zinc-900 text-white text-sm font-medium"
                  >
                    {t('getStarted')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Main Content ── */}
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

          <div id="marketplace">
            <MarketplaceShowcase onExplore={handleSignUp} />
          </div>

          <div id="testimonials">
            <ToolsShowcase />
          </div>

          <div id="pricing">
            <PricingSection onGetStarted={handleSignUp} />
          </div>

          {/* ── Final CTA Section (Apple-style) ── */}
          <section className="py-32 sm:py-40 bg-zinc-950 text-white">
            <div className="max-w-[980px] mx-auto px-6 text-center">
              <h2
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6"
                style={{ whiteSpace: 'pre-line' }}
              >
                {t('ctaHeadline')}
              </h2>
              <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-lg mx-auto">{t('ctaSub')}</p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={handleSignUp}
                  className="h-12 px-8 rounded-full bg-white text-zinc-900 text-sm font-semibold
                    hover:bg-zinc-200 transition-all duration-200 flex items-center gap-2"
                >
                  {t('getStarted')}
                  <ArrowIcon size={14} weight="bold" />
                </button>
                <a
                  href="#demo"
                  className="h-12 px-8 rounded-full border border-zinc-700 text-white text-sm font-semibold
                    hover:border-zinc-500 transition-all duration-200 flex items-center gap-2"
                >
                  {t('watchTheFilm')}
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer (Apple-style with all auth links) ── */}
        <footer className="bg-zinc-950 border-t border-zinc-800/50">
          <div className="max-w-[980px] mx-auto px-6 pt-16 pb-8">
            {/* Footer Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mb-16">
              {/* Product */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">{t('product')}</h4>
                <ul className="space-y-2.5">
                  {[
                    { label: t('features'), href: '#features' },
                    { label: isRTL ? 'الشركة المصغرة' : 'Mini Company', href: '#mini-company' },
                    { label: t('pricing'), href: '#pricing' },
                    { label: t('changelog'), href: '#' },
                  ].map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="text-sm text-zinc-500 hover:text-white transition-colors">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">{t('resources')}</h4>
                <ul className="space-y-2.5">
                  {[t('documentation'), t('apiReference'), t('guides'), t('helpCenter')].map((label) => (
                    <li key={label}>
                      <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">{t('company')}</h4>
                <ul className="space-y-2.5">
                  {[t('about'), t('blog'), t('careers')].map((label) => (
                    <li key={label}>
                      <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Portal */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">{t('portal')}</h4>
                <ul className="space-y-2.5">
                  <li>
                    <button
                      onClick={() => {
                        setPortalTab('buyer');
                        setIsPortalLoginOpen(true);
                      }}
                      className="text-sm text-zinc-500 hover:text-white transition-colors text-start"
                    >
                      {t('buyerSignIn')}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setPortalTab('buyer');
                        setIsPortalSignupOpen(true);
                      }}
                      className="text-sm text-zinc-500 hover:text-white transition-colors text-start"
                    >
                      {t('buyerSignUp')}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setPortalTab('seller');
                        setIsPortalLoginOpen(true);
                      }}
                      className="text-sm text-zinc-500 hover:text-white transition-colors text-start"
                    >
                      {t('sellerSignIn')}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setPortalTab('seller');
                        setIsPortalSignupOpen(true);
                      }}
                      className="text-sm text-zinc-500 hover:text-white transition-colors text-start"
                    >
                      {t('sellerSignUp')}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Account */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">{t('account')}</h4>
                <ul className="space-y-2.5">
                  <li>
                    <button
                      onClick={handleSignIn}
                      className="text-sm text-zinc-500 hover:text-white transition-colors text-start"
                    >
                      {t('appSignIn')}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleSignUp}
                      className="text-sm text-zinc-500 hover:text-white transition-colors text-start"
                    >
                      {t('signUp')}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsDevLoginOpen(true)}
                      className="text-sm text-zinc-500 hover:text-white transition-colors text-start"
                    >
                      {t('developerAccess')}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsDevLoginOpen(true)}
                      className="text-sm text-zinc-500 hover:text-white transition-colors text-start"
                    >
                      {t('adminLogin')}
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-800/60 pt-6">
              {/* Bottom row */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-zinc-900 text-[10px] font-bold">
                    N
                  </div>
                  <p className="text-xs text-zinc-600">
                    &copy; 2026 {isRTL ? 'نظام نبض.' : 'Nabd Chain System.'} {t('allRightsReserved')}
                  </p>
                </div>
                <div className="flex gap-5 text-xs text-zinc-600">
                  <a href="#" className="hover:text-zinc-400 transition-colors">
                    {t('privacyPolicy')}
                  </a>
                  <a href="#" className="hover:text-zinc-400 transition-colors">
                    {t('termsOfService')}
                  </a>
                  <a href="#" className="hover:text-zinc-400 transition-colors">
                    {t('cookiePolicy')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>

        {/* ── Modals ── */}
        <DeveloperLoginModal isOpen={isDevLoginOpen} onClose={() => setIsDevLoginOpen(false)} />
        <PortalLoginModal
          isOpen={isPortalLoginOpen}
          onClose={() => setIsPortalLoginOpen(false)}
          defaultTab={portalTab}
          onSwitchToSignup={() => {
            setIsPortalLoginOpen(false);
            setIsPortalSignupOpen(true);
          }}
        />
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
