import React, { useRef, useEffect, useState, memo } from 'react';
import {
  Check,
  Rocket,
  Crown,
  Buildings,
  Shield,
  Database,
  Headset,
  Users,
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
    features: isRTL
      ? [
          'حتى 5 أعضاء فريق',
          'عروض اللوحة والجدول وكانبان',
          '10 جيجابايت تخزين',
          'دعم بالبريد الإلكتروني',
          'لوحات معلومات أساسية',
          '5 قواعد أتمتة',
        ]
      : [
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
    features: isRTL
      ? [
          'حتى 25 عضو فريق',
          'جميع عروض اللوحة الـ 14',
          '50 جيجابايت تخزين',
          'دعم ذو أولوية',
          'الشركة المصغرة: المبيعات والمخزون',
          'أتمتة متقدمة',
          'تتبع الوقت',
          '24 نوع عمود',
        ]
      : [
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
    features: isRTL
      ? [
          'أعضاء فريق غير محدودين',
          'مجموعة الشركة المصغرة الكاملة',
          '500 جيجابايت تخزين',
          'مدير دعم مخصص',
          'تكاملات مخصصة',
          'تحليلات متقدمة',
          'خيارات العلامة البيضاء',
          'الوصول لـ API',
          'أكثر من 50 لوحة جاهزة',
        ]
      : [
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

const AnimatedPrice = memo(({ price }: { price: number }) => {
  const [displayPrice, setDisplayPrice] = useState(0);

  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayPrice(Math.floor(price * easeOut));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [price]);

  return <>{displayPrice}</>;
});

interface PricingSectionProps {
  onGetStarted?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onGetStarted }) => {
  const { isRTL } = useLandingContext();
  const { ref, visible } = useScrollReveal();
  const [isYearly, setIsYearly] = useState(true);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const tiers = getPricingTiers(isRTL);

  const trustIndicators = isRTL
    ? [
        { icon: Shield, label: 'متوافق مع SOC 2' },
        { icon: Database, label: '99.9% وقت التشغيل' },
        { icon: Headset, label: 'دعم على مدار الساعة' },
        { icon: Users, label: 'أكثر من 10 آلاف مستخدم' },
      ]
    : [
        { icon: Shield, label: 'SOC 2 Compliant' },
        { icon: Database, label: '99.9% Uptime' },
        { icon: Headset, label: '24/7 Support' },
        { icon: Users, label: '10K+ Users' },
      ];

  return (
    <section ref={ref} id="pricing" className="py-28 sm:py-36 bg-zinc-950 overflow-hidden">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 sm:mb-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-medium mb-5">
            {isRTL ? 'الأسعار' : 'Pricing'}
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-white mb-6">
            {isRTL ? 'اختر خطتك' : 'Choose your plan'}
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {isRTL
              ? 'ابدأ مجاناً لمدة 14 يوماً. لا حاجة لبطاقة ائتمان.'
              : 'Start free for 14 days. No credit card required.'}
          </p>
        </div>

        {/* Billing Toggle */}
        <div
          className={`flex items-center justify-center gap-1 mb-14 transition-all duration-700 delay-100
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="inline-flex p-1 rounded-full bg-zinc-800 border border-zinc-700">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${!isYearly ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
            >
              {isRTL ? 'شهري' : 'Monthly'}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
                ${isYearly ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
            >
              {isRTL ? 'سنوي' : 'Yearly'}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${isYearly ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-700 text-zinc-400'}`}
              >
                -55%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div
          className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12 transition-all duration-700 delay-200
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {tiers.map((tier, i) => {
            const Icon = tier.icon;
            const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
            const savings = Math.round((1 - tier.yearlyPrice / tier.monthlyPrice) * 100);

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-500
                  ${
                    tier.highlighted
                      ? 'bg-white border-2 border-white sm:scale-[1.03] z-10 shadow-[0_16px_48px_-8px_rgba(255,255,255,0.12)]'
                      : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                  }`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full bg-zinc-900 text-white text-xs font-semibold whitespace-nowrap">
                      {tier.badge}
                    </div>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="mb-6">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4
                    ${tier.highlighted ? 'bg-zinc-900 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                  >
                    <Icon size={22} weight="fill" />
                  </div>
                  <h3
                    className={`text-xl font-semibold mb-1.5
                    ${tier.highlighted ? 'text-zinc-900' : 'text-white'}`}
                  >
                    {tier.name}
                  </h3>
                  <p className={`text-sm ${tier.highlighted ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    {tier.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {isYearly ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-5xl sm:text-6xl font-semibold tracking-tight
                          ${tier.highlighted ? 'text-zinc-900' : 'text-white'}`}
                        >
                          <AnimatedPrice price={tier.yearlyPrice * 12} />
                        </span>
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium ${tier.highlighted ? 'text-zinc-500' : 'text-zinc-400'}`}
                          >
                            {isRTL ? 'ر.س' : 'SAR'}
                          </span>
                          <span className={`text-xs ${tier.highlighted ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {isRTL ? '/سنة' : '/year'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-lg font-medium ${tier.highlighted ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {tier.yearlyPrice} {isRTL ? 'ر.س' : 'SAR'}
                        </span>
                        <span className={`text-xs ${tier.highlighted ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {isRTL ? '/شهر' : '/month'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
                          ${tier.highlighted ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-800 text-zinc-300'}`}
                        >
                          {isRTL ? `وفر ${savings}%` : `Save ${savings}%`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-5xl sm:text-6xl font-semibold tracking-tight
                        ${tier.highlighted ? 'text-zinc-900' : 'text-white'}`}
                      >
                        <AnimatedPrice price={price} />
                      </span>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${tier.highlighted ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {isRTL ? 'ر.س' : 'SAR'}
                        </span>
                        <span className={`text-xs ${tier.highlighted ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {isRTL ? '/شهر' : '/month'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={onGetStarted}
                  className={`w-full h-12 rounded-full font-semibold text-sm transition-colors mb-8
                    flex items-center justify-center gap-2
                    ${
                      tier.highlighted
                        ? 'bg-zinc-900 text-white hover:bg-zinc-700'
                        : 'bg-white text-zinc-900 hover:bg-zinc-200'
                    }`}
                >
                  {tier.cta}
                  <ArrowIcon size={14} weight="bold" />
                </button>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                        ${tier.highlighted ? 'bg-zinc-900 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        <Check size={10} weight="bold" />
                      </div>
                      <span className={`text-sm ${tier.highlighted ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Trust indicators */}
        <div
          className={`p-6 rounded-2xl bg-zinc-900 border border-zinc-800 mb-8
          transition-all duration-700 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 sm:gap-8">
              {trustIndicators.map(({ icon: TIcon, label }) => (
                <div key={label} className="flex items-center gap-2 text-zinc-400">
                  <TIcon size={16} weight="fill" />
                  <span className="text-xs sm:text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
            <div className={`text-center ${isRTL ? 'sm:text-left' : 'sm:text-right'}`}>
              <p className="text-xs text-zinc-500 mb-0.5">{isRTL ? 'أسئلة؟' : 'Questions?'}</p>
              <a href="mailto:info@nabdchain.com" className="text-sm font-medium text-white hover:underline">
                info@nabdchain.com
              </a>
            </div>
          </div>
        </div>

        {/* Guarantee */}
        <div className={`text-center transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm text-zinc-500">
            {isRTL
              ? 'ضمان استرداد المال خلال 30 يوماً • إلغاء في أي وقت • بدون رسوم مخفية'
              : '30-day money-back guarantee • Cancel anytime • No hidden fees'}
          </p>
        </div>
      </div>
    </section>
  );
};
