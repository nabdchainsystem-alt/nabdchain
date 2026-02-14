import React, { useRef, useEffect, useState, memo } from 'react';
import {
  Chalkboard,
  Note,
  ChartBar,
  UsersFour,
  Lightning,
  Kanban,
  Calendar,
  Timer,
  ChartLine,
  Rows,
  Eye,
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

/* ── Mini Previews ── */

const WhiteboardPreview = memo(() => (
  <div className="h-full rounded-lg bg-zinc-100 overflow-hidden p-2">
    <svg className="w-full h-full" viewBox="0 0 120 60">
      <rect x="8" y="8" width="28" height="18" rx="3" fill="#d4d4d8" stroke="#a1a1aa" strokeWidth="1" />
      <rect x="46" y="16" width="22" height="22" rx="3" fill="#d4d4d8" stroke="#a1a1aa" strokeWidth="1" />
      <circle cx="92" cy="22" r="10" fill="#d4d4d8" stroke="#a1a1aa" strokeWidth="1" />
      <path d="M12 48 L36 38 L60 50 L88 34" stroke="#71717a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  </div>
));

const NotesPreview = memo(() => (
  <div className="h-full flex flex-col gap-1">
    <div className="flex-1 bg-zinc-100 rounded-lg p-2">
      <div className="text-[7px] text-zinc-400 mb-1">Cue</div>
      <div className="h-1 w-full bg-zinc-200 rounded mb-1" />
      <div className="h-1 w-3/4 bg-zinc-200 rounded" />
    </div>
    <div className="flex-[2] bg-zinc-100 rounded-lg p-2">
      <div className="text-[7px] text-zinc-400 mb-1">Notes</div>
      <div className="space-y-1">
        <div className="h-1 w-full bg-zinc-200 rounded" />
        <div className="h-1 w-5/6 bg-zinc-200 rounded" />
        <div className="h-1 w-4/5 bg-zinc-200 rounded" />
      </div>
    </div>
  </div>
));

const DashboardMini = memo(() => (
  <div className="h-full grid grid-cols-2 gap-1">
    <div className="bg-zinc-100 rounded-lg p-1.5">
      <div className="text-[7px] text-zinc-400">Revenue</div>
      <div className="text-[10px] font-semibold text-zinc-900">$2.4M</div>
    </div>
    <div className="bg-zinc-100 rounded-lg p-1.5">
      <div className="text-[7px] text-zinc-400">Tasks</div>
      <div className="text-[10px] font-semibold text-zinc-900">1,847</div>
    </div>
    <div className="col-span-2 bg-zinc-100 rounded-lg p-1.5 flex items-end gap-0.5 h-8">
      {[40, 65, 45, 80, 55, 70].map((h, i) => (
        <div key={i} className="flex-1 bg-zinc-300 rounded-t-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
));

const WorkloadMini = memo(() => (
  <div className="h-full space-y-1.5 pt-1">
    {[
      { name: 'S', load: 85 },
      { name: 'J', load: 60 },
      { name: 'M', load: 95 },
    ].map((p, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-full bg-zinc-200 flex items-center justify-center text-[7px] font-medium text-zinc-500">
          {p.name}
        </div>
        <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${p.load}%` }} />
        </div>
      </div>
    ))}
  </div>
));

const AutomationMini = memo(() => (
  <div className="h-full flex items-center justify-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
      <Timer size={12} className="text-white" />
    </div>
    <div className="w-4 h-0.5 bg-zinc-300 rounded" />
    <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center">
      <Lightning size={12} className="text-zinc-600" />
    </div>
    <div className="w-4 h-0.5 bg-zinc-300 rounded" />
    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
      <UsersFour size={12} className="text-zinc-500" />
    </div>
  </div>
));

/* ── Board View Previews ── */

const KanbanPreview = memo(() => (
  <div className="flex gap-1 h-full p-1.5">
    {[3, 2, 4].map((count, col) => (
      <div key={col} className="flex-1 space-y-1">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`h-3 rounded ${col === 2 ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
        ))}
      </div>
    ))}
  </div>
));

const TablePreview = memo(() => (
  <div className="h-full p-1.5 space-y-1">
    <div className="flex gap-1 h-2.5">
      <div className="flex-1 bg-zinc-300 rounded" />
      <div className="flex-1 bg-zinc-300 rounded" />
      <div className="flex-1 bg-zinc-300 rounded" />
    </div>
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-1 h-2">
        <div className="flex-1 bg-zinc-100 rounded" />
        <div className="flex-1 bg-zinc-100 rounded" />
        <div className="flex-1 bg-zinc-100 rounded" />
      </div>
    ))}
  </div>
));

const CalendarPreview = memo(() => (
  <div className="h-full p-1.5">
    <div className="grid grid-cols-7 gap-0.5 h-full">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className={`rounded-sm ${[3, 7, 10].includes(i) ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
      ))}
    </div>
  </div>
));

const TimelinePreview = memo(() => (
  <div className="h-full p-1.5 flex flex-col justify-center gap-1.5">
    <div className="h-2.5 w-3/4 bg-zinc-200 rounded-full ml-2" />
    <div className="h-2.5 w-1/2 bg-zinc-900 rounded-full ml-6" />
    <div className="h-2.5 w-2/3 bg-zinc-300 rounded-full ml-4" />
  </div>
));

const GanttPreview = memo(() => (
  <div className="h-full p-1.5 space-y-1.5">
    {[
      { offset: '10%', width: '40%', dark: true },
      { offset: '30%', width: '50%', dark: false },
      { offset: '5%', width: '60%', dark: false },
    ].map((bar, i) => (
      <div key={i} className="flex items-center gap-1">
        <div className="w-6 h-1.5 bg-zinc-200 rounded" />
        <div
          className={`h-2.5 rounded ${bar.dark ? 'bg-zinc-900' : 'bg-zinc-300'}`}
          style={{ marginLeft: bar.offset, width: bar.width }}
        />
      </div>
    ))}
  </div>
));

/* ── Data ── */

const getToolsData = (isRTL: boolean) => [
  {
    name: isRTL ? 'السبورة البيضاء' : 'Whiteboard',
    icon: Chalkboard,
    desc: isRTL ? 'لوحة بصرية' : 'Visual canvas',
    preview: WhiteboardPreview,
  },
  {
    name: isRTL ? 'ملاحظات كورنيل' : 'Cornell Notes',
    icon: Note,
    desc: isRTL ? 'ملاحظات ذكية' : 'Smart notes',
    preview: NotesPreview,
  },
  {
    name: isRTL ? 'لوحات المعلومات' : 'Dashboards',
    icon: ChartBar,
    desc: isRTL ? 'تحليلات مباشرة' : 'Live analytics',
    preview: DashboardMini,
  },
  {
    name: isRTL ? 'عبء العمل' : 'Workload',
    icon: UsersFour,
    desc: isRTL ? 'السعة' : 'Capacity',
    preview: WorkloadMini,
  },
  {
    name: isRTL ? 'الأتمتة' : 'Automation',
    icon: Lightning,
    desc: isRTL ? 'بدون برمجة' : 'No-code flows',
    preview: AutomationMini,
  },
];

const getBoardViews = (isRTL: boolean) => [
  {
    name: isRTL ? 'كانبان' : 'Kanban',
    icon: Kanban,
    desc: isRTL ? 'لوحات سير عمل بصرية' : 'Visual workflow boards',
    preview: KanbanPreview,
  },
  {
    name: isRTL ? 'جدول' : 'Table',
    icon: Rows,
    desc: isRTL ? 'بيانات كجداول' : 'Spreadsheet-like data',
    preview: TablePreview,
  },
  {
    name: isRTL ? 'التقويم' : 'Calendar',
    icon: Calendar,
    desc: isRTL ? 'تخطيط بالتواريخ' : 'Date-based planning',
    preview: CalendarPreview,
  },
  {
    name: isRTL ? 'الجدول الزمني' : 'Timeline',
    icon: Timer,
    desc: isRTL ? 'خرائط المشاريع' : 'Project roadmaps',
    preview: TimelinePreview,
  },
  {
    name: isRTL ? 'جانت' : 'Gantt',
    icon: ChartLine,
    desc: isRTL ? 'جدولة المشاريع' : 'Project scheduling',
    preview: GanttPreview,
  },
];

interface ToolsShowcaseProps {
  onBoardViewsMount?: (element: HTMLDivElement | null) => void;
}

export const ToolsShowcase: React.FC<ToolsShowcaseProps> = () => {
  const { isRTL } = useLandingContext();
  const { ref: toolsRef, visible: toolsVisible } = useScrollReveal();
  const { ref: viewsRef, visible: viewsVisible } = useScrollReveal();
  const [activeTool, setActiveTool] = useState(0);
  const [activeView, setActiveView] = useState(0);

  const tools = getToolsData(isRTL);
  const views = getBoardViews(isRTL);

  const additionalViews = isRTL
    ? ['قائمة', 'نظرة عامة', 'نماذج', 'محوري', 'مستند', 'المشتريات', 'سلسلة التوريد', '+المزيد']
    : ['List', 'Overview', 'Forms', 'Pivot', 'Doc', 'Procurement', 'Supply Chain', '+more'];

  return (
    <>
      {/* ── Tools Section (dark) ── */}
      <section ref={toolsRef} className="py-28 sm:py-36 bg-zinc-950 overflow-hidden">
        <div className="max-w-[980px] mx-auto px-6">
          {/* Header */}
          <div
            className={`text-center mb-16 sm:mb-20 transition-all duration-700 ${toolsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-medium mb-5">
              {isRTL ? 'أدوات قوية' : 'Power Tools'}
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-white mb-6">
              {isRTL ? (
                <>
                  مصممة لكل
                  <br />
                  <span className="text-zinc-500">سير عمل</span>
                </>
              ) : (
                <>
                  Built for every
                  <br />
                  <span className="text-zinc-500">workflow</span>
                </>
              )}
            </h2>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {isRTL ? 'أدوات قوية تتكيف مع طريقة عملك' : 'Powerful tools that adapt to how you work.'}
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 mb-10">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              const Preview = tool.preview;
              const isActive = activeTool === i;
              return (
                <div
                  key={tool.name}
                  onClick={() => setActiveTool(i)}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all duration-500
                    ${
                      isActive
                        ? 'bg-zinc-800 border-zinc-600 shadow-lg'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
                    }
                    ${toolsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${200 + i * 80}ms` }}
                >
                  <div className="h-20 mb-4 rounded-xl bg-white/5 border border-zinc-700/30 overflow-hidden">
                    <Preview />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300
                      ${isActive ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      <Icon size={16} weight="fill" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{tool.name}</div>
                      <div className="text-[10px] text-zinc-500">{tool.desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional tools note */}
          <div
            className={`text-center transition-all duration-700 delay-500 ${toolsVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            <span className="text-sm text-zinc-500">
              {isRTL
                ? '+ 5 أدوات متقدمة أخرى بما فيها جداول البيانات والأهداف والمزيد'
                : '+ 5 more advanced tools including Spreadsheets, Goals & OKRs, and more'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Board Views Section (light) ── */}
      <section ref={viewsRef} className="py-28 sm:py-36 bg-white overflow-hidden">
        <div className="max-w-[980px] mx-auto px-6">
          {/* Header */}
          <div
            className={`text-center mb-16 sm:mb-20 transition-all duration-700 ${viewsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium mb-5">
              <Eye size={12} weight="fill" />
              {isRTL ? '14 طريقة عرض' : '14 Board Views'}
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-zinc-900 mb-6">
              {isRTL ? (
                <>
                  لوحة واحدة
                  <br />
                  <span className="text-zinc-400">كل المنظورات</span>
                </>
              ) : (
                <>
                  One board
                  <br />
                  <span className="text-zinc-400">every perspective</span>
                </>
              )}
            </h2>
            <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              {isRTL
                ? 'التبديل بين العروض فوراً. نفس البيانات، رؤى مختلفة.'
                : 'Switch between views instantly. Same data, different insights.'}
            </p>
          </div>

          {/* Views Grid */}
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 mb-10">
            {views.map((view, i) => {
              const Icon = view.icon;
              const Preview = view.preview;
              const isActive = activeView === i;
              return (
                <div
                  key={view.name}
                  onClick={() => setActiveView(i)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all duration-500
                    ${
                      isActive
                        ? 'bg-zinc-900 border-zinc-700 shadow-lg'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                    }
                    ${viewsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${200 + i * 80}ms` }}
                >
                  <div
                    className={`h-16 mb-3 rounded-xl overflow-hidden transition-colors duration-300
                    ${isActive ? 'bg-zinc-800' : 'bg-white'}`}
                  >
                    <Preview />
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon size={14} weight="fill" className={isActive ? 'text-white' : 'text-zinc-500'} />
                    <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-zinc-700'}`}>
                      {view.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional views pills */}
          <div
            className={`flex flex-wrap justify-center gap-2 mb-12 transition-all duration-700 delay-300
            ${viewsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {additionalViews.map((name, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-500"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Stats bar */}
          <div
            className={`flex justify-center items-center gap-8 sm:gap-12 pt-8 border-t border-zinc-200
            transition-all duration-700 delay-500 ${viewsVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            {[
              { value: '14', label: isRTL ? 'طرق عرض' : 'Views' },
              { value: '10', label: isRTL ? 'أدوات' : 'Tools' },
              { value: '1', label: isRTL ? 'منصة' : 'Platform' },
            ].map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <div className="w-px h-10 bg-zinc-200" />}
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-semibold text-zinc-900">{stat.value}</div>
                  <div className="text-xs text-zinc-400 mt-1">{stat.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
