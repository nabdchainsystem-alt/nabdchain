import React, { useState, useRef, memo, useEffect } from 'react';
import { useInView } from 'framer-motion';
import {
    Play,
    Kanban,
    Table,
    Calendar,
    ChartLine,
    Lightning,
    Users,
    Lock,
    Globe,
    Shield,
    ArrowRight,
    ArrowLeft,
    Sparkle,
    CaretLeft,
    CaretRight,
    Check,
    Circle
} from 'phosphor-react';
import { useLandingContext } from '../LandingPage';

// Animated mini bar chart
const MiniBarChart: React.FC<{ animate: boolean }> = memo(({ animate }) => {
    const bars = [45, 72, 58, 85, 63, 78, 52, 90];
    return (
        <div className="flex items-end gap-0.5 h-10">
            {bars.map((height, i) => (
                <div
                    key={i}
                    className="flex-1 bg-zinc-300 dark:bg-zinc-600 rounded-t-sm transition-all duration-700"
                    style={{
                        height: animate ? `${height}%` : '10%',
                        transitionDelay: `${i * 60}ms`
                    }}
                />
            ))}
        </div>
    );
});

// Animated line chart
const MiniLineChart: React.FC<{ animate: boolean }> = memo(({ animate }) => (
    <svg viewBox="0 0 100 40" className="w-full h-10">
        <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
            </linearGradient>
        </defs>
        <path
            d="M0,30 Q15,25 25,28 T50,18 T75,22 T100,8"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            className="text-zinc-500 dark:text-zinc-400"
            strokeDasharray={animate ? "0" : "200"}
            strokeDashoffset={animate ? "0" : "200"}
            style={{ transition: 'stroke-dasharray 1.2s ease-out, stroke-dashoffset 1.2s ease-out' }}
        />
        <circle
            cx={animate ? 100 : 0}
            cy={animate ? 8 : 30}
            r="3"
            className="fill-zinc-400 dark:fill-zinc-500"
            style={{ transition: 'all 1.2s ease-out' }}
        />
    </svg>
));

// Kanban Preview Card - Enhanced with live animation
const KanbanPreview = memo(({ isRTL }: { isRTL: boolean }) => {
    const [animate, setAnimate] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const columns = isRTL ? [
        { label: 'للتنفيذ', items: 3, color: 'bg-zinc-200 dark:bg-zinc-700' },
        { label: 'قيد العمل', items: 2, color: 'bg-zinc-300 dark:bg-zinc-600' },
        { label: 'مكتمل', items: 4, color: 'bg-zinc-900 dark:bg-white' },
    ] : [
        { label: 'To Do', items: 3, color: 'bg-zinc-200 dark:bg-zinc-700' },
        { label: 'Working', items: 2, color: 'bg-zinc-300 dark:bg-zinc-600' },
        { label: 'Done', items: 4, color: 'bg-zinc-900 dark:bg-white' },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                    <Kanban size={20} weight="fill" className="text-white dark:text-zinc-900" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        {isRTL ? 'طرق عرض متعددة' : 'Multiple Views'}
                    </h3>
                    <p className="text-xs text-zinc-500">{isRTL ? 'أكثر من 10 تخطيطات' : '10+ board layouts'}</p>
                </div>
            </div>

            <div className="flex-1 flex gap-2 mt-2">
                {columns.map((col, colIndex) => (
                    <div key={col.label} className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-medium text-zinc-500">{col.label}</span>
                            <span className="text-[10px] text-zinc-400">{col.items}</span>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            {Array.from({ length: Math.min(col.items, 3) }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-7 rounded-lg ${col.color} transition-all duration-500`}
                                    style={{
                                        opacity: animate ? (col.label === 'Done' || col.label === 'مكتمل' ? 1 : 0.7) : 0,
                                        transform: animate ? 'translateY(0)' : 'translateY(10px)',
                                        transitionDelay: `${colIndex * 100 + i * 80}ms`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                <div className="flex -space-x-1">
                    {['K', 'T', 'G'].map((l, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500">
                            {l === 'K' && <Kanban size={10} />}
                            {l === 'T' && <Table size={10} />}
                            {l === 'G' && <Calendar size={10} />}
                        </div>
                    ))}
                </div>
                <span className="text-[10px] text-zinc-400">{isRTL ? '+7 أكثر' : '+7 more'}</span>
            </div>
        </div>
    );
});

// Automation Preview Card - Enhanced with workflow visualization
const AutomationPreview = memo(({ isRTL }: { isRTL: boolean }) => {
    const [activeRule, setActiveRule] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveRule(prev => (prev + 1) % 3);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const rules = isRTL ? [
        { trigger: 'الحالة → مكتمل', action: 'إشعار الفريق', icon: Check },
        { trigger: 'تجاوز الموعد', action: 'تعيين عاجل', icon: Lightning },
        { trigger: 'مسؤول جديد', action: 'إرسال بريد', icon: Users },
    ] : [
        { trigger: 'Status → Done', action: 'Notify team', icon: Check },
        { trigger: 'Due date passed', action: 'Set Urgent', icon: Lightning },
        { trigger: 'New assignee', action: 'Send email', icon: Users },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                    <Lightning size={20} weight="fill" className="text-white dark:text-zinc-900" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        {isRTL ? 'الأتمتة' : 'Automations'}
                    </h3>
                    <p className="text-xs text-zinc-500">{isRTL ? 'أكثر من 50 قالب' : '50+ templates'}</p>
                </div>
            </div>

            <div className="flex-1 space-y-2">
                {rules.map((rule, i) => {
                    const Icon = rule.icon;
                    const isActive = activeRule === i;
                    return (
                        <div
                            key={i}
                            className={`relative flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                                isActive
                                    ? 'bg-zinc-900 dark:bg-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800/50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                    isActive
                                        ? 'bg-white dark:bg-zinc-900'
                                        : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}>
                                    <Icon size={12} className={isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'} />
                                </div>
                                <span className={`text-xs font-medium ${
                                    isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'
                                }`}>
                                    {rule.trigger}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {isRTL ? (
                                    <ArrowLeft size={10} className={isActive ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-300 dark:text-zinc-700'} />
                                ) : (
                                    <ArrowRight size={10} className={isActive ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-300 dark:text-zinc-700'} />
                                )}
                                <span className={`text-[10px] ${
                                    isActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-600'
                                }`}>
                                    {rule.action}
                                </span>
                            </div>
                            {isActive && (
                                <div className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-900 animate-pulse`} />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 text-center">
                <span className="text-[10px] text-zinc-400">{isRTL ? 'بدون برمجة' : 'No code required'}</span>
            </div>
        </div>
    );
});

// Collaboration Preview Card - Enhanced with live presence
const CollaborationPreview = memo(({ isRTL }: { isRTL: boolean }) => {
    const [cursorPos, setCursorPos] = useState({ x: 30, y: 40 });

    useEffect(() => {
        const interval = setInterval(() => {
            setCursorPos({
                x: 20 + Math.random() * 60,
                y: 30 + Math.random() * 40
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                    <Users size={20} weight="fill" className="text-white dark:text-zinc-900" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        {isRTL ? 'في الوقت الفعلي' : 'Real-time'}
                    </h3>
                    <p className="text-xs text-zinc-500">{isRTL ? 'تعاون مباشر' : 'Live collaboration'}</p>
                </div>
            </div>

            <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3 overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-30"
                     style={{
                         backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                         backgroundSize: '20px 20px'
                     }} />

                {/* Animated cursor */}
                <div
                    className="absolute w-4 h-4 transition-all duration-1000 ease-in-out"
                    style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M3 1L12 7L7 8L5 13L3 1Z" fill="#18181b" className="dark:fill-white" />
                    </svg>
                    <div className={`${isRTL ? 'mr-3' : 'ml-3'} -mt-1 px-1.5 py-0.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[8px] rounded whitespace-nowrap font-medium`}>
                        {isRTL ? 'سارة ك.' : 'Sarah K.'}
                    </div>
                </div>

                {/* Static cursor 2 */}
                <div className="absolute" style={{ left: '60%', top: '60%' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" opacity="0.5">
                        <path d="M3 1L12 7L7 8L5 13L3 1Z" fill="#52525b" />
                    </svg>
                    <div className={`${isRTL ? 'mr-2' : 'ml-2'} px-1.5 py-0.5 bg-zinc-500 text-white text-[8px] rounded whitespace-nowrap`}>
                        {isRTL ? 'أحمد م.' : 'John D.'}
                    </div>
                </div>

                {/* Content placeholder */}
                <div className="relative z-10 space-y-2">
                    <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className={`flex ${isRTL ? '-space-x-reverse' : ''} -space-x-2`}>
                    {['SK', 'JD', 'MR'].map((initials, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] text-zinc-600 dark:text-zinc-400 font-medium">
                            {initials}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-zinc-500">{isRTL ? '3 يحررون' : '3 editing'}</span>
                </div>
            </div>
        </div>
    );
});

// Dashboards Preview Card - Enhanced with animated charts
const DashboardsPreview = memo(({ isRTL }: { isRTL: boolean }) => {
    const [animate, setAnimate] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 400);
        return () => clearTimeout(timer);
    }, []);

    const departments = isRTL
        ? ['المالية', 'المبيعات', 'الموارد البشرية', 'العمليات']
        : ['Finance', 'Sales', 'HR', 'Ops'];

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                    <ChartLine size={20} weight="fill" className="text-white dark:text-zinc-900" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        {isRTL ? 'أكثر من 51 لوحة' : '51+ Dashboards'}
                    </h3>
                    <p className="text-xs text-zinc-500">{isRTL ? 'جاهزة ومخصصة' : 'Pre-built & custom'}</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3">
                    <div className="text-[10px] text-zinc-500 mb-2">{isRTL ? 'الإيرادات' : 'Revenue'}</div>
                    <MiniLineChart animate={animate} />
                    <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">$2.4M</div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3">
                    <div className="text-[10px] text-zinc-500 mb-2">{isRTL ? 'المهام' : 'Tasks'}</div>
                    <MiniBarChart animate={animate} />
                    <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">1,847</div>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
                {departments.map((dept, i) => (
                    <span key={i} className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[9px] text-zinc-500">
                        {dept}
                    </span>
                ))}
            </div>
        </div>
    );
});

// Security Preview Card - Enhanced with visual indicators
const SecurityPreview = memo(({ isRTL }: { isRTL: boolean }) => {
    const features = isRTL ? [
        { icon: Lock, label: 'تشفير شامل', status: 'نشط' },
        { icon: Shield, label: 'متوافق مع SOC 2', status: 'موثق' },
        { icon: Globe, label: 'SSO و SAML', status: 'جاهز' },
    ] : [
        { icon: Lock, label: 'End-to-end encryption', status: 'Active' },
        { icon: Shield, label: 'SOC 2 Compliant', status: 'Verified' },
        { icon: Globe, label: 'SSO & SAML', status: 'Ready' },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                    <Shield size={20} weight="fill" className="text-white dark:text-zinc-900" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        {isRTL ? 'أمان المؤسسات' : 'Enterprise Security'}
                    </h3>
                    <p className="text-xs text-zinc-500">{isRTL ? 'حماية بمستوى البنوك' : 'Bank-grade protection'}</p>
                </div>
            </div>

            <div className="flex-1 space-y-2">
                {features.map(({ icon: Icon, label, status }, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                <Icon size={14} className="text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <span className="text-xs text-zinc-700 dark:text-zinc-300">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{status}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/30 text-center">
                <span className="text-[10px] text-zinc-500">
                    {isRTL ? '99.99% ضمان وقت التشغيل' : '99.99% uptime SLA'}
                </span>
            </div>
        </div>
    );
});

interface LiveDemoSectionProps {
    onTryDemo?: () => void;
}

export const LiveDemoSection: React.FC<LiveDemoSectionProps> = ({ onTryDemo }) => {
    const { isRTL } = useLandingContext();
    const sectionRef = useRef(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

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
                left: direction === 'left' ? -300 : 300,
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

    const cards = [
        { id: 'kanban', component: () => <KanbanPreview isRTL={isRTL} />, span: 'sm:col-span-2' },
        { id: 'automation', component: () => <AutomationPreview isRTL={isRTL} />, span: '' },
        { id: 'collab', component: () => <CollaborationPreview isRTL={isRTL} />, span: '' },
        { id: 'dashboards', component: () => <DashboardsPreview isRTL={isRTL} />, span: '' },
        { id: 'security', component: () => <SecurityPreview isRTL={isRTL} />, span: 'sm:col-span-2' },
    ];

    return (
        <section ref={sectionRef} className="py-20 sm:py-28 md:py-32 bg-white dark:bg-zinc-950 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
                     style={{
                         backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                         backgroundSize: '32px 32px'
                     }} />
            </div>

            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                {/* Header */}
                {isInView && (
                    <div className="text-center mb-12 sm:mb-16"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
                            text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-6">
                            <Sparkle size={14} weight="fill" />
                            {isRTL ? 'مميزات المنصة' : 'Platform Features'}
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 text-zinc-900 dark:text-white leading-[1.1]">
                            {isRTL ? (
                                <>
                                    كل ما تحتاجه
                                    <br />
                                    <span className="text-zinc-400 dark:text-zinc-600">في مكان واحد</span>
                                </>
                            ) : (
                                <>
                                    Everything you need
                                    <br />
                                    <span className="text-zinc-400 dark:text-zinc-600">in one place</span>
                                </>
                            )}
                        </h2>

                        <p className="text-base sm:text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            {isRTL
                                ? 'مصممة للفرق التي تتحرك بسرعة. ميزات قوية، واجهة بسيطة.'
                                : 'Built for teams that move fast. Powerful features, simple interface.'
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
                                    ? 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white'
                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700'}`}
                        >
                            <CaretLeft size={16} />
                        </button>
                        <button
                            onClick={() => scroll(isRTL ? 'left' : 'right')}
                            disabled={isRTL ? !canScrollLeft : !canScrollRight}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors
                                ${(isRTL ? canScrollLeft : canScrollRight)
                                    ? 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white'
                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700'}`}
                        >
                            <CaretRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Bento Grid - horizontal scroll on mobile */}
                {isInView && (
                    <div
                        ref={scrollRef}
                        className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10
                            overflow-x-auto sm:overflow-visible
                            pb-4 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0
                            snap-x snap-mandatory sm:snap-none"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {cards.map((card, index) => {
                            const Component = card.component;
                            return (
                                <div
                                    key={card.id}
                                    className={`flex-shrink-0 w-[300px] sm:w-auto snap-start
                                        p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
                                        hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg dark:hover:shadow-none
                                        transition-all duration-300
                                        ${card.span} min-h-[260px]`}
                                    style={{
                                        opacity: 0,
                                        animation: 'fadeInUp 0.5s ease-out forwards',
                                        animationDelay: `${0.1 + index * 0.05}s`
                                    }}
                                >
                                    <Component />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* CTA */}
                {isInView && (
                    <div className="text-center"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.4s' }}>
                        <button
                            onClick={onTryDemo}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full
                                bg-zinc-900 dark:bg-white text-white dark:text-zinc-900
                                font-semibold text-sm
                                hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors duration-200
                                shadow-lg shadow-zinc-900/20 dark:shadow-white/10"
                        >
                            {isRTL ? 'ابدأ تجربة مجانية' : 'Start Free Trial'}
                            <ArrowIcon size={16} weight="bold" />
                        </button>
                        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-600">
                            {isRTL ? 'لا حاجة لبطاقة ائتمان • خطة مجانية للأبد' : 'No credit card required • Free forever plan'}
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
            `}</style>
        </section>
    );
};
