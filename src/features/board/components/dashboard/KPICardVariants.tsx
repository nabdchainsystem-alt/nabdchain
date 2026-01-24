import React from 'react';
import { ArrowUp, ArrowDown, Minus, Target } from 'phosphor-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

// ============================================
// SHARED SKELETON COMPONENTS
// ============================================
const ShimmerBox: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`shimmer bg-zinc-200 dark:bg-monday-dark-hover rounded ${className}`} />
);

// ============================================
// 1. SPARKLINE KPI CARD
// ============================================
export interface SparklineKPIConfig {
    id: string;
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    sparklineData: number[];
    icon?: React.ReactNode;
    color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
    loading?: boolean;
}

const colorMap = {
    indigo: { line: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600' },
    emerald: { line: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
    amber: { line: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
    rose: { line: '#f43f5e', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600' },
    violet: { line: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600' },
    blue: { line: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
    teal: { line: '#14b8a6', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600' },
};

const SparklineKPICardSkeleton: React.FC = () => (
    <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm">
        <div className="flex justify-between items-start mb-1">
            <ShimmerBox className="h-3 w-20" />
            <ShimmerBox className="w-8 h-8 rounded-lg" />
        </div>
        <div className="flex items-end justify-between gap-4 mt-2">
            <div>
                <ShimmerBox className="h-7 w-20 mb-2" />
                <ShimmerBox className="h-5 w-16 rounded-full" />
            </div>
            <ShimmerBox className="w-24 h-12" />
        </div>
    </div>
);

export const SparklineKPICard: React.FC<SparklineKPIConfig> = ({
    label, value, change, trend, sparklineData, icon, color = 'indigo', loading
}) => {
    if (loading) return <SparklineKPICardSkeleton />;

    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-zinc-500 dark:text-monday-dark-text-secondary bg-zinc-100 dark:bg-monday-dark-elevated';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);
    const chartData = sparklineData.map((v, i) => ({ value: v, index: i }));

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-monday-dark-text-secondary uppercase tracking-wider">{label}</span>
                {icon && <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</div>}
            </div>

            <div className="flex items-end justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-zinc-800 dark:text-monday-dark-text">{value}</h3>
                    <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${getTrendColor()}`}>
                        <TrendIcon size={10} weight="bold" />
                        <span>{change}</span>
                    </div>
                </div>

                <div className="w-24 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={colors.line}
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// ============================================
// 2. PROGRESS/TARGET KPI CARD
// ============================================
export interface ProgressKPIConfig {
    id: string;
    label: string;
    currentValue: number;
    targetValue: number;
    unit?: string;
    prefix?: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
    loading?: boolean;
}

const ProgressKPICardSkeleton: React.FC = () => (
    <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm">
        <div className="flex justify-between items-start mb-3">
            <ShimmerBox className="h-3 w-24" />
            <ShimmerBox className="h-6 w-12 rounded-full" />
        </div>
        <div className="flex items-baseline gap-2 mb-3">
            <ShimmerBox className="h-7 w-20" />
            <ShimmerBox className="h-4 w-16" />
        </div>
        <ShimmerBox className="h-2 w-full rounded-full mb-2" />
        <ShimmerBox className="h-3 w-28" />
    </div>
);

export const ProgressKPICard: React.FC<ProgressKPIConfig> = ({
    label, currentValue, targetValue, unit = '', prefix = '', change, trend, color = 'indigo', loading
}) => {
    if (loading) return <ProgressKPICardSkeleton />;
    const percentage = Math.min(Math.round((currentValue / targetValue) * 100), 100);
    const colors = colorMap[color];

    const getProgressColor = () => {
        if (percentage >= 80) return 'bg-emerald-500';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getTrendColor = () => {
        if (!trend || trend === 'neutral') return 'text-zinc-500 dark:text-monday-dark-text-secondary';
        if (trend === 'up') return 'text-emerald-600';
        return 'text-rose-600';
    };

    const TrendIcon = !trend || trend === 'neutral' ? Minus : (trend === 'up' ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-zinc-500 dark:text-monday-dark-text-secondary uppercase tracking-wider">{label}</span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                    <Target size={12} weight="bold" />
                    {percentage}%
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-monday-dark-text">
                    {prefix}{currentValue.toLocaleString()}{unit}
                </h3>
                <span className="text-sm text-zinc-400 dark:text-monday-dark-text-muted">
                    / {prefix}{targetValue.toLocaleString()}{unit}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-zinc-100 dark:bg-monday-dark-elevated rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full ${getProgressColor()} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {change && (
                <div className={`flex items-center gap-1 text-[11px] font-medium ${getTrendColor()}`}>
                    <TrendIcon size={10} weight="bold" />
                    <span>{change} vs last period</span>
                </div>
            )}
        </div>
    );
};

// ============================================
// 3. COMPARISON KPI CARD
// ============================================
export interface ComparisonKPIConfig {
    id: string;
    label: string;
    currentValue: string;
    currentLabel: string;
    previousValue: string;
    previousLabel: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
    color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
    loading?: boolean;
}

const ComparisonKPICardSkeleton: React.FC = () => (
    <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm">
        <div className="flex justify-between items-start mb-3">
            <ShimmerBox className="h-3 w-24" />
            <ShimmerBox className="w-8 h-8 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2 bg-zinc-50 dark:bg-monday-dark-elevated rounded-lg">
                <ShimmerBox className="h-2 w-12 mb-1" />
                <ShimmerBox className="h-5 w-16" />
            </div>
            <div className="p-2 bg-zinc-50 dark:bg-monday-dark-elevated rounded-lg">
                <ShimmerBox className="h-2 w-12 mb-1" />
                <ShimmerBox className="h-5 w-16" />
            </div>
        </div>
        <ShimmerBox className="h-5 w-20 rounded-full" />
    </div>
);

export const ComparisonKPICard: React.FC<ComparisonKPIConfig> = ({
    label, currentValue, currentLabel, previousValue, previousLabel, change, trend, icon, color = 'indigo', loading
}) => {
    if (loading) return <ComparisonKPICardSkeleton />;
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-zinc-500 dark:text-monday-dark-text-secondary bg-zinc-100 dark:bg-monday-dark-elevated';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-zinc-500 dark:text-monday-dark-text-secondary uppercase tracking-wider">{label}</span>
                {icon && <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</div>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 bg-zinc-50 dark:bg-monday-dark-elevated rounded-lg">
                    <span className="text-[10px] text-zinc-400 dark:text-monday-dark-text-muted uppercase">{currentLabel}</span>
                    <p className="text-lg font-bold text-zinc-800 dark:text-monday-dark-text">{currentValue}</p>
                </div>
                <div className="p-2 bg-zinc-50 dark:bg-monday-dark-elevated rounded-lg">
                    <span className="text-[10px] text-zinc-400 dark:text-monday-dark-text-muted uppercase">{previousLabel}</span>
                    <p className="text-lg font-bold text-zinc-500 dark:text-monday-dark-text-secondary">{previousValue}</p>
                </div>
            </div>

            <div className={`self-start flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getTrendColor()}`}>
                <TrendIcon size={10} weight="bold" />
                <span>{change}</span>
            </div>
        </div>
    );
};

// ============================================
// 4. GRADIENT/GLASS KPI CARD
// ============================================
export interface GradientKPIConfig {
    id: string;
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
    gradient: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'ocean' | 'sunset';
    loading?: boolean;
}

const gradientMap = {
    indigo: 'from-indigo-500 to-purple-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-pink-600',
    violet: 'from-violet-500 to-purple-600',
    ocean: 'from-blue-500 to-cyan-500',
    sunset: 'from-orange-500 to-rose-500',
};

const GradientKPICardSkeleton: React.FC = () => (
    <div className="relative overflow-hidden flex flex-col p-4 rounded-xl shadow-lg bg-gradient-to-br from-stone-300 to-stone-400 dark:from-stone-700 dark:to-stone-800">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
                <div className="h-3 w-20 rounded shimmer bg-white/30" />
                <div className="w-8 h-8 rounded-lg shimmer bg-white/20" />
            </div>
            <div className="h-8 w-24 rounded shimmer bg-white/30 mb-2" />
            <div className="h-5 w-16 rounded-full shimmer bg-white/20" />
        </div>
    </div>
);

export const GradientKPICard: React.FC<GradientKPIConfig> = ({
    label, value, change, trend, icon, gradient = 'indigo', loading
}) => {
    if (loading) return <GradientKPICardSkeleton />;

    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    return (
        <div className={`relative overflow-hidden flex flex-col p-4 rounded-xl shadow-lg bg-gradient-to-br ${gradientMap[gradient]}`}>
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">{label}</span>
                    {icon && <div className="p-1.5 rounded-lg bg-white/20 text-white">{icon}</div>}
                </div>

                <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>

                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isNeutral ? 'bg-white/20 text-white/80' :
                    isPositive ? 'bg-white/30 text-white' : 'bg-white/30 text-white'
                }`}>
                    <TrendIcon size={10} weight="bold" />
                    <span>{change}</span>
                </div>
            </div>
        </div>
    );
};

// ============================================
// 5. COMPACT KPI CARD
// ============================================
export interface CompactKPIConfig {
    id: string;
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
    loading?: boolean;
}

const CompactKPICardSkeleton: React.FC = () => (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
            <ShimmerBox className="w-1 h-10 rounded-full" />
            <div>
                <ShimmerBox className="h-2 w-12 mb-1" />
                <ShimmerBox className="h-5 w-16" />
            </div>
        </div>
        <ShimmerBox className="h-4 w-12" />
    </div>
);

export const CompactKPICard: React.FC<CompactKPIConfig> = ({
    label, value, change, trend, color = 'indigo', loading
}) => {
    if (loading) return <CompactKPICardSkeleton />;

    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];
    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    const getTrendColor = () => {
        if (isNeutral) return 'text-zinc-500 dark:text-monday-dark-text-secondary';
        if (isPositive) return 'text-emerald-600';
        return 'text-rose-600';
    };

    return (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-lg shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
                <div className={`w-1 h-10 rounded-full ${colors.bg.replace('bg-', 'bg-').replace('-50', '-500').replace('-900/20', '-500')}`}
                     style={{ backgroundColor: colors.line }} />
                <div>
                    <span className="text-[10px] text-zinc-400 dark:text-monday-dark-text-muted uppercase tracking-wider">{label}</span>
                    <p className="text-lg font-bold text-zinc-800 dark:text-monday-dark-text">{value}</p>
                </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
                <TrendIcon size={12} weight="bold" />
                <span>{change}</span>
            </div>
        </div>
    );
};

// ============================================
// 6. RING/RADIAL KPI CARD
// ============================================
export interface RadialKPIConfig {
    id: string;
    label: string;
    value: string;
    percentage: number;
    subtitle?: string;
    color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
    loading?: boolean;
}

const RadialKPICardSkeleton: React.FC = () => (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm">
        <ShimmerBox className="h-3 w-20 mb-3" />
        <div className="relative w-24 h-24">
            <div className="w-full h-full rounded-full shimmer bg-zinc-200 dark:bg-monday-dark-hover" />
        </div>
        <div className="text-center mt-3">
            <ShimmerBox className="h-5 w-16 mb-1 mx-auto" />
            <ShimmerBox className="h-3 w-12 mx-auto" />
        </div>
    </div>
);

export const RadialKPICard: React.FC<RadialKPIConfig> = ({
    label, value, percentage, subtitle, color = 'indigo', loading
}) => {
    if (loading) return <RadialKPICardSkeleton />;

    const colors = colorMap[color];
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm hover:shadow-md transition-all">
            <span className="text-xs font-semibold text-zinc-500 dark:text-monday-dark-text-secondary uppercase tracking-wider mb-3">{label}</span>

            <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-stone-100 dark:text-stone-800"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke={colors.line}
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-zinc-800 dark:text-monday-dark-text">{percentage}%</span>
                </div>
            </div>

            <div className="text-center mt-3">
                <p className="text-lg font-bold text-zinc-800 dark:text-monday-dark-text">{value}</p>
                {subtitle && <span className="text-xs text-zinc-400 dark:text-monday-dark-text-muted">{subtitle}</span>}
            </div>
        </div>
    );
};

// ============================================
// 7. MINI BAR CHART KPI CARD
// ============================================
export interface MiniBarKPIConfig {
    id: string;
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    chartData: { name: string; value: number }[];
    icon?: React.ReactNode;
    color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
    loading?: boolean;
}

const MiniBarKPICardSkeleton: React.FC = () => (
    <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm">
        <div className="flex justify-between items-start mb-2">
            <ShimmerBox className="h-3 w-20" />
            <ShimmerBox className="w-8 h-8 rounded-lg" />
        </div>
        <div className="flex items-baseline gap-2 mb-1">
            <ShimmerBox className="h-7 w-20" />
            <ShimmerBox className="h-5 w-12 rounded-full" />
        </div>
        <div className="h-16 mt-2 flex items-end justify-between gap-1">
            {[...Array(6)].map((_, i) => (
                <ShimmerBox key={i} className="w-4 rounded-t" style={{ height: `${Math.random() * 50 + 20}%` }} />
            ))}
        </div>
    </div>
);

export const MiniBarKPICard: React.FC<MiniBarKPIConfig> = ({
    label, value, change, trend, chartData, icon, color = 'indigo', loading
}) => {
    if (loading) return <MiniBarKPICardSkeleton />;

    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-zinc-500 dark:text-monday-dark-text-secondary bg-zinc-100 dark:bg-monday-dark-elevated';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-monday-dark-text-secondary uppercase tracking-wider">{label}</span>
                {icon && <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</div>}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-monday-dark-text">{value}</h3>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTrendColor()}`}>
                    <TrendIcon size={10} weight="bold" />
                    <span>{change}</span>
                </div>
            </div>

            <div className="h-16 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={12}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} />
                        <Tooltip
                            contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, fontSize: 11 }}
                            labelStyle={{ color: '#fafafa' }}
                            itemStyle={{ color: '#fafafa' }}
                        />
                        <Bar dataKey="value" fill={colors.line} radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ============================================
// 8. MINI AREA CHART KPI CARD
// ============================================
export interface MiniAreaKPIConfig {
    id: string;
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    chartData: { name: string; value: number }[];
    icon?: React.ReactNode;
    color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
    loading?: boolean;
}

const MiniAreaKPICardSkeleton: React.FC = () => (
    <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm">
        <div className="flex justify-between items-start mb-2">
            <ShimmerBox className="h-3 w-20" />
            <ShimmerBox className="w-8 h-8 rounded-lg" />
        </div>
        <div className="flex items-baseline gap-2 mb-1">
            <ShimmerBox className="h-7 w-20" />
            <ShimmerBox className="h-5 w-12 rounded-full" />
        </div>
        <div className="h-16 mt-2">
            <ShimmerBox className="w-full h-full rounded" />
        </div>
    </div>
);

export const MiniAreaKPICard: React.FC<MiniAreaKPIConfig> = ({
    label, value, change, trend, chartData, icon, color = 'indigo', loading
}) => {
    if (loading) return <MiniAreaKPICardSkeleton />;
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-zinc-500 dark:text-monday-dark-text-secondary bg-zinc-100 dark:bg-monday-dark-elevated';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    // Get gradient color with opacity
    const areaColor = colors.line;
    const areaGradientId = `gradient-${color}`;

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-monday-dark-text-secondary uppercase tracking-wider">{label}</span>
                {icon && <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</div>}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-monday-dark-text">{value}</h3>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTrendColor()}`}>
                    <TrendIcon size={10} weight="bold" />
                    <span>{change}</span>
                </div>
            </div>

            <div className="h-16 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={areaColor} stopOpacity={0.4} />
                                <stop offset="100%" stopColor={areaColor} stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, fontSize: 11 }}
                            labelStyle={{ color: '#fafafa' }}
                            itemStyle={{ color: '#fafafa' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={areaColor}
                            strokeWidth={2}
                            fill={`url(#${areaGradientId})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ============================================
// 9. MULTI-METRIC BAR KPI CARD
// ============================================
export interface MultiMetricKPIConfig {
    id: string;
    label: string;
    metrics: {
        name: string;
        value: number;
        maxValue: number;
        color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
    }[];
    icon?: React.ReactNode;
    loading?: boolean;
}

const MultiMetricKPICardSkeleton: React.FC = () => (
    <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <ShimmerBox className="h-3 w-24" />
            <ShimmerBox className="w-8 h-8 rounded-lg" />
        </div>
        <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
                <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                        <ShimmerBox className="h-3 w-16" />
                        <ShimmerBox className="h-3 w-12" />
                    </div>
                    <ShimmerBox className="h-2 w-full rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

export const MultiMetricKPICard: React.FC<MultiMetricKPIConfig> = ({
    label, metrics, icon, loading
}) => {
    if (loading) return <MultiMetricKPICardSkeleton />;

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-zinc-500 dark:text-monday-dark-text-secondary uppercase tracking-wider">{label}</span>
                {icon && <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-monday-dark-elevated text-zinc-600 dark:text-monday-dark-text-secondary dark:text-zinc-400 dark:text-monday-dark-text-muted">{icon}</div>}
            </div>

            <div className="space-y-3">
                {metrics.map((metric, index) => {
                    const percentage = Math.min((metric.value / metric.maxValue) * 100, 100);
                    const metricColors = colorMap[metric.color];

                    return (
                        <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-zinc-600 dark:text-monday-dark-text-secondary dark:text-zinc-400 dark:text-monday-dark-text-muted">{metric.name}</span>
                                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                                    {metric.value.toLocaleString()}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-zinc-100 dark:bg-monday-dark-elevated rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%`, backgroundColor: metricColors.line }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================
// 10. FULL CHART KPI CARD (Large)
// ============================================
export interface FullChartKPIConfig {
    id: string;
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    chartData: { name: string; current: number; previous: number }[];
    icon?: React.ReactNode;
    color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
    loading?: boolean;
}

const FullChartKPICardSkeleton: React.FC = () => (
    <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm">
        <div className="flex justify-between items-start mb-3">
            <div>
                <ShimmerBox className="h-3 w-24 mb-2" />
                <div className="flex items-baseline gap-2">
                    <ShimmerBox className="h-7 w-20" />
                    <ShimmerBox className="h-5 w-12 rounded-full" />
                </div>
            </div>
            <ShimmerBox className="w-10 h-10 rounded-lg" />
        </div>
        <ShimmerBox className="h-32 w-full mt-2 rounded" />
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-100 dark:border-monday-dark-border">
            <ShimmerBox className="h-3 w-16" />
            <ShimmerBox className="h-3 w-16" />
        </div>
    </div>
);

export const FullChartKPICard: React.FC<FullChartKPIConfig> = ({
    label, value, change, trend, chartData, icon, color = 'indigo', loading
}) => {
    if (loading) return <FullChartKPICardSkeleton />;
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-zinc-500 dark:text-monday-dark-text-secondary bg-zinc-100 dark:bg-monday-dark-elevated';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-monday-dark-text-secondary uppercase tracking-wider">{label}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h3 className="text-2xl font-bold text-zinc-800 dark:text-monday-dark-text">{value}</h3>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTrendColor()}`}>
                            <TrendIcon size={10} weight="bold" />
                            <span>{change}</span>
                        </div>
                    </div>
                </div>
                {icon && <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</div>}
            </div>

            <div className="h-32 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={2}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                        <Tooltip
                            contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, fontSize: 11 }}
                            labelStyle={{ color: '#fafafa' }}
                        />
                        <Bar dataKey="previous" fill="#d4d4d8" radius={[3, 3, 0, 0]} name="Previous" />
                        <Bar dataKey="current" fill={colors.line} radius={[3, 3, 0, 0]} name="Current" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-100 dark:border-monday-dark-border">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.line }} />
                    <span className="text-[10px] text-zinc-500 dark:text-monday-dark-text-secondary">Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-monday-dark-hover" />
                    <span className="text-[10px] text-zinc-500 dark:text-monday-dark-text-secondary">Previous</span>
                </div>
            </div>
        </div>
    );
};

// ============================================
// 11. CHART LOADING SKELETON
// ============================================
export interface ChartSkeletonProps {
    height?: string;
    title?: string;
    showLegend?: boolean;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
    height = 'h-64',
    title,
    showLegend = true
}) => (
    <div className={`flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm ${height}`}>
        {title && (
            <div className="flex justify-between items-center mb-4">
                <ShimmerBox className="h-4 w-32" />
                <ShimmerBox className="h-6 w-20 rounded" />
            </div>
        )}
        <div className="flex-1 flex items-end justify-between gap-2 pb-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                    <ShimmerBox
                        className="w-full rounded-t animate-pulse-subtle"
                        style={{
                            height: `${Math.random() * 60 + 30}%`,
                            animationDelay: `${i * 100}ms`
                        }}
                    />
                </div>
            ))}
        </div>
        {showLegend && (
            <div className="flex items-center gap-4 pt-3 border-t border-stone-100 dark:border-monday-dark-border">
                <ShimmerBox className="h-3 w-16" />
                <ShimmerBox className="h-3 w-16" />
                <ShimmerBox className="h-3 w-16" />
            </div>
        )}
    </div>
);

// ============================================
// 12. TABLE LOADING SKELETON
// ============================================
export interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 5,
    showHeader = true
}) => (
    <div className="bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm overflow-hidden">
        {showHeader && (
            <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-monday-dark-elevated border-b border-zinc-200 dark:border-monday-dark-border">
                {[...Array(columns)].map((_, i) => (
                    <ShimmerBox key={i} className={`h-4 ${i === 0 ? 'w-32' : 'w-20'} flex-shrink-0`} />
                ))}
            </div>
        )}
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {[...Array(rows)].map((_, rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-4 p-3" style={{ animationDelay: `${rowIdx * 50}ms` }}>
                    {[...Array(columns)].map((_, colIdx) => (
                        <ShimmerBox
                            key={colIdx}
                            className={`h-4 ${colIdx === 0 ? 'w-32' : 'w-20'} flex-shrink-0`}
                            style={{ animationDelay: `${(rowIdx * columns + colIdx) * 30}ms` }}
                        />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

// ============================================
// 13. PIE/DONUT CHART LOADING SKELETON
// ============================================
export const PieChartSkeleton: React.FC<{ size?: number; title?: string }> = ({
    size = 160,
    title
}) => (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm">
        {title && <ShimmerBox className="h-4 w-24 mb-4" />}
        <div
            className="rounded-full shimmer bg-zinc-200 dark:bg-monday-dark-hover animate-pulse-subtle"
            style={{ width: size, height: size }}
        />
        <div className="flex items-center gap-4 mt-4">
            <ShimmerBox className="h-3 w-16" />
            <ShimmerBox className="h-3 w-16" />
            <ShimmerBox className="h-3 w-16" />
        </div>
    </div>
);

// ============================================
// 14. LINE CHART LOADING SKELETON
// ============================================
export const LineChartSkeleton: React.FC<{ height?: string; title?: string }> = ({
    height = 'h-64',
    title
}) => (
    <div className={`flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm ${height}`}>
        {title && (
            <div className="flex justify-between items-center mb-4">
                <ShimmerBox className="h-4 w-32" />
                <ShimmerBox className="h-6 w-20 rounded" />
            </div>
        )}
        <div className="flex-1 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2">
                {[...Array(5)].map((_, i) => (
                    <ShimmerBox key={i} className="h-3 w-8" />
                ))}
            </div>
            {/* Chart area with wave pattern */}
            <div className="ml-12 h-full flex items-center">
                <svg className="w-full h-3/4" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <path
                        d="M0,40 Q10,35 20,38 T40,30 T60,35 T80,25 T100,30"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-stone-200 dark:text-zinc-700 dark:text-monday-dark-text animate-pulse-subtle"
                    />
                </svg>
            </div>
        </div>
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 ml-12">
            {[...Array(6)].map((_, i) => (
                <ShimmerBox key={i} className="h-3 w-8" />
            ))}
        </div>
    </div>
);

// ============================================
// 15. DASHBOARD SECTION LOADING SKELETON
// ============================================
export const DashboardSectionSkeleton: React.FC<{ title?: boolean }> = ({ title = true }) => (
    <div className="space-y-4">
        {title && <ShimmerBox className="h-5 w-40 mb-2" />}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex justify-between items-start mb-3">
                        <ShimmerBox className="h-3 w-20" />
                        <ShimmerBox className="w-8 h-8 rounded-lg" />
                    </div>
                    <ShimmerBox className="h-7 w-24 mb-2" />
                    <ShimmerBox className="h-4 w-16 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);
