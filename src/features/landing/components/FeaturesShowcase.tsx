import React, { useRef, useEffect, useState } from 'react';
import { Lightning, ChartLineUp, ShieldCheck, UsersThree, Robot, ArrowRight, ArrowLeft } from 'phosphor-react';
import { useLandingContext } from '../LandingPage';

const useScrollReveal = (threshold = 0.15) => {
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

const getFeaturesData = (isRTL: boolean) => [
  {
    icon: UsersThree,
    title: isRTL ? 'تعاون في الوقت الفعلي' : 'Real-time Collaboration',
    description: isRTL
      ? 'شاهد التغييرات فور حدوثها. اعمل مع فريقك بسلاسة.'
      : 'See changes as they happen. Work together seamlessly.',
    metric: isRTL ? 'مباشر' : 'Live',
  },
  {
    icon: Robot,
    title: isRTL ? 'أتمتة ذكية' : 'Smart Automation',
    description: isRTL
      ? 'الذكاء الاصطناعي يتعامل مع العمل المتكرر تلقائياً.'
      : 'AI handles repetitive work automatically.',
    metric: '50+',
  },
  {
    icon: Lightning,
    title: isRTL ? 'رؤى فورية' : 'Instant Insights',
    description: isRTL
      ? 'لوحات معلومات في الوقت الفعلي تُظهر ما يهم.'
      : 'Real-time dashboards that surface what matters.',
    metric: '< 1s',
  },
  {
    icon: ChartLineUp,
    title: isRTL ? 'تحليلات تنبؤية' : 'Predictive Analytics',
    description: isRTL ? 'توقع الاتجاهات قبل حدوثها.' : 'Forecast trends before they happen.',
    metric: '95%',
  },
  {
    icon: ShieldCheck,
    title: isRTL ? 'أمان المؤسسات' : 'Enterprise Security',
    description: isRTL ? 'تشفير بمستوى البنوك. متوافق مع SOC 2.' : 'Bank-grade encryption. SOC 2 compliant.',
    metric: '99.9%',
  },
];

export const FeaturesShowcase: React.FC = () => {
  const { t, isRTL } = useLandingContext();
  const { ref, visible } = useScrollReveal(0.1);
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const FEATURES = getFeaturesData(isRTL);

  return (
    <section ref={ref} className="py-28 sm:py-36 bg-zinc-950 text-white overflow-hidden">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 sm:mb-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-medium mb-5">{t('featureTagline')}</p>
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6"
            style={{ whiteSpace: 'pre-line' }}
          >
            {t('featureHeadline')}
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">{t('featureSub')}</p>
        </div>

        {/* Stats row */}
        <div
          className={`grid grid-cols-3 gap-6 mb-16 sm:mb-20 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {[
            { value: '85%', label: isRTL ? 'تنقل أقل بين الأدوات' : 'Less tool switching' },
            { value: '3hrs', label: isRTL ? 'توفير يومي لكل فريق' : 'Saved daily per team' },
            { value: '10x', label: isRTL ? 'زيادة في الإنتاجية' : 'Productivity increase' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-2">{stat.value}</div>
              <div className="text-xs sm:text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="space-y-4">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group flex items-center gap-6 p-6 sm:p-8 rounded-2xl border border-zinc-800/60 bg-zinc-900/40
                  hover:bg-zinc-900/80 hover:border-zinc-700/60 transition-all duration-500
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${300 + i * 80}ms` }}
              >
                <div
                  className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0
                  group-hover:bg-white group-hover:text-zinc-900 transition-colors duration-300"
                >
                  <Icon
                    size={22}
                    weight="duotone"
                    className="text-zinc-400 group-hover:text-zinc-900 transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl sm:text-3xl font-semibold text-white">{feature.metric}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          className={`text-center mt-14 transition-all duration-700 delay-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <a
            href="#demo"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isRTL ? 'استكشف جميع المميزات' : 'Explore all features'}
            <ArrowIcon size={14} weight="bold" />
          </a>
        </div>
      </div>
    </section>
  );
};
