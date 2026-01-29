import React, { useRef, memo, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import {
    Lightning,
    ChartLineUp,
    ShieldCheck,
    UsersThree,
    Robot,
    Cube,
    ArrowRight,
    ArrowLeft,
    TrendUp,
    CaretLeft,
    CaretRight
} from 'phosphor-react';
import { useLandingContext } from '../LandingPage';

// Animated mini chart component
const AnimatedChart: React.FC<{ type: 'bar' | 'line' | 'progress'; delay?: number }> = memo(({ type, delay = 0 }) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), delay * 1000);
        return () => clearTimeout(timer);
    }, [delay]);

    if (type === 'bar') {
        const bars = [65, 85, 45, 95, 70, 80];
        return (
            <div className="flex items-end gap-1 h-12">
                {bars.map((height, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-white/20 rounded-sm transition-all duration-700 ease-out"
                        style={{
                            height: animate ? `${height}%` : '0%',
                            transitionDelay: `${i * 100}ms`
                        }}
                    />
                ))}
            </div>
        );
    }

    if (type === 'line') {
        return (
            <svg viewBox="0 0 100 40" className="w-full h-10">
                <path
                    d="M0,35 Q10,30 20,25 T40,20 T60,15 T80,10 T100,5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/30"
                    strokeDasharray="200"
                    strokeDashoffset={animate ? 0 : 200}
                    style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                />
                <circle
                    cx={animate ? "100" : "0"}
                    cy={animate ? "5" : "35"}
                    r="3"
                    className="fill-white/50"
                    style={{ transition: 'all 1.5s ease-out' }}
                />
            </svg>
        );
    }

    // Progress type
    return (
        <div className="space-y-2">
            {[85, 72, 93].map((value, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white/40 rounded-full transition-all duration-1000 ease-out"
                            style={{
                                width: animate ? `${value}%` : '0%',
                                transitionDelay: `${i * 200}ms`
                            }}
                        />
                    </div>
                    <span className="text-[10px] text-white/40 w-8">{animate ? `${value}%` : '0%'}</span>
                </div>
            ))}
        </div>
    );
});

// Feature card with animated chart
interface FeatureCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    metric: string;
    metricLabel: string;
    chartType: 'bar' | 'line' | 'progress';
    index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = memo(({
    icon: Icon,
    title,
    description,
    metric,
    metricLabel,
    chartType,
    index
}) => {
    return (
        <div
            className="flex-shrink-0 w-[280px] sm:w-auto sm:flex-1 p-5 sm:p-6 rounded-2xl
                bg-zinc-900 border border-zinc-800
                hover:border-zinc-700 hover:bg-zinc-900/80
                transition-all duration-300 group"
            style={{
                opacity: 0,
                animation: 'fadeInUp 0.5s ease-out forwards',
                animationDelay: `${0.1 + index * 0.1}s`
            }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700
                    flex items-center justify-center
                    group-hover:bg-white group-hover:border-white transition-all duration-300">
                    <Icon size={20} weight="duotone" className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white">{metric}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{metricLabel}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="mb-4 p-3 rounded-xl bg-zinc-800/50">
                <AnimatedChart type={chartType} delay={0.3 + index * 0.15} />
            </div>

            {/* Content */}
            <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
        </div>
    );
});

// Hero feature card
const HeroFeatureCard: React.FC<{ isRTL: boolean }> = memo(({ isRTL }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => prev < 85 ? prev + 1 : prev);
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="flex-shrink-0 w-[320px] sm:w-auto sm:col-span-2 p-6 sm:p-8 rounded-2xl
                bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800
                relative overflow-hidden group"
            style={{
                opacity: 0,
                animation: 'fadeInUp 0.5s ease-out forwards'
            }}
        >
            {/* Background animation */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl
                group-hover:bg-white/10 transition-all duration-700" />

            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                    bg-white/10 border border-white/10 mb-5">
                    <TrendUp size={14} weight="bold" className="text-white" />
                    <span className="text-xs font-medium text-white/80">
                        {isRTL ? 'الميزة الأساسية' : 'Core Benefit'}
                    </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                    {isRTL ? (
                        <>
                            ضاعف إنتاجية
                            <br />
                            <span className="text-zinc-400">فريقك 10 أضعاف</span>
                        </>
                    ) : (
                        <>
                            10x Your Team's
                            <br />
                            <span className="text-zinc-400">Productivity</span>
                        </>
                    )}
                </h3>

                <p className="text-zinc-500 text-sm mb-6 max-w-sm">
                    {isRTL
                        ? 'استبدل الأدوات المتفرقة بمنصة موحدة واحدة. شاهد الكفاءة ترتفع بينما يركز فريقك على ما يهم.'
                        : 'Replace scattered tools with one unified platform. Watch efficiency soar as your team focuses on what matters.'
                    }
                </p>

                {/* Live counter animation */}
                <div className="flex gap-8">
                    <div>
                        <div className="text-3xl font-bold text-white">{count}%</div>
                        <div className="text-xs text-zinc-500">{isRTL ? 'تنقل أقل' : 'Less switching'}</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">{isRTL ? '٣ س' : '3hrs'}</div>
                        <div className="text-xs text-zinc-500">{isRTL ? 'توفير يومي' : 'Saved daily'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const getFeaturesData = (isRTL: boolean): FeatureCardProps[] => [
    {
        icon: UsersThree,
        title: isRTL ? "تعاون في الوقت الفعلي" : "Real-time Collaboration",
        description: isRTL ? "شاهد التغييرات فور حدوثها. اعمل مع فريقك بسلاسة." : "See changes as they happen. Work together seamlessly.",
        metric: isRTL ? "مباشر" : "Live",
        metricLabel: isRTL ? "مزامنة" : "Sync",
        chartType: 'line',
        index: 1
    },
    {
        icon: Robot,
        title: isRTL ? "أتمتة ذكية" : "Smart Automation",
        description: isRTL ? "الذكاء الاصطناعي يتعامل مع العمل المتكرر تلقائياً." : "AI handles repetitive work automatically.",
        metric: "50+",
        metricLabel: isRTL ? "سير العمل" : "Workflows",
        chartType: 'bar',
        index: 2
    },
    {
        icon: Lightning,
        title: isRTL ? "رؤى فورية" : "Instant Insights",
        description: isRTL ? "لوحات معلومات في الوقت الفعلي تُظهر ما يهم." : "Real-time dashboards that surface what matters.",
        metric: "< 1s",
        metricLabel: isRTL ? "التحديثات" : "Updates",
        chartType: 'progress',
        index: 3
    },
    {
        icon: ChartLineUp,
        title: isRTL ? "تحليلات تنبؤية" : "Predictive Analytics",
        description: isRTL ? "توقع الاتجاهات قبل حدوثها." : "Forecast trends before they happen.",
        metric: "95%",
        metricLabel: isRTL ? "الدقة" : "Accuracy",
        chartType: 'line',
        index: 4
    },
    {
        icon: ShieldCheck,
        title: isRTL ? "أمان المؤسسات" : "Enterprise Security",
        description: isRTL ? "تشفير بمستوى البنوك. متوافق مع SOC 2." : "Bank-grade encryption. SOC 2 compliant.",
        metric: "99.9%",
        metricLabel: isRTL ? "وقت التشغيل" : "Uptime",
        chartType: 'bar',
        index: 5
    }
];

export const FeaturesShowcase: React.FC = () => {
    const { isRTL } = useLandingContext();
    const sectionRef = useRef(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
    const FEATURES = getFeaturesData(isRTL);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
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
        <section ref={sectionRef} className="py-20 sm:py-28 md:py-32 bg-zinc-950 relative overflow-hidden">
            {/* Subtle background */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }} />
            </div>

            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                {/* Header */}
                {isInView && (
                    <div className="text-center mb-12 sm:mb-16"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-medium mb-6">
                            <Cube size={16} weight="duotone" />
                            {isRTL ? 'لماذا نبض' : 'Why NABD'}
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05]">
                            {isRTL ? (
                                <>
                                    <span className="text-white">أدِر إمبراطوريتك </span>
                                    <span className="text-zinc-500">بكل سهولة</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-white">Orchestrate Your </span>
                                    <span className="text-zinc-500">Empire</span>
                                </>
                            )}
                        </h2>

                        <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto">
                            {isRTL
                                ? 'منصة واحدة لتوحيد العمليات وتسريع القرارات وإطلاق العنان لإمكانات فريقك الكاملة.'
                                : "One platform to unify operations, accelerate decisions, and unlock your team's full potential."
                            }
                        </p>
                    </div>
                )}

                {/* Mobile scroll navigation */}
                <div className="sm:hidden flex items-center justify-between mb-4">
                    <span className="text-xs text-zinc-500">{isRTL ? 'مرر لاستكشاف' : 'Swipe to explore'}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll(isRTL ? 'right' : 'left')}
                            disabled={isRTL ? !canScrollRight : !canScrollLeft}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors
                                ${(isRTL ? canScrollRight : canScrollLeft)
                                    ? 'border-zinc-700 text-white hover:bg-zinc-800'
                                    : 'border-zinc-800 text-zinc-700'}`}
                        >
                            <CaretLeft size={16} />
                        </button>
                        <button
                            onClick={() => scroll(isRTL ? 'left' : 'right')}
                            disabled={isRTL ? !canScrollLeft : !canScrollRight}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors
                                ${(isRTL ? canScrollLeft : canScrollRight)
                                    ? 'border-zinc-700 text-white hover:bg-zinc-800'
                                    : 'border-zinc-800 text-zinc-700'}`}
                        >
                            <CaretRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Cards - horizontal scroll on mobile, grid on desktop */}
                {isInView && (
                    <div
                        ref={scrollRef}
                        className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4
                            overflow-x-auto sm:overflow-visible
                            pb-4 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0
                            scrollbar-hide snap-x snap-mandatory sm:snap-none"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <HeroFeatureCard isRTL={isRTL} />
                        {FEATURES.map((feature) => (
                            <FeatureCard key={feature.title} {...feature} />
                        ))}
                    </div>
                )}

                {/* CTA */}
                {isInView && (
                    <div className="text-center mt-10 sm:mt-14"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.6s' }}>
                        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                            bg-white text-zinc-900 font-semibold text-sm
                            hover:bg-zinc-100 transition-colors group">
                            {isRTL ? 'استكشف جميع المميزات' : 'Explore All Features'}
                            <ArrowIcon size={16} className={`group-hover:${isRTL ? '-translate-x-0.5' : 'translate-x-0.5'} transition-transform`} />
                        </button>
                    </div>
                )}
            </div>

            {/* Keyframes */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>
        </section>
    );
};
