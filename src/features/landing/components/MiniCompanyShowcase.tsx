import React, { useRef, memo, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import {
  UsersThree,
  CurrencyCircleDollar,
  Package,
  Truck,
  ChartPie,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Lightning,
  CaretLeft,
  CaretRight,
} from 'phosphor-react';
import { useLandingContext } from '../LandingPage';

interface Department {
  id: string;
  name: string;
  icon: React.ElementType;
  dashboards: string[];
  stats: { label: string; value: string }[];
}

const getDepartmentsData = (isRTL: boolean): Department[] => [
  {
    id: 'customers',
    name: isRTL ? 'العملاء' : 'Customers',
    icon: UsersThree,
    dashboards: isRTL ? ['التقسيم', 'الاحتفاظ', 'التحليلات'] : ['Segmentation', 'Retention', 'Analytics'],
    stats: [
      { label: isRTL ? 'المستخدمين النشطين' : 'Active Users', value: '12.4K' },
      { label: isRTL ? 'الاحتفاظ' : 'Retention', value: '94%' },
    ],
  },
  {
    id: 'finance',
    name: isRTL ? 'المالية' : 'Finance',
    icon: CurrencyCircleDollar,
    dashboards: isRTL ? ['الميزانيات', 'المصروفات', 'التوقعات'] : ['Budgets', 'Expenses', 'Forecasting'],
    stats: [
      { label: isRTL ? 'الإيرادات' : 'Revenue', value: '$2.4M' },
      { label: isRTL ? 'النمو' : 'Growth', value: '+23%' },
    ],
  },
  {
    id: 'operations',
    name: isRTL ? 'العمليات' : 'Operations',
    icon: Package,
    dashboards: isRTL ? ['المخزون', 'المبيعات', 'المشتريات'] : ['Inventory', 'Sales', 'Purchasing'],
    stats: [
      { label: isRTL ? 'الطلبات' : 'Orders', value: '1,847' },
      { label: isRTL ? 'المنجز' : 'Fulfilled', value: '98%' },
    ],
  },
  {
    id: 'suppliers',
    name: isRTL ? 'الموردين' : 'Suppliers',
    icon: Truck,
    dashboards: isRTL ? ['الأداء', 'الامتثال', 'العقود'] : ['Performance', 'Compliance', 'Contracts'],
    stats: [
      { label: isRTL ? 'الشركاء' : 'Partners', value: '156' },
      { label: isRTL ? 'في الوقت' : 'On-time', value: '97%' },
    ],
  },
  {
    id: 'people',
    name: isRTL ? 'الموظفين' : 'People',
    icon: Briefcase,
    dashboards: isRTL ? ['الموارد البشرية', 'الرواتب', 'الحضور'] : ['HR', 'Payroll', 'Attendance'],
    stats: [
      { label: isRTL ? 'حجم الفريق' : 'Team Size', value: '234' },
      { label: isRTL ? 'المشاركة' : 'Engagement', value: '89%' },
    ],
  },
  {
    id: 'overview',
    name: isRTL ? 'نظرة عامة' : 'Overview',
    icon: ChartPie,
    dashboards: isRTL ? ['التنفيذي', 'المؤشرات', 'التقارير'] : ['Executive', 'KPIs', 'Reports'],
    stats: [
      { label: isRTL ? 'لوحات المعلومات' : 'Dashboards', value: '51+' },
      { label: isRTL ? 'في الوقت الفعلي' : 'Real-time', value: isRTL ? 'نعم' : 'Yes' },
    ],
  },
];

// Mini animated chart for each card
const MiniDashboard: React.FC<{ animate: boolean; index: number }> = memo(({ animate, index }) => {
  const chartType = index % 3;

  if (chartType === 0) {
    // Bar chart
    const heights = [40, 65, 45, 80, 55, 70, 50, 85];
    return (
      <div className="flex items-end gap-0.5 h-8">
        {heights.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-zinc-600 dark:bg-zinc-500 rounded-t-sm transition-all duration-500"
            style={{
              height: animate ? `${h}%` : '10%',
              transitionDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  if (chartType === 1) {
    // Line chart
    return (
      <svg viewBox="0 0 80 32" className="w-full h-8">
        <path
          d="M0,28 L10,24 L20,26 L30,18 L40,20 L50,12 L60,14 L70,6 L80,8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-zinc-500"
          strokeDasharray={animate ? '0' : '200'}
          strokeDashoffset={animate ? '0' : '200'}
          style={{ transition: 'stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out' }}
        />
      </svg>
    );
  }

  // Progress bars
  const values = [75, 60, 85];
  return (
    <div className="space-y-1.5">
      {values.map((v, i) => (
        <div key={i} className="h-1.5 bg-zinc-700 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-500 rounded-full transition-all duration-700"
            style={{
              width: animate ? `${v}%` : '0%',
              transitionDelay: `${i * 150}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
});

// Department card with mini dashboard preview
const DepartmentCard: React.FC<{
  dept: Department;
  index: number;
  isActive: boolean;
  onClick: () => void;
  isRTL: boolean;
}> = memo(({ dept, index, isActive, onClick, isRTL }) => {
  const Icon = dept.icon;
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: '-50px' });

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group relative cursor-pointer flex-shrink-0 w-[260px] sm:w-auto
                transition-all duration-300 ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
      style={{
        opacity: 0,
        animation: isInView ? 'fadeInUp 0.5s ease-out forwards' : 'none',
        animationDelay: `${0.1 + index * 0.08}s`,
      }}
    >
      <div
        className={`relative p-5 rounded-2xl border transition-all duration-300
                ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-zinc-800 border-zinc-700 dark:border-zinc-600 shadow-xl'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg'
                }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                        ${
                          isActive
                            ? 'bg-white text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900'
                        }`}
          >
            <Icon size={20} weight="fill" />
          </div>
          <div className={isRTL ? 'text-left' : 'text-right'}>
            <div className={`text-xl font-bold ${isActive ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
              {dept.dashboards.length}
            </div>
            <div className={`text-[10px] uppercase tracking-wide ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRTL ? 'لوحات' : 'Dashboards'}
            </div>
          </div>
        </div>

        {/* Mini Dashboard Preview */}
        <div
          className={`mb-4 p-3 rounded-xl transition-colors ${isActive ? 'bg-zinc-800' : 'bg-zinc-50 dark:bg-zinc-800/50'}`}
        >
          <MiniDashboard animate={isInView} index={index} />
        </div>

        {/* Title */}
        <h3 className={`text-lg font-semibold mb-2 ${isActive ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
          {dept.name}
        </h3>

        {/* Stats */}
        <div className="flex gap-4">
          {dept.stats.map((stat, i) => (
            <div key={i}>
              <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                {stat.value}
              </div>
              <div className={`text-[10px] ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Active indicator */}
        {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full" />}
      </div>
    </div>
  );
});

// Connection visualization
const ConnectionsVisualization: React.FC<{ activeDept: string; isRTL: boolean }> = memo(({ _activeDept, isRTL }) => {
  return (
    <div className="hidden lg:flex items-center justify-center py-8">
      <div className="relative flex items-center gap-4 px-6 py-3 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white animate-pulse" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            {isRTL ? 'جميع الأقسام متزامنة' : 'All departments synced'}
          </span>
        </div>
        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
        <div className="flex items-center gap-2">
          <Lightning size={14} weight="fill" className="text-zinc-500" />
          <span className="text-sm text-zinc-500">{isRTL ? 'تحديثات فورية' : 'Real-time updates'}</span>
        </div>
      </div>
    </div>
  );
});

interface MiniCompanyShowcaseProps {
  onExplore?: () => void;
}

export const MiniCompanyShowcase: React.FC<MiniCompanyShowcaseProps> = ({ onExplore }) => {
  const { isRTL } = useLandingContext();
  const sectionRef = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const [activeDept, setActiveDept] = useState('customers');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const DEPARTMENTS = getDepartmentsData(isRTL);

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
        left: direction === 'left' ? -280 : 280,
        behavior: 'smooth',
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
    <section ref={sectionRef} className="py-24 sm:py-32 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        {isInView && (
          <div
            className="max-w-2xl mb-12 sm:mb-16"
            style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6 leading-[1.1]">
              {isRTL ? (
                <>
                  أدِر شركتك بالكامل
                  <br />
                  <span className="text-zinc-400 dark:text-zinc-500">من مكان واحد</span>
                </>
              ) : (
                <>
                  Run your entire company
                  <br />
                  <span className="text-zinc-400 dark:text-zinc-500">from one place</span>
                </>
              )}
            </h2>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {isRTL
                ? '6 أقسام. أكثر من 51 لوحة معلومات. الكل متصل في الوقت الفعلي. كل فريق يحصل على الأدوات التي يحتاجها بينما تحصل القيادة على رؤية كاملة.'
                : '6 departments. 51+ dashboards. All connected in real-time. Every team gets the tools they need while leadership gets complete visibility.'}
            </p>
          </div>
        )}

        {/* Mobile scroll navigation */}
        <div className="sm:hidden flex items-center justify-between mb-4">
          <span className="text-xs text-zinc-500">
            {isRTL ? 'مرر لاستكشاف الأقسام' : 'Swipe to explore departments'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => scroll(isRTL ? 'right' : 'left')}
              disabled={isRTL ? !canScrollRight : !canScrollLeft}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors
                                ${
                                  (isRTL ? canScrollRight : canScrollLeft)
                                    ? 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white'
                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700'
                                }`}
            >
              <CaretLeft size={16} />
            </button>
            <button
              onClick={() => scroll(isRTL ? 'left' : 'right')}
              disabled={isRTL ? !canScrollLeft : !canScrollRight}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors
                                ${
                                  (isRTL ? canScrollLeft : canScrollRight)
                                    ? 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white'
                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700'
                                }`}
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>

        {/* Department Grid - horizontal scroll on mobile */}
        {isInView && (
          <div
            ref={scrollRef}
            className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5
                            overflow-x-auto sm:overflow-visible
                            pb-4 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0
                            snap-x snap-mandatory sm:snap-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {DEPARTMENTS.map((dept, idx) => (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                index={idx}
                isActive={activeDept === dept.id}
                onClick={() => setActiveDept(dept.id)}
                isRTL={isRTL}
              />
            ))}
          </div>
        )}

        {/* Connections visualization */}
        <ConnectionsVisualization activeDept={activeDept} isRTL={isRTL} />

        {/* Bottom stats bar */}
        {isInView && (
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 rounded-2xl
                            bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mt-8"
            style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.5s' }}
          >
            <div className="flex items-center gap-8 sm:gap-12">
              <div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">51+</div>
                <div className="text-sm text-zinc-500">{isRTL ? 'لوحات جاهزة' : 'Ready dashboards'}</div>
              </div>
              <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
              <div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">&lt;1s</div>
                <div className="text-sm text-zinc-500">{isRTL ? 'مزامنة بين الأقسام' : 'Cross-department sync'}</div>
              </div>
              <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
              <div className="hidden sm:block">
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">∞</div>
                <div className="text-sm text-zinc-500">{isRTL ? 'تقارير مخصصة' : 'Custom reports'}</div>
              </div>
            </div>

            <button
              onClick={onExplore}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                                bg-zinc-900 dark:bg-white text-white dark:text-zinc-900
                                font-medium text-sm
                                hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              {isRTL ? 'استكشف الشركة المصغرة' : 'Explore Mini Company'}
              <ArrowIcon size={16} weight="bold" />
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
            `}</style>
    </section>
  );
};
