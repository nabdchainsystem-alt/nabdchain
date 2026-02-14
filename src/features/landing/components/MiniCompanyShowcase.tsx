import React, { useRef, useEffect, useState } from 'react';
import {
  UsersThree,
  CurrencyCircleDollar,
  Package,
  Truck,
  ChartPie,
  Briefcase,
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

interface MiniCompanyShowcaseProps {
  onExplore?: () => void;
}

export const MiniCompanyShowcase: React.FC<MiniCompanyShowcaseProps> = ({ onExplore }) => {
  const { isRTL } = useLandingContext();
  const { ref, visible } = useScrollReveal();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const departments = [
    { icon: UsersThree, name: isRTL ? 'العملاء' : 'Customers', count: '12.4K', label: isRTL ? 'نشط' : 'Active' },
    {
      icon: CurrencyCircleDollar,
      name: isRTL ? 'المالية' : 'Finance',
      count: '$2.4M',
      label: isRTL ? 'الإيرادات' : 'Revenue',
    },
    { icon: Package, name: isRTL ? 'العمليات' : 'Operations', count: '1,847', label: isRTL ? 'الطلبات' : 'Orders' },
    { icon: Truck, name: isRTL ? 'الموردين' : 'Suppliers', count: '156', label: isRTL ? 'شريك' : 'Partners' },
    { icon: Briefcase, name: isRTL ? 'الموظفين' : 'People', count: '234', label: isRTL ? 'الفريق' : 'Team' },
    { icon: ChartPie, name: isRTL ? 'نظرة عامة' : 'Overview', count: '51+', label: isRTL ? 'لوحات' : 'Dashboards' },
  ];

  return (
    <section ref={ref} className="py-28 sm:py-36 bg-white overflow-hidden">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 sm:mb-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-medium mb-5">
            {isRTL ? 'الشركة المصغرة' : 'Mini Company'}
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-zinc-900 mb-6">
            {isRTL ? (
              <>
                أدِر شركتك بالكامل
                <br />
                <span className="text-zinc-400">من مكان واحد</span>
              </>
            ) : (
              <>
                Run your entire company
                <br />
                <span className="text-zinc-400">from one place</span>
              </>
            )}
          </h2>
          <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            {isRTL
              ? '6 أقسام. أكثر من 51 لوحة معلومات. الكل متصل في الوقت الفعلي.'
              : '6 departments. 51+ dashboards. All connected in real-time.'}
          </p>
        </div>

        {/* Department grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 mb-12">
          {departments.map((dept, i) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.name}
                className={`group p-6 sm:p-8 rounded-2xl border border-zinc-200 bg-zinc-50/50
                  hover:border-zinc-300 hover:bg-white hover:shadow-lg transition-all duration-500
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${200 + i * 80}ms` }}
              >
                <div
                  className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center mb-5
                  group-hover:bg-zinc-900 transition-colors duration-300"
                >
                  <Icon size={22} weight="fill" className="text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 mb-3">{dept.name}</h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-semibold text-zinc-900">{dept.count}</span>
                  <span className="text-xs text-zinc-400">{dept.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom stats bar */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-zinc-950 text-white
          transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="flex items-center gap-8 sm:gap-12">
            <div>
              <div className="text-2xl sm:text-3xl font-semibold">51+</div>
              <div className="text-xs text-zinc-400">{isRTL ? 'لوحات جاهزة' : 'Ready dashboards'}</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <div className="text-2xl sm:text-3xl font-semibold">&lt;1s</div>
              <div className="text-xs text-zinc-400">{isRTL ? 'مزامنة فورية' : 'Cross-dept sync'}</div>
            </div>
            <div className="w-px h-8 bg-zinc-800 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-2xl sm:text-3xl font-semibold">&infin;</div>
              <div className="text-xs text-zinc-400">{isRTL ? 'تقارير مخصصة' : 'Custom reports'}</div>
            </div>
          </div>
          <button
            onClick={onExplore}
            className="h-11 px-6 rounded-full bg-white text-zinc-900 text-sm font-semibold
              hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            {isRTL ? 'استكشف الشركة المصغرة' : 'Explore Mini Company'}
            <ArrowIcon size={14} weight="bold" />
          </button>
        </div>
      </div>
    </section>
  );
};
