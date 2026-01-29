import React, { useRef, memo, useState } from 'react';
import { useInView } from 'framer-motion';
import {
    UsersThree,
    CurrencyCircleDollar,
    Package,
    Truck,
    ChartPie,
    Briefcase,
    ArrowRight,
    Lightning
} from 'phosphor-react';

interface DepartmentCard {
    id: string;
    name: string;
    icon: React.ElementType;
    dashboardCount: number;
    description: string;
}

const DEPARTMENTS: DepartmentCard[] = [
    {
        id: 'customers',
        name: 'Customers',
        icon: UsersThree,
        dashboardCount: 7,
        description: 'Analytics, segmentation & retention',
    },
    {
        id: 'finance',
        name: 'Finance',
        icon: CurrencyCircleDollar,
        dashboardCount: 7,
        description: 'Expenses, budgets & forecasting',
    },
    {
        id: 'operations',
        name: 'Operations',
        icon: Package,
        dashboardCount: 24,
        description: 'Sales, inventory & purchasing',
    },
    {
        id: 'suppliers',
        name: 'Suppliers',
        icon: Truck,
        dashboardCount: 7,
        description: 'Vendor performance & compliance',
    },
    {
        id: 'people',
        name: 'People',
        icon: Briefcase,
        dashboardCount: 4,
        description: 'Team management & HR analytics',
    },
    {
        id: 'overview',
        name: 'Overview',
        icon: ChartPie,
        dashboardCount: 2,
        description: 'Executive dashboards & reports',
    },
];

// Simple department card - clean and minimal
const DepartmentCardComponent: React.FC<{
    dept: DepartmentCard;
    index: number;
}> = memo(({ dept, index }) => {
    const Icon = dept.icon;

    return (
        <div
            className="group relative p-5 sm:p-6 rounded-2xl
                bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
                hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg dark:hover:shadow-none
                transition-all duration-300 ease-out"
            style={{
                opacity: 0,
                animation: 'fadeInUp 0.5s ease-out forwards',
                animationDelay: `${0.1 + index * 0.05}s`
            }}
        >
            {/* Icon and count row */}
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800
                    flex items-center justify-center
                    group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors duration-300">
                    <Icon size={20} weight="duotone" className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
                </div>
                <div className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-500 text-xs font-medium
                    group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 group-hover:text-zinc-700 dark:group-hover:text-zinc-400 transition-colors duration-300">
                    {dept.dashboardCount} dashboards
                </div>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white mb-1.5">
                {dept.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-zinc-500 leading-relaxed">
                {dept.description}
            </p>
        </div>
    );
});

// Central hub - simplified
const CentralHub = memo(() => (
    <div className="flex items-center justify-center py-8 sm:py-12"
         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
        <div className="relative">
            {/* Outer ring */}
            <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-zinc-300 dark:border-zinc-700 -m-2" />

            {/* Core */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
                flex flex-col items-center justify-center">
                <Lightning size={24} weight="duotone" className="text-zinc-600 dark:text-zinc-400 mb-1" />
                <span className="text-[10px] sm:text-xs font-medium text-zinc-500">UNIFIED</span>
            </div>
        </div>
    </div>
));

// Stat item - simple
const StatItem: React.FC<{ value: string; label: string; index: number }> = ({ value, label, index }) => (
    <div
        className="text-center"
        style={{
            opacity: 0,
            animation: 'fadeInUp 0.5s ease-out forwards',
            animationDelay: `${0.2 + index * 0.05}s`
        }}
    >
        <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {value}
        </div>
        <div className="text-xs sm:text-sm text-zinc-500 mt-1">{label}</div>
    </div>
);

interface MiniCompanyShowcaseProps {
    onExplore?: () => void;
}

export const MiniCompanyShowcase: React.FC<MiniCompanyShowcaseProps> = ({ onExplore }) => {
    const totalDashboards = DEPARTMENTS.reduce((sum, d) => sum + d.dashboardCount, 0);
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    return (
        <section ref={sectionRef} className="py-20 sm:py-28 md:py-32 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
            {/* Subtle background */}
            <div className="absolute inset-0 opacity-[0.5] dark:opacity-[0.02]">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }} />
            </div>

            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                {/* Header */}
                {isInView && (
                    <div className="text-center mb-10 sm:mb-14"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
                            text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-6">
                            <Lightning size={14} weight="duotone" />
                            Integrated Ecosystem
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 text-zinc-900 dark:text-white leading-[1.1]">
                            One Platform. Every Team.
                        </h2>

                        <p className="text-base sm:text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            Real-time data flows across your entire organization. Every department connected, every insight unified.
                        </p>
                    </div>
                )}

                {/* Central Hub */}
                {isInView && <CentralHub />}

                {/* Stats Row */}
                {isInView && (
                    <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16 mb-12 sm:mb-16">
                        <StatItem value="6" label="Departments" index={0} />
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                        <StatItem value={`${totalDashboards}+`} label="Dashboards" index={1} />
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                        <StatItem value="<1s" label="Sync Time" index={2} />
                    </div>
                )}

                {/* Department Cards Grid */}
                {isInView && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10 sm:mb-14">
                        {DEPARTMENTS.map((dept, idx) => (
                            <DepartmentCardComponent
                                key={dept.id}
                                dept={dept}
                                index={idx}
                            />
                        ))}
                    </div>
                )}

                {/* CTA */}
                {isInView && (
                    <div className="text-center"
                         style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.4s' }}>
                        <button
                            onClick={onExplore}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                                bg-zinc-900 dark:bg-white text-white dark:text-zinc-900
                                font-semibold text-sm
                                hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors duration-200"
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
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </section>
    );
};
