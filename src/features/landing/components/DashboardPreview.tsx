import React, { useRef, useEffect, useState } from 'react';
import { CheckCircle } from 'phosphor-react';
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

export const DashboardPreview: React.FC = () => {
  const { isRTL } = useLandingContext();
  const { ref, visible } = useScrollReveal();

  const features = isRTL
    ? ['تتبع المشاريع في الوقت الفعلي', 'أدوات قابلة للتخصيص', 'تحليلات الفريق', 'تقارير آلية']
    : ['Real-time project tracking', 'Customizable widgets', 'Team analytics', 'Automated reports'];

  return (
    <section ref={ref} className="py-28 sm:py-36 bg-zinc-950 overflow-hidden">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 sm:mb-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-medium mb-5">
            {isRTL ? 'معاينة لوحة التحكم' : 'Dashboard Preview'}
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-white mb-6">
            {isRTL ? (
              <>
                شاهد كل شيء
                <br />
                <span className="text-zinc-500">بنظرة واحدة</span>
              </>
            ) : (
              <>
                See everything
                <br />
                <span className="text-zinc-500">at a glance</span>
              </>
            )}
          </h2>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {isRTL
              ? 'لوحات معلومات بديهية توفر لك رؤية كاملة لأعمالك.'
              : 'Intuitive dashboards give you complete visibility into your business.'}
          </p>
        </div>

        {/* Feature checklist */}
        <div
          className={`flex flex-wrap justify-center gap-4 sm:gap-6 mb-12 transition-all duration-700 delay-200
          ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          {features.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-zinc-600" />
              <span className="text-sm text-zinc-400">{item}</span>
            </div>
          ))}
        </div>

        {/* Dashboard mockup */}
        <div
          className={`transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 bg-zinc-900 border-b border-zinc-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="h-6 w-44 rounded-md bg-zinc-800 flex items-center justify-center">
                  <span className="text-[10px] text-zinc-500 font-medium">app.nabdchain.com/dashboard</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: isRTL ? 'مكتمل' : 'Completed', value: '147', change: '+12%' },
                  { label: isRTL ? 'المشاريع' : 'Projects', value: '23', change: '-3%' },
                  { label: isRTL ? 'السرعة' : 'Velocity', value: '94%', change: '+8%' },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/30">
                    <div className="text-[11px] text-zinc-500 mb-1">{stat.label}</div>
                    <div className="text-xl sm:text-2xl font-semibold text-white mb-1">{stat.value}</div>
                    <div className={`text-[11px] ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stat.change}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart area */}
              <div className="grid grid-cols-3 gap-3">
                {/* Bar chart */}
                <div className="col-span-2 rounded-xl bg-zinc-800/40 p-4 border border-zinc-700/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-3 w-28 rounded bg-zinc-700" />
                    <div className="flex gap-1.5">
                      <div className="h-5 w-12 rounded bg-zinc-700/60" />
                      <div className="h-5 w-12 rounded bg-zinc-700/60" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-32">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-blue-500/60 to-blue-400/20 transition-all duration-700"
                        style={{ height: visible ? `${h}%` : '8%', transitionDelay: `${600 + i * 50}ms` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Side panel */}
                <div className="rounded-xl bg-zinc-800/40 p-4 border border-zinc-700/20">
                  <div className="h-3 w-16 rounded bg-zinc-700 mb-5" />
                  <div className="space-y-4">
                    {[70, 55, 85, 40].map((w, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="h-2 rounded bg-zinc-700" style={{ width: `${w}%` }} />
                        <div className="h-1.5 w-full rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700"
                            style={{ width: visible ? `${w}%` : '0%', transitionDelay: `${800 + i * 100}ms` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
