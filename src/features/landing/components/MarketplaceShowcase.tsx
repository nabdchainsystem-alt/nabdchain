import React, { useRef, useEffect, useState, memo } from 'react';
import {
  Storefront,
  Package,
  Handshake,
  MagnifyingGlass,
  CheckCircle,
  ChatTeardropDots,
  ShieldCheck,
  CurrencyCircleDollar,
  Truck,
  ArrowRight,
  ArrowLeft,
} from 'phosphor-react';
import { useLandingContext } from '../LandingPage';

const useScrollReveal = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
};

const RFQFlow = memo(({ isRTL }: { isRTL: boolean }) => {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setActiveStep((p) => (p + 1) % 4), 2000);
    return () => clearInterval(interval);
  }, []);

  const steps = isRTL
    ? [
        { icon: MagnifyingGlass, label: 'ابحث' },
        { icon: ChatTeardropDots, label: 'اطلب عرض' },
        { icon: Handshake, label: 'قارن' },
        { icon: CheckCircle, label: 'أتمم' },
      ]
    : [
        { icon: MagnifyingGlass, label: 'Find' },
        { icon: ChatTeardropDots, label: 'Quote' },
        { icon: Handshake, label: 'Compare' },
        { icon: CheckCircle, label: 'Close' },
      ];

  return (
    <div className="flex items-center justify-between gap-1.5">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = activeStep === i;
        const isPast = activeStep > i;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'bg-zinc-900 scale-110' : isPast ? 'bg-zinc-300' : 'bg-zinc-100'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : isPast ? 'text-zinc-600' : 'text-zinc-400'} />
              </div>
              <span className={`text-[9px] font-medium ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className={`h-0.5 w-3 rounded ${isPast ? 'bg-zinc-400' : 'bg-zinc-200'}`} />}
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
  const { t, isRTL } = useLandingContext();
  const { ref, visible } = useScrollReveal();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const products = isRTL
    ? [
        { name: 'محركات صناعية', category: 'معدات', price: 'من $2,500' },
        { name: 'صمامات هيدروليكية', category: 'قطع غيار', price: 'من $180' },
        { name: 'مضخات مياه', category: 'ضخ', price: 'من $850' },
        { name: 'كابلات كهربائية', category: 'كهرباء', price: 'من $45/م' },
      ]
    : [
        { name: 'Industrial Motors', category: 'Equipment', price: 'From $2,500' },
        { name: 'Hydraulic Valves', category: 'Spare Parts', price: 'From $180' },
        { name: 'Water Pumps', category: 'Pumping', price: 'From $850' },
        { name: 'Electric Cables', category: 'Electrical', price: 'From $45/m' },
      ];

  const features = isRTL
    ? [
        { icon: ShieldCheck, title: 'موردون موثوقون', desc: 'جميع الموردين معتمدون' },
        { icon: CurrencyCircleDollar, title: 'أسعار تنافسية', desc: 'قارن واحصل على أفضل سعر' },
        { icon: Truck, title: 'شحن موثوق', desc: 'تتبع من المصنع للمخزن' },
      ]
    : [
        { icon: ShieldCheck, title: 'Verified Suppliers', desc: 'All suppliers vetted and reviewed' },
        { icon: CurrencyCircleDollar, title: 'Competitive Pricing', desc: 'Compare quotes for best deals' },
        { icon: Truck, title: 'Reliable Shipping', desc: 'Track factory to warehouse' },
      ];

  return (
    <section ref={ref} className="py-28 sm:py-36 bg-zinc-950 overflow-hidden">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 sm:mb-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-medium mb-5">{t('marketplaceTagline')}</p>
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-white mb-6"
            style={{ whiteSpace: 'pre-line' }}
          >
            {t('marketplaceHeadline')}
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">{t('marketplaceSub')}</p>
        </div>

        {/* Content grid */}
        <div
          className={`grid lg:grid-cols-2 gap-5 mb-10 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Product catalog */}
          <div className="rounded-2xl p-6 border border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between mb-5">
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
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div key={product.name} className="p-3 rounded-xl bg-zinc-800 border border-zinc-700/50">
                  <div className="w-full h-14 bg-zinc-700/40 rounded-lg mb-2 flex items-center justify-center">
                    <Package size={20} className="text-zinc-500" />
                  </div>
                  <div className="text-xs font-medium text-white truncate">{product.name}</div>
                  <div className="text-[10px] text-zinc-400">{product.category}</div>
                  <div className="mt-1 text-xs font-semibold text-white">{product.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RFQ + stats */}
          <div className="space-y-5">
            <div className="rounded-2xl p-6 border border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <Handshake size={16} className="text-zinc-900" />
                </div>
                <span className="text-sm font-semibold text-white">{isRTL ? 'طلب عرض سعر' : 'Request for Quote'}</span>
              </div>
              <RFQFlow isRTL={isRTL} />
            </div>

            <div className="rounded-2xl p-6 border border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-2 mb-4">
                <Storefront size={16} className="text-zinc-400" />
                <span className="text-sm font-semibold text-white">
                  {isRTL ? 'السوق بالأرقام' : 'Marketplace Stats'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '500+', label: isRTL ? 'مورد معتمد' : 'Verified Suppliers' },
                  { value: '10K+', label: isRTL ? 'منتج' : 'Products' },
                  { value: '24h', label: isRTL ? 'متوسط الاستجابة' : 'Avg Response' },
                  { value: '15+', label: isRTL ? 'دولة' : 'Countries' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-xl font-semibold text-white">{stat.value}</div>
                    <div className="text-[10px] text-zinc-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div
          className={`grid sm:grid-cols-3 gap-4 mb-12 transition-all duration-700 delay-400
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          {features.map(({ icon: FIcon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <FIcon size={18} className="text-zinc-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-0.5">{title}</h4>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={onExplore}
            className="h-12 px-8 rounded-full bg-white text-zinc-900 text-sm font-semibold
              hover:bg-zinc-200 transition-colors flex items-center gap-2 mx-auto"
          >
            {isRTL ? 'استكشف السوق' : 'Explore Marketplace'}
            <ArrowIcon size={14} weight="bold" />
          </button>
          <p className="mt-4 text-sm text-zinc-500">
            {isRTL ? 'انضم كمورد أو مشتري • مجاني للبدء' : 'Join as supplier or buyer • Free to start'}
          </p>
        </div>
      </div>
    </section>
  );
};
