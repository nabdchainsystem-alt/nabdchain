import React, { useState, useRef, memo, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    Check, Crown, Lightning, Rocket, Buildings, Users, Database,
    Headset, ChartLineUp, ArrowRight, ArrowLeft, Sparkle, Shield, CaretLeft, CaretRight
} from 'phosphor-react';
import { useLandingContext } from '../LandingPage';

interface PricingTier {
    id: string;
    name: string;
    icon: React.ElementType;
    monthlyPrice: number;
    yearlyPrice: number;
    description: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
    cta: string;
}

const getPricingTiers = (isRTL: boolean): PricingTier[] => [
    {
        id: 'starter',
        name: isRTL ? 'المبتدئ' : 'Starter',
        icon: Rocket,
        monthlyPrice: 32,
        yearlyPrice: 16,
        description: isRTL ? 'للفرق الصغيرة التي تبدأ' : 'For small teams getting started',
        features: isRTL ? [
            'حتى 5 أعضاء فريق',
            'عروض اللوحة والجدول وكانبان',
            '10 جيجابايت تخزين',
            'دعم بالبريد الإلكتروني',
            'لوحات معلومات أساسية',
            '5 قواعد أتمتة',
        ] : [
            'Up to 5 team members',
            'Board, Table & Kanban views',
            '10 GB storage',
            'Email support',
            'Basic dashboards',
            '5 automation rules',
        ],
        cta: isRTL ? 'ابدأ مجاناً' : 'Start Free',
    },
    {
        id: 'professional',
        name: isRTL ? 'الاحترافي' : 'Professional',
        icon: Crown,
        monthlyPrice: 56,
        yearlyPrice: 25,
        description: isRTL ? 'للفرق النامية التي تحتاج للقوة' : 'For growing teams that need power',
        features: isRTL ? [
            'حتى 25 عضو فريق',
            'جميع عروض اللوحة الـ 14',
            '50 جيجابايت تخزين',
            'دعم ذو أولوية',
            'الشركة المصغرة: المبيعات والمخزون',
            'أتمتة متقدمة',
            'تتبع الوقت',
            '24 نوع عمود',
        ] : [
            'Up to 25 team members',
            'All 14 board views',
            '50 GB storage',
            'Priority support',
            'Mini Company: Sales & Inventory',
            'Advanced automation',
            'Time tracking',
            '24 column types',
        ],
        highlighted: true,
        badge: isRTL ? 'الأكثر شعبية' : 'Most Popular',
        cta: isRTL ? 'ابدأ تجربة مجانية' : 'Start Free Trial',
    },
    {
        id: 'enterprise',
        name: isRTL ? 'المؤسسات' : 'Enterprise',
        icon: Buildings,
        monthlyPrice: 73,
        yearlyPrice: 35,
        description: isRTL ? 'القوة الكاملة للمؤسسات الكبيرة' : 'Full power for large organizations',
        features: isRTL ? [
            'أعضاء فريق غير محدودين',
            'مجموعة الشركة المصغرة الكاملة',
            '500 جيجابايت تخزين',
            'مدير دعم مخصص',
            'تكاملات مخصصة',
            'تحليلات متقدمة',
            'خيارات العلامة البيضاء',
            'الوصول لـ API',
            'أكثر من 50 لوحة جاهزة',
        ] : [
            'Unlimited team members',
            'Full Mini Company suite',
            '500 GB storage',
            'Dedicated support manager',
            'Custom integrations',
            'Advanced analytics',
            'White-label options',
            'API access',
            '50+ ready dashboards',
        ],
        cta: isRTL ? 'تواصل مع المبيعات' : 'Contact Sales',
    },
];

// Feature item with animated check - styled to match dashboard
const FeatureItem: React.FC<{ feature: string; highlighted?: boolean; index: number }> = memo(({ feature, highlighted, index }) => (
    <li
        className="flex items-start gap-3 opacity-0"
        style={{
            animation: 'fadeInLeft 0.3s ease-out forwards',
            animationDelay: `${0.3 + index * 0.05}s`
        }}
    >
        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
            highlighted
                ? 'bg-white text-zinc-900'
                : 'bg-zinc-700/50 border border-zinc-600/50 text-zinc-300'
        }`}>
            <Check size={10} weight="bold" />
        </div>
        <span className={`text-sm ${highlighted ? 'text-zinc-300' : 'text-zinc-400'}`}>
            {feature}
        </span>
    </li>
));

// Animated price counter
const AnimatedPrice: React.FC<{ price: number; highlighted?: boolean }> = memo(({ price, highlighted }) => {
    const [displayPrice, setDisplayPrice] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = price;
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setDisplayPrice(Math.floor(start + (end - start) * easeOut));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [price]);

    return (
        <span className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
            {displayPrice}
        </span>
    );
});

interface PricingCardProps {
    tier: PricingTier;
    isYearly: boolean;
    onGetStarted: () => void;
    index: number;
    isRTL: boolean;
}

// Pricing card component
const PricingCard: React.FC<PricingCardProps> = memo(({ tier, isYearly, onGetStarted, index, isRTL }) => {
    const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
    const Icon = tier.icon;
    const savings = Math.round((1 - tier.yearlyPrice / tier.monthlyPrice) * 100);
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    return (
        <div
            className={`group relative flex-shrink-0 w-[300px] sm:w-auto
                transition-all duration-500 ${tier.highlighted ? 'sm:scale-[1.03] z-10' : 'hover:scale-[1.01]'}`}
            style={{
                opacity: 0,
                animation: 'fadeInUp 0.5s ease-out forwards',
                animationDelay: `${0.1 + index * 0.1}s`
            }}
        >
            {/* Animated glow effect for highlighted card */}
            {tier.highlighted && (
                <>
                    <div className="absolute -inset-[2px] rounded-[26px] bg-gradient-to-r from-violet-500 via-white to-cyan-500 opacity-75 blur-sm"
                         style={{ animation: 'glowPulse 3s ease-in-out infinite' }} />
                    <div className="absolute -inset-[1px] rounded-[25px] bg-gradient-to-r from-violet-500 via-white to-cyan-500"
                         style={{ animation: 'glowRotate 4s linear infinite' }} />
                </>
            )}
            <div className={`h-full rounded-3xl p-6 sm:p-8 transition-all duration-300 relative ${
                tier.highlighted
                    ? 'bg-zinc-800/70 border-2 border-transparent'
                    : 'bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600/50 hover:bg-zinc-800/70 hover:shadow-lg'
            }`}>
                {/* Badge */}
                {tier.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-zinc-900 text-xs font-bold shadow-lg">
                            <Sparkle size={12} weight="fill" />
                            {tier.badge}
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${
                        tier.highlighted
                            ? 'bg-white text-zinc-900'
                            : 'bg-zinc-700/50 border border-zinc-600/50 text-zinc-300'
                    }`}>
                        <Icon size={24} weight="fill" />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${
                        tier.highlighted ? 'text-white' : 'text-white'
                    }`}>
                        {tier.name}
                    </h3>
                    <p className={`text-sm ${tier.highlighted ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {tier.description}
                    </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                    {isYearly ? (
                        <>
                            {/* Yearly total */}
                            <div className="flex items-baseline gap-2">
                                <AnimatedPrice price={tier.yearlyPrice * 12} highlighted={tier.highlighted} />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-zinc-400">
                                        {isRTL ? 'ر.س' : 'SAR'}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        {isRTL ? '/سنة' : '/year'}
                                    </span>
                                </div>
                            </div>
                            {/* Per month breakdown */}
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-lg font-semibold text-zinc-400">
                                    {tier.yearlyPrice} {isRTL ? 'ر.س' : 'SAR'}
                                </span>
                                <span className="text-xs text-zinc-500">{isRTL ? '/شهر' : '/month'}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    tier.highlighted
                                        ? 'bg-white/10 text-white'
                                        : 'bg-zinc-800 text-zinc-300'
                                }`}>
                                    {isRTL ? `وفر ${savings}%` : `Save ${savings}%`}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <AnimatedPrice price={price} highlighted={tier.highlighted} />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-zinc-400">
                                    {isRTL ? 'ر.س' : 'SAR'}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {isRTL ? '/شهر' : '/month'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* CTA Button */}
                <button
                    onClick={onGetStarted}
                    className={`w-full py-4 rounded-xl font-semibold text-sm transition-all duration-300 mb-8 group/btn flex items-center justify-center gap-2 ${
                        tier.highlighted
                            ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg shadow-white/20'
                            : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                    }`}
                >
                    {tier.cta}
                    <ArrowIcon size={14} weight="bold" className={`group-hover/btn:${isRTL ? '-translate-x-0.5' : 'translate-x-0.5'} transition-transform`} />
                </button>

                {/* Features */}
                <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                        <FeatureItem key={idx} feature={feature} highlighted={tier.highlighted} index={idx} />
                    ))}
                </ul>
            </div>
        </div>
    );
});

interface PricingSectionProps {
    onGetStarted?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onGetStarted }) => {
    const { isRTL } = useLandingContext();
    const [isYearly, setIsYearly] = useState(true);
    const sectionRef = useRef(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const PRICING_TIERS = getPricingTiers(isRTL);

    const trustIndicators = isRTL ? [
        { icon: Shield, label: 'متوافق مع SOC 2' },
        { icon: Database, label: '99.9% وقت التشغيل' },
        { icon: Headset, label: 'دعم على مدار الساعة' },
        { icon: Users, label: 'أكثر من 10 آلاف مستخدم' },
    ] : [
        { icon: Shield, label: 'SOC 2 Compliant' },
        { icon: Database, label: '99.9% Uptime' },
        { icon: Headset, label: '24/7 Support' },
        { icon: Users, label: '10K+ Users' },
    ];

    const handleGetStarted = () => {
        if (onGetStarted) {
            onGetStarted();
        }
    };

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -320 : 320,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
            checkScroll();
            return () => el.removeEventListener('scroll', checkScroll);
        }
    }, []);

    return (
        <section ref={sectionRef} id="pricing" className="py-20 sm:py-28 md:py-36 bg-black relative overflow-hidden">
            {/* Animated Spotlight Gradients - matching "See everything at a glance" */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'spotlightPulse 8s ease-in-out infinite' }} />
            <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'spotlightPulse 10s ease-in-out infinite', animationDelay: '-4s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[250px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'spotlightPulse 12s ease-in-out infinite', animationDelay: '-2s' }} />

            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                {/* Header */}
                {isInView && (
                    <div className="text-center mb-12 sm:mb-16"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-sm font-semibold mb-6">
                            <Lightning size={14} weight="fill" />
                            {isRTL ? 'الأسعار' : 'Pricing'}
                        </div>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
                            {isRTL ? 'اختر خطتك' : 'Choose Your Plan'}
                        </h2>
                        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto">
                            {isRTL ? 'ابدأ مجاناً لمدة 14 يوماً. لا حاجة لبطاقة ائتمان.' : 'Start free for 14 days. No credit card required.'}
                        </p>
                    </div>
                )}

                {/* Billing Toggle */}
                {isInView && (
                    <div className="flex items-center justify-center gap-4 mb-12 sm:mb-16"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.1s' }}>
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                                !isYearly
                                    ? 'bg-white text-zinc-900'
                                    : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            {isRTL ? 'شهري' : 'Monthly'}
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                isYearly
                                    ? 'bg-white text-zinc-900'
                                    : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            {isRTL ? 'سنوي' : 'Yearly'}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isYearly
                                    ? 'bg-zinc-900/20 text-zinc-900'
                                    : 'bg-zinc-800 text-zinc-400'
                            }`}>
                                -55%
                            </span>
                        </button>
                    </div>
                )}

                {/* Mobile scroll navigation */}
                <div className="sm:hidden flex items-center justify-between mb-4">
                    <span className="text-xs text-zinc-500">{isRTL ? 'مرر للمقارنة بين الخطط' : 'Swipe to compare plans'}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll(isRTL ? 'right' : 'left')}
                            disabled={isRTL ? !canScrollRight : !canScrollLeft}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                (isRTL ? canScrollRight : canScrollLeft)
                                    ? 'border-zinc-700 text-white'
                                    : 'border-zinc-800 text-zinc-700'
                            }`}
                        >
                            <CaretLeft size={16} />
                        </button>
                        <button
                            onClick={() => scroll(isRTL ? 'left' : 'right')}
                            disabled={isRTL ? !canScrollLeft : !canScrollRight}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                (isRTL ? canScrollLeft : canScrollRight)
                                    ? 'border-zinc-700 text-white'
                                    : 'border-zinc-800 text-zinc-700'
                            }`}
                        >
                            <CaretRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Pricing Cards - horizontal scroll on mobile */}
                {isInView && (
                    <div
                        ref={scrollRef}
                        className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch
                            overflow-x-auto sm:overflow-visible
                            pt-6 pb-4 sm:pt-8 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0
                            snap-x snap-mandatory sm:snap-none"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {PRICING_TIERS.map((tier, index) => (
                            <PricingCard
                                key={tier.id}
                                tier={tier}
                                isYearly={isYearly}
                                onGetStarted={handleGetStarted}
                                index={index}
                                isRTL={isRTL}
                            />
                        ))}
                    </div>
                )}

                {/* Trust indicators */}
                {isInView && (
                    <div className="mt-12 sm:mt-16 p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700/50"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.4s' }}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 sm:gap-8">
                                {trustIndicators.map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-center gap-2 text-zinc-300">
                                        <Icon size={16} weight="fill" />
                                        <span className="text-xs sm:text-sm font-medium">{label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={`text-center ${isRTL ? 'sm:text-left' : 'sm:text-right'}`}>
                                <p className="text-xs text-zinc-400 mb-1">{isRTL ? 'أسئلة؟' : 'Questions?'}</p>
                                <a href="mailto:info@nabdchain.com" className="text-sm font-medium text-white hover:underline">
                                    info@nabdchain.com
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Money-back guarantee */}
                {isInView && (
                    <div className="mt-8 text-center"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.5s' }}>
                        <p className="text-sm text-zinc-500">
                            {isRTL
                                ? 'ضمان استرداد المال خلال 30 يوماً • إلغاء في أي وقت • بدون رسوم مخفية'
                                : '30-day money-back guarantee • Cancel anytime • No hidden fees'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Keyframes */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInLeft {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes glowPulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }
                @keyframes glowRotate {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
                @keyframes spotlightPulse {
                    0%, 100% { opacity: 0.6; transform: translate(-50%, 0) scale(1) translateZ(0); }
                    50% { opacity: 1; transform: translate(-50%, 0) scale(1.1) translateZ(0); }
                }
            `}</style>
        </section>
    );
};
