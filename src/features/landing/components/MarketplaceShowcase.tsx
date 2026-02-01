import React, { useRef, useState, useEffect, memo } from 'react';
import { useInView } from 'framer-motion';
import {
    Factory,
    Storefront,
    Handshake,
    Package,
    MagnifyingGlass,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Globe,
    ShieldCheck,
    Lightning,
    Buildings,
    Truck,
    CurrencyCircleDollar,
    ChatTeardropDots,
    Star,
    CaretRight,
    CaretLeft
} from 'phosphor-react';
import { useLandingContext } from '../LandingPage';

// Animated product card - dark theme
const ProductCard: React.FC<{ delay: number; name: string; category: string; price: string; isRTL: boolean }> = memo(({ delay, name, category, price }) => (
    <div
        className="bg-zinc-800 rounded-xl p-3 border border-zinc-700
                   hover:bg-zinc-750 hover:border-zinc-600 transition-all duration-300 cursor-pointer"
        style={{
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards',
            animationDelay: `${delay}s`
        }}
    >
        <div className="w-full h-16 bg-gradient-to-br from-zinc-700 to-zinc-600 rounded-lg mb-2 flex items-center justify-center">
            <Package size={24} className="text-zinc-400" />
        </div>
        <div className="text-xs font-medium text-white truncate">{name}</div>
        <div className="text-[10px] text-zinc-400">{category}</div>
        <div className="mt-1 text-xs font-semibold text-white">{price}</div>
    </div>
));

// Supplier badge - dark theme
const SupplierBadge: React.FC<{ name: string; rating: number; verified: boolean; delay: number }> = memo(({ name, rating, verified, delay }) => (
    <div
        className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700"
        style={{
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards',
            animationDelay: `${delay}s`
        }}
    >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-500 flex items-center justify-center text-xs font-bold text-zinc-200">
            {name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate flex items-center gap-1">
                {name}
                {verified && <ShieldCheck size={12} weight="fill" className="text-emerald-400" />}
            </div>
            <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={8} weight="fill" className={i < rating ? 'text-amber-400' : 'text-zinc-600'} />
                ))}
            </div>
        </div>
    </div>
));

// Animated stat counter - dark theme
const StatCounter: React.FC<{ value: string; label: string; icon: React.ElementType; delay: number }> = memo(({ value, label, icon: Icon, delay }) => (
    <div
        className="text-center"
        style={{
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards',
            animationDelay: `${delay}s`
        }}
    >
        <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Icon size={24} className="text-zinc-400" />
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-zinc-400">{label}</div>
    </div>
));

// RFQ Flow visualization - dark theme
const RFQFlow: React.FC<{ isRTL: boolean }> = memo(({ isRTL }) => {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep(prev => (prev + 1) % 4);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const steps = isRTL ? [
        { icon: MagnifyingGlass, label: 'ابحث عن المنتجات' },
        { icon: ChatTeardropDots, label: 'اطلب عرض سعر' },
        { icon: Handshake, label: 'قارن العروض' },
        { icon: CheckCircle, label: 'أتمم الصفقة' },
    ] : [
        { icon: MagnifyingGlass, label: 'Find Products' },
        { icon: ChatTeardropDots, label: 'Request Quote' },
        { icon: Handshake, label: 'Compare Offers' },
        { icon: CheckCircle, label: 'Close Deal' },
    ];

    return (
        <div className="flex items-center justify-between gap-2">
            {steps.map((step, i) => {
                const Icon = step.icon;
                const isActive = activeStep === i;
                const isPast = activeStep > i;
                return (
                    <React.Fragment key={i}>
                        <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                isActive ? 'bg-white scale-110' :
                                isPast ? 'bg-zinc-600' :
                                'bg-zinc-800'
                            }`}>
                                <Icon size={18} className={`transition-colors ${
                                    isActive ? 'text-zinc-900' :
                                    isPast ? 'text-zinc-300' :
                                    'text-zinc-500'
                                }`} />
                            </div>
                            <span className={`text-[9px] text-center font-medium transition-colors ${
                                isActive ? 'text-white' : 'text-zinc-500'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-0.5 w-4 rounded transition-colors ${
                                isPast ? 'bg-zinc-600' : 'bg-zinc-800'
                            }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
});

interface MarketplaceShowcaseProps {
    onExplore?: () => void;
}

export const MarketplaceShowcase: React.FC<MarketplaceShowcaseProps> = ({ onExplore }) => {
    const { isRTL } = useLandingContext();
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    const products = isRTL ? [
        { name: 'محركات صناعية', category: 'معدات', price: 'من $2,500' },
        { name: 'صمامات هيدروليكية', category: 'قطع غيار', price: 'من $180' },
        { name: 'مضخات مياه', category: 'ضخ', price: 'من $850' },
        { name: 'كابلات كهربائية', category: 'كهرباء', price: 'من $45/م' },
    ] : [
        { name: 'Industrial Motors', category: 'Equipment', price: 'From $2,500' },
        { name: 'Hydraulic Valves', category: 'Spare Parts', price: 'From $180' },
        { name: 'Water Pumps', category: 'Pumping', price: 'From $850' },
        { name: 'Electric Cables', category: 'Electrical', price: 'From $45/m' },
    ];

    const suppliers = isRTL ? [
        { name: 'شركة المعدات الصناعية', rating: 5, verified: true },
        { name: 'مصنع الخليج للمضخات', rating: 4, verified: true },
        { name: 'التجارة العالمية', rating: 5, verified: false },
    ] : [
        { name: 'Industrial Equipment Co.', rating: 5, verified: true },
        { name: 'Gulf Pumps Factory', rating: 4, verified: true },
        { name: 'Global Trade LLC', rating: 5, verified: false },
    ];

    const stats = isRTL ? [
        { value: '500+', label: 'مورد معتمد', icon: Buildings },
        { value: '10K+', label: 'منتج صناعي', icon: Package },
        { value: '24h', label: 'متوسط الاستجابة', icon: Lightning },
        { value: '15+', label: 'دولة مغطاة', icon: Globe },
    ] : [
        { value: '500+', label: 'Verified Suppliers', icon: Buildings },
        { value: '10K+', label: 'Industrial Products', icon: Package },
        { value: '24h', label: 'Avg Response Time', icon: Lightning },
        { value: '15+', label: 'Countries Covered', icon: Globe },
    ];

    const features = isRTL ? [
        { icon: ShieldCheck, title: 'موردون موثوقون', desc: 'جميع الموردين معتمدون ومراجعون' },
        { icon: CurrencyCircleDollar, title: 'أسعار تنافسية', desc: 'قارن العروض واحصل على أفضل سعر' },
        { icon: Truck, title: 'شحن موثوق', desc: 'تتبع شحناتك من المصنع للمخزن' },
    ] : [
        { icon: ShieldCheck, title: 'Verified Suppliers', desc: 'All suppliers are vetted and reviewed' },
        { icon: CurrencyCircleDollar, title: 'Competitive Pricing', desc: 'Compare quotes and get the best deal' },
        { icon: Truck, title: 'Reliable Shipping', desc: 'Track shipments from factory to warehouse' },
    ];

    return (
        <section ref={sectionRef} className="py-20 sm:py-28 md:py-32 bg-black relative overflow-hidden">
            {/* Animated Spotlight Gradient - similar to DashboardPreview */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'spotlightPulse 8s ease-in-out infinite' }} />
            <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
                 style={{ animation: 'spotlightPulse 10s ease-in-out infinite', animationDelay: '-4s' }} />
            <style>{`
                @keyframes spotlightPulse {
                    0%, 100% { opacity: 0.6; transform: translate(-50%, 0) scale(1) translateZ(0); }
                    50% { opacity: 1; transform: translate(-50%, 0) scale(1.1) translateZ(0); }
                }
            `}</style>

            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                {/* Header */}
                {isInView && (
                    <div className="text-center mb-12 sm:mb-16"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-zinc-900 border border-zinc-800
                            text-sm font-medium text-zinc-400 mb-6">
                            <Storefront size={14} weight="fill" />
                            {isRTL ? 'السوق الصناعي' : 'Industrial Marketplace'}
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 text-white leading-[1.1]">
                            {isRTL ? (
                                <>
                                    اربط عملك
                                    <br />
                                    <span className="text-zinc-500">بالموردين الصناعيين</span>
                                </>
                            ) : (
                                <>
                                    Connect your business
                                    <br />
                                    <span className="text-zinc-500">with industrial suppliers</span>
                                </>
                            )}
                        </h2>

                        <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            {isRTL
                                ? 'سوق B2B متكامل للشركات الصناعية. اعثر على الموردين، قارن الأسعار، واطلب عروض أسعار مباشرة.'
                                : 'A complete B2B marketplace for industrial companies. Find suppliers, compare prices, and request quotes directly.'
                            }
                        </p>
                    </div>
                )}

                {/* Main Content Grid */}
                {isInView && (
                    <div className="grid lg:grid-cols-2 gap-8 mb-12">
                        {/* Left - Product Browser */}
                        <div
                            className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
                            style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.1s' }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                        <Package size={16} className="text-zinc-900" />
                                    </div>
                                    <span className="text-sm font-semibold text-white">
                                        {isRTL ? 'كتالوج المنتجات' : 'Product Catalog'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-400">
                                    <MagnifyingGlass size={12} />
                                    {isRTL ? 'بحث...' : 'Search...'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {products.map((product, i) => (
                                    <ProductCard key={product.name} {...product} delay={0.2 + i * 0.1} isRTL={isRTL} />
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                                <span className="text-xs text-zinc-500">{isRTL ? 'عرض 4 من 10,000+' : 'Showing 4 of 10,000+'}</span>
                                <button className="text-xs font-medium text-white hover:underline flex items-center gap-1">
                                    {isRTL ? 'عرض الكل' : 'View all'}
                                    {isRTL ? <CaretLeft size={10} /> : <CaretRight size={10} />}
                                </button>
                            </div>
                        </div>

                        {/* Right - Suppliers & RFQ */}
                        <div className="space-y-4">
                            {/* Suppliers Card */}
                            <div
                                className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
                                style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.15s' }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                            <Factory size={16} className="text-zinc-900" />
                                        </div>
                                        <span className="text-sm font-semibold text-white">
                                            {isRTL ? 'الموردون المميزون' : 'Featured Suppliers'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-emerald-400 font-medium">
                                        {isRTL ? '500+ مورد' : '500+ suppliers'}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {suppliers.map((supplier, i) => (
                                        <SupplierBadge key={supplier.name} {...supplier} delay={0.25 + i * 0.1} />
                                    ))}
                                </div>
                            </div>

                            {/* RFQ Process Card */}
                            <div
                                className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
                                style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.2s' }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                        <Handshake size={16} className="text-zinc-900" />
                                    </div>
                                    <span className="text-sm font-semibold text-white">
                                        {isRTL ? 'طلب عرض سعر' : 'Request for Quote'}
                                    </span>
                                </div>
                                <RFQFlow isRTL={isRTL} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Row */}
                {isInView && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 py-8 px-6 bg-zinc-900 rounded-2xl border border-zinc-800"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.25s' }}>
                        {stats.map((stat, i) => (
                            <StatCounter key={stat.label} {...stat} delay={0.3 + i * 0.1} />
                        ))}
                    </div>
                )}

                {/* Features Row */}
                {isInView && (
                    <div className="grid md:grid-cols-3 gap-4 mb-10">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="flex items-start gap-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800"
                                    style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: `${0.35 + i * 0.1}s` }}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <Icon size={20} className="text-zinc-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white mb-0.5">{feature.title}</h4>
                                        <p className="text-xs text-zinc-400">{feature.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* CTA */}
                {isInView && (
                    <div className="text-center"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.5s' }}>
                        <button
                            onClick={onExplore}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full
                                bg-white text-zinc-900
                                font-semibold text-sm
                                hover:bg-zinc-100 transition-colors duration-200
                                shadow-lg shadow-white/10"
                        >
                            {isRTL ? 'استكشف السوق' : 'Explore Marketplace'}
                            <ArrowIcon size={16} weight="bold" />
                        </button>
                        <p className="mt-4 text-sm text-zinc-500">
                            {isRTL ? 'انضم كمورد أو مشتري • مجاني للبدء' : 'Join as a supplier or buyer • Free to start'}
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
