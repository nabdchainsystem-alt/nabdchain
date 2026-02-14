import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Play } from 'phosphor-react';
import { useLandingContext } from '../LandingPage';

// Scroll-triggered fade-in hook
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

export const HeroSection: React.FC<{ onEnterSystem?: () => void }> = ({ onEnterSystem }) => {
  const { t, isRTL } = useLandingContext();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const { ref: heroRef, visible } = useScrollReveal(0.05);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-white"
    >
      {/* Subtle top gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-white to-white pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[980px] mx-auto px-6 pt-32 sm:pt-40 pb-20 sm:pb-28 text-center">
        {/* Tagline pill */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 mb-8
            transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-600 tracking-wide">{t('heroTagline')}</span>
        </div>

        {/* Main headline — Apple massive type */}
        <h1
          className={`text-5xl sm:text-6xl md:text-7xl lg:text-[80px] xl:text-[88px] font-semibold tracking-tight leading-[1.04] text-zinc-900 mb-7
            transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ whiteSpace: 'pre-line' }}
        >
          {t('heroHeadline')}
        </h1>

        {/* Subtitle */}
        <p
          className={`text-lg sm:text-xl md:text-[22px] text-zinc-500 leading-relaxed max-w-2xl mx-auto mb-12
            transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          {t('heroSub')}
        </p>

        {/* CTA buttons — Apple double-button pattern */}
        <div
          className={`flex items-center justify-center gap-4 sm:gap-5 flex-wrap
            transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <button
            onClick={onEnterSystem}
            className="group h-12 sm:h-[52px] px-7 sm:px-9 rounded-full bg-zinc-900 text-white text-[15px] font-semibold
              hover:bg-zinc-700 active:scale-[0.98] transition-all duration-200 flex items-center gap-2.5
              shadow-[0_2px_16px_-4px_rgba(0,0,0,0.3)]"
          >
            {t('getStarted')}
            <ArrowIcon
              size={16}
              weight="bold"
              className="group-hover:translate-x-0.5 transition-transform duration-200"
            />
          </button>
          <a
            href="#demo"
            className="group h-12 sm:h-[52px] px-7 sm:px-9 rounded-full text-[15px] font-semibold text-zinc-900
              hover:bg-zinc-100 active:scale-[0.98] transition-all duration-200 flex items-center gap-2.5"
          >
            <Play size={16} weight="fill" className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            {t('watchTheFilm')}
          </a>
        </div>
      </div>

      {/* Product mockup area — clean floating card */}
      <div
        className={`relative z-10 w-full max-w-[1100px] mx-auto px-6 pb-12
          transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="relative rounded-2xl overflow-hidden bg-zinc-950 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.25)] border border-zinc-200/20">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5 bg-zinc-900 border-b border-zinc-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="h-6 w-48 rounded-md bg-zinc-800 flex items-center justify-center">
                <span className="text-[10px] text-zinc-500 font-medium">app.nabdchain.com</span>
              </div>
            </div>
          </div>

          {/* Mock dashboard content */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                </div>
                <div>
                  <div className="h-3 w-28 rounded bg-zinc-700 mb-1.5" />
                  <div className="h-2 w-20 rounded bg-zinc-800" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-7 w-16 rounded-md bg-zinc-800" />
                <div className="h-7 w-7 rounded-md bg-zinc-800" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Revenue', value: '$48.2K', color: 'bg-emerald-500', change: '+12%' },
                { label: 'Orders', value: '1,284', color: 'bg-blue-500', change: '+8%' },
                { label: 'Customers', value: '3,621', color: 'bg-violet-500', change: '+23%' },
                { label: 'Conversion', value: '4.2%', color: 'bg-amber-500', change: '+2%' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-zinc-800/60 p-4 border border-zinc-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                    <span className="text-[11px] text-zinc-500">{stat.label}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-lg sm:text-xl font-semibold text-white">{stat.value}</span>
                    <span className="text-[11px] text-emerald-400 mb-0.5">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart area + sidebar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 rounded-xl bg-zinc-800/40 p-4 border border-zinc-700/20 h-40 sm:h-48">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-24 rounded bg-zinc-700" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-10 rounded bg-zinc-700/60" />
                    <div className="h-5 w-10 rounded bg-zinc-700/60" />
                  </div>
                </div>
                {/* Stylized chart bars */}
                <div className="flex items-end gap-1.5 h-24 sm:h-32 pt-4">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-blue-500/60 to-blue-400/30"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-800/40 p-4 border border-zinc-700/20">
                <div className="h-3 w-16 rounded bg-zinc-700 mb-4" />
                <div className="space-y-3">
                  {[70, 55, 85, 40].map((w, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-2 rounded bg-zinc-700" style={{ width: `${w}%` }} />
                      <div className="h-1.5 w-full rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                          style={{ width: `${w}%` }}
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

      {/* Trusted by — subtle, Apple-like */}
      <div
        className={`relative z-10 w-full max-w-[800px] mx-auto px-6 py-16 sm:py-20 text-center
          transition-all duration-700 delay-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-medium mb-8">
          {isRTL ? 'موثوق به من قبل الشركات الرائدة' : 'Trusted by industry leaders'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {['Nexora', 'Veltrix', 'Quantix', 'Synthra', 'Lumina', 'Zephyr'].map((name) => (
            <span
              key={name}
              className="text-sm sm:text-base font-semibold text-zinc-300 tracking-wide opacity-60 hover:opacity-90 transition-opacity cursor-default"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
