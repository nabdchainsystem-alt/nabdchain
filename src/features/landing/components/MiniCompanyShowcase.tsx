import React from 'react';
import { motion } from 'framer-motion';
import {
    UsersThree,
    CurrencyCircleDollar,
    Package,
    Truck,
    ChartPie,
    Briefcase,
    ArrowRight,
    Sparkle
} from 'phosphor-react';

interface DepartmentCard {
    id: string;
    name: string;
    icon: React.ElementType;
    dashboardCount: number;
    description: string;
    gradient: string;
    features: string[];
}

const DEPARTMENTS: DepartmentCard[] = [
    {
        id: 'customers',
        name: 'Customers',
        icon: UsersThree,
        dashboardCount: 7,
        description: 'Customer analytics, segmentation & retention tracking',
        gradient: 'from-blue-500 to-cyan-400',
        features: ['Behavior Patterns', 'Churn Prediction', 'Lifetime Value']
    },
    {
        id: 'finance',
        name: 'Finance',
        icon: CurrencyCircleDollar,
        dashboardCount: 7,
        description: 'Expense tracking, budgets & financial forecasting',
        gradient: 'from-emerald-500 to-teal-400',
        features: ['Expense Analytics', 'Approval Flows', 'Budget Control']
    },
    {
        id: 'operations',
        name: 'Operations',
        icon: Package,
        dashboardCount: 24,
        description: 'Sales, inventory & purchase management',
        gradient: 'from-orange-500 to-amber-400',
        features: ['Sales Funnel', 'Inventory Aging', 'Warehouse Tracking']
    },
    {
        id: 'suppliers',
        name: 'Suppliers',
        icon: Truck,
        dashboardCount: 7,
        description: 'Vendor performance, delivery & compliance',
        gradient: 'from-purple-500 to-violet-400',
        features: ['Performance Score', 'Cost Analysis', 'Risk Assessment']
    },
    {
        id: 'people',
        name: 'People',
        icon: Briefcase,
        dashboardCount: 4,
        description: 'Team management & HR analytics',
        gradient: 'from-pink-500 to-rose-400',
        features: ['Team Overview', 'Performance', 'Orders Tracking']
    },
    {
        id: 'overview',
        name: 'Overview',
        icon: ChartPie,
        dashboardCount: 2,
        description: 'Executive dashboards & consolidated reports',
        gradient: 'from-indigo-500 to-blue-400',
        features: ['KPI Dashboard', 'Cross-Dept Reports', 'Trend Analysis']
    },
];

const DepartmentCardComponent: React.FC<{ dept: DepartmentCard; index: number }> = ({ dept, index }) => {
    const Icon = dept.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-1"
        >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${dept.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${dept.gradient} mb-4`}>
                <Icon size={24} weight="duotone" className="text-white" />
            </div>

            {/* Content */}
            <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {dept.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {dept.dashboardCount} dashboards
                    </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    {dept.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                    {dept.features.map((feature, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400"
                        >
                            {feature}
                        </span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

interface MiniCompanyShowcaseProps {
    onExplore?: () => void;
}

export const MiniCompanyShowcase: React.FC<MiniCompanyShowcaseProps> = ({ onExplore }) => {
    const totalDashboards = DEPARTMENTS.reduce((sum, d) => sum + d.dashboardCount, 0);

    return (
        <section className="py-24 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-950 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium mb-6">
                        <Sparkle size={16} weight="fill" />
                        Mini Company Suite
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
                        Integrated Business Suite
                    </h2>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-6">
                        Six integrated departments with over {totalDashboards} ready-to-use dashboards
                        for complete business visibility
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 md:gap-16">
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">6</div>
                            <div className="text-sm text-zinc-500">Departments</div>
                        </div>
                        <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">{totalDashboards}+</div>
                            <div className="text-sm text-zinc-500">Dashboards</div>
                        </div>
                        <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">24</div>
                            <div className="text-sm text-zinc-500">Column Types</div>
                        </div>
                    </div>
                </motion.div>

                {/* Department Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {DEPARTMENTS.map((dept, idx) => (
                        <DepartmentCardComponent key={dept.id} dept={dept} index={idx} />
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <button
                        onClick={onExplore}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all group"
                    >
                        Explore All Features
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
};
