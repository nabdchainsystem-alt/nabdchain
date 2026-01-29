import React, { useRef, memo } from 'react';
import { useInView } from 'framer-motion';
import {
    UsersThree,
    CurrencyCircleDollar,
    Package,
    Truck,
    ChartPie,
    Briefcase,
    ArrowRight,
    ArrowsLeftRight
} from 'phosphor-react';

interface Department {
    id: string;
    name: string;
    icon: React.ElementType;
    dashboards: string[];
    color: string;
}

const DEPARTMENTS: Department[] = [
    {
        id: 'customers',
        name: 'Customers',
        icon: UsersThree,
        dashboards: ['Segmentation', 'Retention', 'Analytics'],
        color: 'bg-blue-500',
    },
    {
        id: 'finance',
        name: 'Finance',
        icon: CurrencyCircleDollar,
        dashboards: ['Budgets', 'Expenses', 'Forecasting'],
        color: 'bg-emerald-500',
    },
    {
        id: 'operations',
        name: 'Operations',
        icon: Package,
        dashboards: ['Inventory', 'Sales', 'Purchasing'],
        color: 'bg-amber-500',
    },
    {
        id: 'suppliers',
        name: 'Suppliers',
        icon: Truck,
        dashboards: ['Performance', 'Compliance', 'Contracts'],
        color: 'bg-purple-500',
    },
    {
        id: 'people',
        name: 'People',
        icon: Briefcase,
        dashboards: ['HR', 'Payroll', 'Attendance'],
        color: 'bg-pink-500',
    },
    {
        id: 'overview',
        name: 'Overview',
        icon: ChartPie,
        dashboards: ['Executive', 'KPIs', 'Reports'],
        color: 'bg-indigo-500',
    },
];

// Department card with mini dashboard preview
const DepartmentCard: React.FC<{ dept: Department; index: number }> = memo(({ dept, index }) => {
    const Icon = dept.icon;

    return (
        <div
            className="group relative"
            style={{
                opacity: 0,
                animation: 'fadeInUp 0.5s ease-out forwards',
                animationDelay: `${0.1 + index * 0.08}s`
            }}
        >
            <div className="relative p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800
                bg-white dark:bg-zinc-900
                hover:border-zinc-300 dark:hover:border-zinc-700
                hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none
                hover:-translate-y-1
                transition-all duration-300">

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${dept.color} flex items-center justify-center`}>
                        <Icon size={20} weight="fill" className="text-white" />
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{dept.dashboards.length}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Dashboards</div>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                    {dept.name}
                </h3>

                {/* Dashboard list */}
                <div className="space-y-1.5">
                    {dept.dashboards.map((dashboard, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${dept.color} opacity-60`} />
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">{dashboard}</span>
                        </div>
                    ))}
                </div>

                {/* Hover arrow */}
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={16} className="text-zinc-400" />
                </div>
            </div>
        </div>
    );
});

// Connection line between departments
const ConnectionLine = memo(() => (
    <div className="hidden lg:flex items-center justify-center py-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <ArrowsLeftRight size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-500 font-medium">Real-time sync</span>
        </div>
    </div>
));

interface MiniCompanyShowcaseProps {
    onExplore?: () => void;
}

export const MiniCompanyShowcase: React.FC<MiniCompanyShowcaseProps> = ({ onExplore }) => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    return (
        <section ref={sectionRef} className="py-24 sm:py-32 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
                {/* Header - Left aligned for variety */}
                {isInView && (
                    <div className="max-w-2xl mb-16"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6 leading-[1.1]">
                            Run your entire company
                            <br />
                            <span className="text-zinc-400 dark:text-zinc-500">from one place</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            6 departments. 51+ dashboards. All connected in real-time.
                            Every team gets the tools they need while leadership gets complete visibility.
                        </p>
                    </div>
                )}

                {/* Department Grid */}
                {isInView && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
                        {DEPARTMENTS.map((dept, idx) => (
                            <DepartmentCard key={dept.id} dept={dept} index={idx} />
                        ))}
                    </div>
                )}

                {/* Bottom stats bar */}
                {isInView && (
                    <div
                        className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                        style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.5s' }}
                    >
                        <div className="flex items-center gap-8 sm:gap-12">
                            <div>
                                <div className="text-3xl font-bold text-zinc-900 dark:text-white">51+</div>
                                <div className="text-sm text-zinc-500">Ready dashboards</div>
                            </div>
                            <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
                            <div>
                                <div className="text-3xl font-bold text-zinc-900 dark:text-white">&lt;1s</div>
                                <div className="text-sm text-zinc-500">Cross-department sync</div>
                            </div>
                            <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                            <div className="hidden sm:block">
                                <div className="text-3xl font-bold text-zinc-900 dark:text-white">∞</div>
                                <div className="text-sm text-zinc-500">Custom reports</div>
                            </div>
                        </div>

                        <button
                            onClick={onExplore}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                                bg-zinc-900 dark:bg-white text-white dark:text-zinc-900
                                font-medium text-sm
                                hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                        >
                            Explore Mini Company
                            <ArrowRight size={16} weight="bold" />
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
