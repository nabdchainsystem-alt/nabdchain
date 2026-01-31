import React, { useState, useRef, useEffect, memo } from 'react';
import { useInView } from 'framer-motion';
import {
    Chalkboard, Note, ChartBar, UsersFour, ArrowsClockwise,
    Lightning, Table, Target, PaintBrush, Flask,
    ListBullets, Kanban, Calendar, Timer, ChartLine,
    FileText, GridFour, ShoppingCart, Truck, Rows, Columns,
    Sparkle, Eye, ArrowRight, ArrowLeft, CaretLeft, CaretRight,
    CheckCircle, Circle, Users, Clock, Flag
} from 'phosphor-react';
import { useLandingContext } from '../LandingPage';

// Mini Whiteboard Preview
const WhiteboardPreview = memo(() => (
    <div className="relative h-full bg-white dark:bg-zinc-100 rounded-lg overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 120 80">
            <rect x="10" y="15" width="30" height="20" rx="3" fill="#fbbf24" fillOpacity="0.3" stroke="#fbbf24" strokeWidth="1.5"/>
            <rect x="50" y="25" width="25" height="25" rx="3" fill="#3b82f6" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="1.5"/>
            <circle cx="95" cy="30" r="12" fill="#10b981" fillOpacity="0.3" stroke="#10b981" strokeWidth="1.5"/>
            <path d="M15 55 L40 45 L65 60 L90 40" stroke="#71717a" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <line x1="25" y1="70" x2="100" y2="70" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="3,3"/>
        </svg>
        <div className="absolute bottom-2 right-2 flex gap-1">
            <div className="w-4 h-4 rounded-full bg-yellow-400/50"/>
            <div className="w-4 h-4 rounded-full bg-blue-400/50"/>
            <div className="w-4 h-4 rounded-full bg-green-400/50"/>
        </div>
    </div>
));

// Mini Notes Preview
const NotesPreview = memo(() => (
    <div className="h-full flex flex-col gap-1.5">
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2">
            <div className="text-[8px] text-zinc-400 mb-1">Cue Column</div>
            <div className="space-y-1">
                <div className="h-1.5 w-full bg-zinc-300 dark:bg-zinc-600 rounded"/>
                <div className="h-1.5 w-3/4 bg-zinc-300 dark:bg-zinc-600 rounded"/>
            </div>
        </div>
        <div className="flex-[2] bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2">
            <div className="text-[8px] text-zinc-400 mb-1">Notes</div>
            <div className="space-y-1">
                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded"/>
                <div className="h-1.5 w-5/6 bg-zinc-200 dark:bg-zinc-700 rounded"/>
                <div className="h-1.5 w-4/5 bg-zinc-200 dark:bg-zinc-700 rounded"/>
            </div>
        </div>
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg p-1.5">
            <div className="text-[8px] text-zinc-500">Summary</div>
        </div>
    </div>
));

// Mini Dashboard Preview with animated bars - styled to match "See everything at a glance"
const DashboardPreviewMini = memo(() => {
    const [animate, setAnimate] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="h-full grid grid-cols-2 gap-1.5">
            <div className="bg-zinc-700/50 border border-zinc-600/30 rounded-lg p-2 flex flex-col">
                <div className="text-[8px] text-zinc-400 mb-auto">Revenue</div>
                <div className="text-sm font-bold text-white">$2.4M</div>
            </div>
            <div className="bg-zinc-700/50 border border-zinc-600/30 rounded-lg p-2 flex flex-col">
                <div className="text-[8px] text-zinc-400 mb-auto">Tasks</div>
                <div className="text-sm font-bold text-white">1,847</div>
            </div>
            <div className="col-span-2 bg-zinc-700/50 border border-zinc-600/30 rounded-lg p-2">
                <div className="flex items-end gap-0.5 h-6">
                    {[40, 65, 45, 80, 55, 70].map((h, i) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-t-sm transition-all duration-500 ${
                                i === 3 || i === 5
                                    ? 'bg-gradient-to-t from-white to-zinc-200'
                                    : 'bg-gradient-to-t from-zinc-500 to-zinc-400'
                            }`}
                            style={{
                                height: animate ? `${h}%` : '10%',
                                transitionDelay: `${i * 50}ms`
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});

// Mini Workload Preview - styled to match dashboard
const WorkloadPreview = memo(() => (
    <div className="h-full space-y-1.5">
        {[
            { name: 'Sarah', load: 85, avatar: 'S' },
            { name: 'John', load: 60, avatar: 'J' },
            { name: 'Mike', load: 95, avatar: 'M' },
        ].map((person, i) => (
            <div key={i} className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-zinc-600 flex items-center justify-center text-[8px] font-medium text-zinc-300">
                    {person.avatar}
                </div>
                <div className="flex-1 h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${
                            person.load > 90
                                ? 'bg-gradient-to-r from-white to-zinc-200'
                                : person.load > 70
                                    ? 'bg-gradient-to-r from-zinc-400 to-zinc-300'
                                    : 'bg-gradient-to-r from-zinc-500 to-zinc-400'
                        }`}
                        style={{ width: `${person.load}%` }}
                    />
                </div>
                <span className="text-[8px] text-zinc-400 w-6">{person.load}%</span>
            </div>
        ))}
    </div>
));

// Mini Automation Preview - styled to match dashboard
const AutomationPreview = memo(() => (
    <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Clock size={16} className="text-zinc-900"/>
            </div>
            <ArrowRight size={12} className="text-zinc-500"/>
            <div className="w-10 h-10 rounded-lg bg-zinc-600 border border-zinc-500/50 flex items-center justify-center">
                <Lightning size={16} className="text-zinc-300"/>
            </div>
            <ArrowRight size={12} className="text-zinc-500"/>
            <div className="w-10 h-10 rounded-lg bg-zinc-700 border border-zinc-600/50 flex items-center justify-center">
                <Users size={16} className="text-zinc-400"/>
            </div>
        </div>
    </div>
));

// Tools data with previews
const getToolsData = (isRTL: boolean) => [
    { name: isRTL ? 'السبورة البيضاء' : 'Whiteboard', icon: Chalkboard, description: isRTL ? 'لوحة بصرية' : 'Visual canvas', preview: WhiteboardPreview },
    { name: isRTL ? 'ملاحظات كورنيل' : 'Cornell Notes', icon: Note, description: isRTL ? 'ملاحظات ذكية' : 'Smart notes', preview: NotesPreview },
    { name: isRTL ? 'لوحات المعلومات' : 'Dashboards', icon: ChartBar, description: isRTL ? 'تحليلات مباشرة' : 'Live analytics', preview: DashboardPreviewMini },
    { name: isRTL ? 'عبء العمل' : 'Workload', icon: UsersFour, description: isRTL ? 'السعة' : 'Capacity', preview: WorkloadPreview },
    { name: isRTL ? 'الأتمتة' : 'Automation', icon: Lightning, description: isRTL ? 'بدون برمجة' : 'No-code flows', preview: AutomationPreview },
];

// Tool Card with visual preview - styled to match "See everything at a glance"
const ToolCard: React.FC<{ tool: ReturnType<typeof getToolsData>[0]; index: number; isActive: boolean; onClick: () => void }> = memo(({
    tool,
    index,
    isActive,
    onClick
}) => {
    const Icon = tool.icon;
    const Preview = tool.preview;

    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer flex-shrink-0 w-[240px] sm:w-auto
                transition-all duration-300 ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
            style={{
                opacity: 0,
                animation: 'fadeInUp 0.5s ease-out forwards',
                animationDelay: `${0.1 + index * 0.08}s`
            }}
        >
            <div className={`h-full p-4 rounded-2xl border transition-all duration-300 ${
                isActive
                    ? 'bg-zinc-800/70 border-zinc-600/50 shadow-xl shadow-purple-500/10'
                    : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600/50 hover:bg-zinc-800/70 hover:shadow-lg'
            }`}>
                {/* Preview Area */}
                <div className={`h-24 mb-4 rounded-xl overflow-hidden transition-colors ${
                    isActive ? 'bg-zinc-900/80 border border-zinc-700/30' : 'bg-zinc-900/60 border border-zinc-700/20'
                }`}>
                    <div className="h-full p-2">
                        <Preview />
                    </div>
                </div>

                {/* Info */}
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                            ? 'bg-white text-zinc-900'
                            : 'bg-zinc-700/50 border border-zinc-600/50 text-zinc-300 group-hover:bg-white group-hover:text-zinc-900'
                    }`}>
                        <Icon size={18} weight="fill"/>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white">
                            {tool.name}
                        </h4>
                        <p className="text-xs text-zinc-400">
                            {tool.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Board View Mini Previews
const KanbanViewPreview = memo(() => (
    <div className="flex gap-1 h-full p-2">
        {[3, 2, 4].map((count, col) => (
            <div key={col} className="flex-1 space-y-1">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className={`h-4 rounded ${col === 2 ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}/>
                ))}
            </div>
        ))}
    </div>
));

const TableViewPreview = memo(() => (
    <div className="h-full p-2 space-y-1">
        <div className="flex gap-1 h-3">
            <div className="flex-1 bg-zinc-300 dark:bg-zinc-600 rounded"/>
            <div className="flex-1 bg-zinc-300 dark:bg-zinc-600 rounded"/>
            <div className="flex-1 bg-zinc-300 dark:bg-zinc-600 rounded"/>
        </div>
        {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-1 h-2.5">
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded"/>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded"/>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded"/>
            </div>
        ))}
    </div>
));

const CalendarViewPreview = memo(() => (
    <div className="h-full p-2">
        <div className="grid grid-cols-7 gap-0.5 h-full">
            {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className={`rounded-sm ${[3, 7, 10].includes(i) ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}/>
            ))}
        </div>
    </div>
));

const TimelineViewPreview = memo(() => (
    <div className="h-full p-2 flex flex-col justify-center gap-1.5">
        <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded-full ml-2"/>
        <div className="h-3 w-1/2 bg-zinc-900 dark:bg-white rounded-full ml-6"/>
        <div className="h-3 w-2/3 bg-zinc-300 dark:bg-zinc-600 rounded-full ml-4"/>
    </div>
));

const GanttViewPreview = memo(() => (
    <div className="h-full p-2 space-y-1.5">
        <div className="flex items-center gap-1">
            <div className="w-8 h-2 bg-zinc-200 dark:bg-zinc-700 rounded"/>
            <div className="flex-1 h-3 bg-zinc-900 dark:bg-white rounded" style={{ marginLeft: '10%', width: '40%' }}/>
        </div>
        <div className="flex items-center gap-1">
            <div className="w-8 h-2 bg-zinc-200 dark:bg-zinc-700 rounded"/>
            <div className="flex-1 h-3 bg-zinc-300 dark:bg-zinc-600 rounded" style={{ marginLeft: '30%', width: '50%' }}/>
        </div>
        <div className="flex items-center gap-1">
            <div className="w-8 h-2 bg-zinc-200 dark:bg-zinc-700 rounded"/>
            <div className="flex-1 h-3 bg-zinc-400 dark:bg-zinc-500 rounded" style={{ marginLeft: '5%', width: '60%' }}/>
        </div>
    </div>
));

// Board views with previews
const getBoardViewsData = (isRTL: boolean) => [
    { name: isRTL ? 'كانبان' : 'Kanban', icon: Kanban, preview: KanbanViewPreview, description: isRTL ? 'لوحات سير عمل بصرية' : 'Visual workflow boards' },
    { name: isRTL ? 'جدول' : 'Table', icon: Rows, preview: TableViewPreview, description: isRTL ? 'بيانات كجداول' : 'Spreadsheet-like data' },
    { name: isRTL ? 'التقويم' : 'Calendar', icon: Calendar, preview: CalendarViewPreview, description: isRTL ? 'تخطيط بالتواريخ' : 'Date-based planning' },
    { name: isRTL ? 'الجدول الزمني' : 'Timeline', icon: Timer, preview: TimelineViewPreview, description: isRTL ? 'خرائط المشاريع' : 'Project roadmaps' },
    { name: isRTL ? 'جانت' : 'Gantt', icon: ChartLine, preview: GanttViewPreview, description: isRTL ? 'جدولة المشاريع' : 'Project scheduling' },
];

// View Card
const ViewCard: React.FC<{ view: ReturnType<typeof getBoardViewsData>[0]; index: number; isActive: boolean; onClick: () => void }> = memo(({
    view,
    index,
    isActive,
    onClick
}) => {
    const Icon = view.icon;
    const Preview = view.preview;

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer flex-shrink-0 w-[200px] sm:w-auto transition-all duration-300 ${isActive ? 'scale-[1.03]' : 'hover:scale-[1.01]'}`}
            style={{
                opacity: 0,
                animation: 'fadeInUp 0.5s ease-out forwards',
                animationDelay: `${0.1 + index * 0.06}s`
            }}
        >
            <div className={`p-3 rounded-xl border transition-all duration-300 ${
                isActive
                    ? 'bg-zinc-900 dark:bg-white border-zinc-700 dark:border-zinc-300 shadow-lg'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}>
                {/* Preview */}
                <div className={`h-16 mb-3 rounded-lg overflow-hidden ${
                    isActive ? 'bg-zinc-800 dark:bg-zinc-100' : 'bg-white dark:bg-zinc-800'
                }`}>
                    <Preview />
                </div>

                {/* Label */}
                <div className="flex items-center gap-2">
                    <Icon size={14} weight="fill" className={isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-500'} />
                    <span className={`text-xs font-medium ${isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {view.name}
                    </span>
                </div>
            </div>
        </div>
    );
});

export const ToolsShowcase: React.FC = () => {
    const { isRTL } = useLandingContext();
    const sectionRef = useRef(null);
    const toolsScrollRef = useRef<HTMLDivElement>(null);
    const viewsScrollRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
    const [activeTool, setActiveTool] = useState(0);
    const [activeView, setActiveView] = useState(0);
    const [canScrollToolsLeft, setCanScrollToolsLeft] = useState(false);
    const [canScrollToolsRight, setCanScrollToolsRight] = useState(true);
    const [canScrollViewsLeft, setCanScrollViewsLeft] = useState(false);
    const [canScrollViewsRight, setCanScrollViewsRight] = useState(true);

    const tools = getToolsData(isRTL);
    const boardViews = getBoardViewsData(isRTL);

    const additionalViews = isRTL
        ? ['قائمة', 'نظرة عامة', 'نماذج', 'محوري', 'مستند', 'المشتريات', 'سلسلة التوريد', '+المزيد']
        : ['List', 'Overview', 'Forms', 'Pivot', 'Doc', 'Procurement', 'Supply Chain', 'ListBoard', '+more'];

    const checkToolsScroll = () => {
        if (toolsScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = toolsScrollRef.current;
            setCanScrollToolsLeft(scrollLeft > 0);
            setCanScrollToolsRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const checkViewsScroll = () => {
        if (viewsScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = viewsScrollRef.current;
            setCanScrollViewsLeft(scrollLeft > 0);
            setCanScrollViewsRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scrollTools = (direction: 'left' | 'right') => {
        if (toolsScrollRef.current) {
            toolsScrollRef.current.scrollBy({
                left: direction === 'left' ? -260 : 260,
                behavior: 'smooth'
            });
        }
    };

    const scrollViews = (direction: 'left' | 'right') => {
        if (viewsScrollRef.current) {
            viewsScrollRef.current.scrollBy({
                left: direction === 'left' ? -220 : 220,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const toolsEl = toolsScrollRef.current;
        const viewsEl = viewsScrollRef.current;

        if (toolsEl) {
            toolsEl.addEventListener('scroll', checkToolsScroll);
            checkToolsScroll();
        }
        if (viewsEl) {
            viewsEl.addEventListener('scroll', checkViewsScroll);
            checkViewsScroll();
        }

        return () => {
            if (toolsEl) toolsEl.removeEventListener('scroll', checkToolsScroll);
            if (viewsEl) viewsEl.removeEventListener('scroll', checkViewsScroll);
        };
    }, []);

    return (
        <section ref={sectionRef} className="bg-black">
            {/* Tools Section */}
            <div className="py-20 sm:py-28 md:py-32 relative overflow-hidden">
                {/* Animated Spotlight Gradients - matching "See everything at a glance" */}
                <div className="absolute top-20 left-1/3 w-[500px] h-[350px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none"
                     style={{ animation: 'spotlightPulse 8s ease-in-out infinite' }} />
                <div className="absolute bottom-20 right-1/4 w-[400px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
                     style={{ animation: 'spotlightPulse 10s ease-in-out infinite', animationDelay: '-4s' }} />

                <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
                    {/* Header */}
                    {isInView && (
                        <div className="text-center mb-12 sm:mb-16"
                             style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-sm font-semibold mb-6">
                                <Sparkle size={14} weight="fill" />
                                {isRTL ? 'أدوات قوية' : 'Power Tools'}
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
                                {isRTL ? (
                                    <>
                                        مصممة لكل
                                        <br />
                                        <span className="text-zinc-500">سير عمل</span>
                                    </>
                                ) : (
                                    <>
                                        Built for Every
                                        <br />
                                        <span className="text-zinc-500">Workflow</span>
                                    </>
                                )}
                            </h2>
                            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto">
                                {isRTL ? 'أدوات قوية تتكيف مع طريقة عملك' : 'Powerful tools that adapt to how you work'}
                            </p>
                        </div>
                    )}

                    {/* Mobile scroll navigation */}
                    <div className="sm:hidden flex items-center justify-between mb-4">
                        <span className="text-xs text-zinc-500">{isRTL ? 'مرر لاستكشاف الأدوات' : 'Swipe to explore tools'}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => scrollTools(isRTL ? 'right' : 'left')}
                                disabled={isRTL ? !canScrollToolsRight : !canScrollToolsLeft}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                    (isRTL ? canScrollToolsRight : canScrollToolsLeft)
                                        ? 'border-zinc-600 text-white'
                                        : 'border-zinc-800 text-zinc-700'
                                }`}
                            >
                                <CaretLeft size={16} />
                            </button>
                            <button
                                onClick={() => scrollTools(isRTL ? 'left' : 'right')}
                                disabled={isRTL ? !canScrollToolsLeft : !canScrollToolsRight}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                    (isRTL ? canScrollToolsLeft : canScrollToolsRight)
                                        ? 'border-zinc-600 text-white'
                                        : 'border-zinc-800 text-zinc-700'
                                }`}
                            >
                                <CaretRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Tools Grid */}
                    {isInView && (
                        <div
                            ref={toolsScrollRef}
                            className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-4
                                overflow-x-auto sm:overflow-visible
                                pb-4 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0
                                snap-x snap-mandatory sm:snap-none"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {tools.map((tool, idx) => (
                                <ToolCard
                                    key={tool.name}
                                    tool={tool}
                                    index={idx}
                                    isActive={activeTool === idx}
                                    onClick={() => setActiveTool(idx)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Additional tools count */}
                    {isInView && (
                        <div className="mt-8 text-center"
                             style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.5s' }}>
                            <span className="text-sm text-zinc-500">
                                {isRTL
                                    ? '+ 5 أدوات متقدمة أخرى بما فيها جداول البيانات والأهداف والمزيد'
                                    : '+ 5 more advanced tools including Spreadsheets, Goals & OKRs, and more'
                                }
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Board Views Section */}
            <div className="py-20 sm:py-28 md:py-32 bg-white dark:bg-zinc-900 relative overflow-hidden">
                <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
                    {/* Header */}
                    {isInView && (
                        <div className="text-center mb-12 sm:mb-16"
                             style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.2s' }}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium mb-6">
                                <Eye size={14} weight="fill" />
                                {isRTL ? '14 طريقة عرض' : '14 Board Views'}
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-white mb-5 tracking-tight leading-[1.1]">
                                {isRTL ? (
                                    <>
                                        لوحة واحدة
                                        <br />
                                        <span className="text-zinc-400 dark:text-zinc-600">كل المنظورات</span>
                                    </>
                                ) : (
                                    <>
                                        One Board
                                        <br />
                                        <span className="text-zinc-400 dark:text-zinc-600">Every Perspective</span>
                                    </>
                                )}
                            </h2>
                            <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                                {isRTL
                                    ? 'التبديل بين العروض فوراً. نفس البيانات، رؤى مختلفة.'
                                    : 'Switch between views instantly. Same data, different insights.'
                                }
                            </p>
                        </div>
                    )}

                    {/* Mobile scroll navigation */}
                    <div className="sm:hidden flex items-center justify-between mb-4">
                        <span className="text-xs text-zinc-500">{isRTL ? 'مرر لرؤية العروض' : 'Swipe to see views'}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => scrollViews(isRTL ? 'right' : 'left')}
                                disabled={isRTL ? !canScrollViewsRight : !canScrollViewsLeft}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                    (isRTL ? canScrollViewsRight : canScrollViewsLeft)
                                        ? 'border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white'
                                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700'
                                }`}
                            >
                                <CaretLeft size={16} />
                            </button>
                            <button
                                onClick={() => scrollViews(isRTL ? 'left' : 'right')}
                                disabled={isRTL ? !canScrollViewsLeft : !canScrollViewsRight}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                    (isRTL ? canScrollViewsLeft : canScrollViewsRight)
                                        ? 'border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white'
                                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700'
                                }`}
                            >
                                <CaretRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Views Grid */}
                    {isInView && (
                        <div
                            ref={viewsScrollRef}
                            className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4
                                overflow-x-auto sm:overflow-visible
                                pb-4 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0
                                snap-x snap-mandatory sm:snap-none"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {boardViews.map((view, idx) => (
                                <ViewCard
                                    key={view.name}
                                    view={view}
                                    index={idx}
                                    isActive={activeView === idx}
                                    onClick={() => setActiveView(idx)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Additional views */}
                    {isInView && (
                        <div className="mt-8 flex flex-wrap justify-center gap-2"
                             style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.5s' }}>
                            {additionalViews.map((name, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    {isInView && (
                        <div className="mt-12 flex justify-center items-center gap-8 sm:gap-12 pt-8 border-t border-zinc-200 dark:border-zinc-800"
                             style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.6s' }}>
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">14</div>
                                <div className="text-xs text-zinc-500 mt-1">{isRTL ? 'طرق عرض' : 'Views'}</div>
                            </div>
                            <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800"/>
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">10</div>
                                <div className="text-xs text-zinc-500 mt-1">{isRTL ? 'أدوات' : 'Tools'}</div>
                            </div>
                            <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800"/>
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">1</div>
                                <div className="text-xs text-zinc-500 mt-1">{isRTL ? 'منصة' : 'Platform'}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Keyframes */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spotlightPulse {
                    0%, 100% { opacity: 0.6; transform: scale(1) translateZ(0); }
                    50% { opacity: 1; transform: scale(1.1) translateZ(0); }
                }
            `}</style>
        </section>
    );
};
