import React, { useRef, useEffect, useState, memo } from 'react';
import { Kanban, Lightning, Users, ChartLine, Shield, ArrowRight, ArrowLeft, Check, Lock, Globe } from 'phosphor-react';
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

const AutomationPreviewCard = memo(({ isRTL }: { isRTL: boolean }) => {
  const [activeRule, setActiveRule] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setActiveRule((p) => (p + 1) % 3), 2000);
    return () => clearInterval(interval);
  }, []);

  const rules = isRTL
    ? [
        { trigger: 'الحالة → مكتمل', action: 'إشعار الفريق', icon: Check },
        { trigger: 'تجاوز الموعد', action: 'تعيين عاجل', icon: Lightning },
        { trigger: 'مسؤول جديد', action: 'إرسال بريد', icon: Users },
      ]
    : [
        { trigger: 'Status → Done', action: 'Notify team', icon: Check },
        { trigger: 'Due date passed', action: 'Set Urgent', icon: Lightning },
        { trigger: 'New assignee', action: 'Send email', icon: Users },
      ];

  return (
    <div className="space-y-2">
      {rules.map((rule, i) => {
        const Icon = rule.icon;
        const isActive = activeRule === i;
        return (
          <div
            key={i}
            className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-white text-zinc-900' : 'bg-zinc-200'
                }`}
              >
                <Icon size={12} />
              </div>
              <span className="text-xs font-medium">{rule.trigger}</span>
            </div>
            <span className={`text-[10px] ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>{rule.action}</span>
          </div>
        );
      })}
    </div>
  );
});

interface LiveDemoSectionProps {
  onTryDemo?: () => void;
}

export const LiveDemoSection: React.FC<LiveDemoSectionProps> = ({ onTryDemo }) => {
  const { isRTL } = useLandingContext();
  const { ref, visible } = useScrollReveal();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const cards = [
    {
      icon: Kanban,
      title: isRTL ? 'طرق عرض متعددة' : 'Multiple Views',
      desc: isRTL ? 'أكثر من 14 تخطيط' : '14+ board layouts',
      span: 'sm:col-span-2',
      content: (
        <div className="flex gap-2 mt-4">
          {[
            { label: isRTL ? 'للتنفيذ' : 'To Do', items: 3 },
            { label: isRTL ? 'قيد العمل' : 'Working', items: 2 },
            { label: isRTL ? 'مكتمل' : 'Done', items: 4 },
          ].map((col) => (
            <div key={col.label} className="flex-1">
              <div className="text-[10px] text-zinc-400 mb-2">{col.label}</div>
              <div className="space-y-1.5">
                {Array.from({ length: Math.min(col.items, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-6 rounded-lg ${col.label === 'Done' || col.label === 'مكتمل' ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Lightning,
      title: isRTL ? 'الأتمتة' : 'Automations',
      desc: isRTL ? 'أكثر من 50 قالب' : '50+ templates',
      content: <AutomationPreviewCard isRTL={isRTL} />,
    },
    {
      icon: ChartLine,
      title: isRTL ? 'أكثر من 51 لوحة' : '51+ Dashboards',
      desc: isRTL ? 'جاهزة ومخصصة' : 'Pre-built & custom',
      content: (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-zinc-100 rounded-lg p-3">
            <div className="text-[10px] text-zinc-400 mb-1">{isRTL ? 'الإيرادات' : 'Revenue'}</div>
            <div className="text-sm font-semibold text-zinc-900">$2.4M</div>
          </div>
          <div className="bg-zinc-100 rounded-lg p-3">
            <div className="text-[10px] text-zinc-400 mb-1">{isRTL ? 'المهام' : 'Tasks'}</div>
            <div className="text-sm font-semibold text-zinc-900">1,847</div>
          </div>
        </div>
      ),
    },
    {
      icon: Users,
      title: isRTL ? 'تعاون مباشر' : 'Live Collaboration',
      desc: isRTL ? 'تحرير متزامن' : 'Real-time editing',
      content: (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {['SK', 'JD', 'MR'].map((initials, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-[9px] text-zinc-600 font-medium"
              >
                {initials}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-400">{isRTL ? '3 يحررون' : '3 editing'}</span>
          </div>
        </div>
      ),
    },
    {
      icon: Shield,
      title: isRTL ? 'أمان المؤسسات' : 'Enterprise Security',
      desc: isRTL ? 'حماية بمستوى البنوك' : 'Bank-grade protection',
      span: 'sm:col-span-2',
      content: (
        <div className="space-y-2 mt-4">
          {[
            { icon: Lock, label: isRTL ? 'تشفير شامل' : 'End-to-end encryption', status: isRTL ? 'نشط' : 'Active' },
            { icon: Shield, label: isRTL ? 'متوافق مع SOC 2' : 'SOC 2 Compliant', status: isRTL ? 'موثق' : 'Verified' },
            { icon: Globe, label: isRTL ? 'SSO و SAML' : 'SSO & SAML', status: isRTL ? 'جاهز' : 'Ready' },
          ].map(({ icon: FIcon, label, status }) => (
            <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50">
              <div className="flex items-center gap-2">
                <FIcon size={14} className="text-zinc-400" />
                <span className="text-xs text-zinc-600">{label}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-emerald-600">{status}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section ref={ref} className="py-28 sm:py-36 bg-white overflow-hidden">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 sm:mb-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-medium mb-5">
            {isRTL ? 'مميزات المنصة' : 'Platform Features'}
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-zinc-900 mb-6">
            {isRTL ? (
              <>
                كل ما تحتاجه
                <br />
                <span className="text-zinc-400">في مكان واحد</span>
              </>
            ) : (
              <>
                Everything you need
                <br />
                <span className="text-zinc-400">in one place</span>
              </>
            )}
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg
                  transition-all duration-500 ${card.span || ''}
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${200 + i * 80}ms` }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                    <Icon size={20} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{card.title}</h3>
                    <p className="text-xs text-zinc-400">{card.desc}</p>
                  </div>
                </div>
                {card.content}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={onTryDemo}
            className="h-12 px-8 rounded-full bg-zinc-900 text-white text-sm font-semibold
              hover:bg-zinc-700 transition-colors flex items-center gap-2 mx-auto"
          >
            {isRTL ? 'ابدأ تجربة مجانية' : 'Start Free Trial'}
            <ArrowIcon size={14} weight="bold" />
          </button>
          <p className="mt-4 text-sm text-zinc-400">{isRTL ? 'لا حاجة لبطاقة ائتمان' : 'No credit card required'}</p>
        </div>
      </div>
    </section>
  );
};
