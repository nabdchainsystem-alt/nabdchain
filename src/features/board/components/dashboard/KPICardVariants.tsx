import React from 'react';
import { ArrowUp, ArrowDown, Minus, Target } from 'phosphor-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

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

export const SparklineKPICard: React.FC<SparklineKPIConfig> = ({
    label, value, change, trend, sparklineData, icon, color = 'indigo'
}) => {
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-stone-500 bg-stone-100 dark:bg-stone-800';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);
    const chartData = sparklineData.map((v, i) => ({ value: v, index: i }));

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{label}</span>
                {icon && <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</div>}
            </div>

            <div className="flex items-end justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{value}</h3>
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
}

export const ProgressKPICard: React.FC<ProgressKPIConfig> = ({
    label, currentValue, targetValue, unit = '', prefix = '', change, trend, color = 'indigo'
}) => {
    const percentage = Math.min(Math.round((currentValue / targetValue) * 100), 100);
    const colors = colorMap[color];

    const getProgressColor = () => {
        if (percentage >= 80) return 'bg-emerald-500';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getTrendColor = () => {
        if (!trend || trend === 'neutral') return 'text-stone-500';
        if (trend === 'up') return 'text-emerald-600';
        return 'text-rose-600';
    };

    const TrendIcon = !trend || trend === 'neutral' ? Minus : (trend === 'up' ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{label}</span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                    <Target size={12} weight="bold" />
                    {percentage}%
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                    {prefix}{currentValue.toLocaleString()}{unit}
                </h3>
                <span className="text-sm text-stone-400">
                    / {prefix}{targetValue.toLocaleString()}{unit}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mb-2">
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
}

export const ComparisonKPICard: React.FC<ComparisonKPIConfig> = ({
    label, currentValue, currentLabel, previousValue, previousLabel, change, trend, icon, color = 'indigo'
}) => {
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-stone-500 bg-stone-100 dark:bg-stone-800';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{label}</span>
                {icon && <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</div>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    <span className="text-[10px] text-stone-400 uppercase">{currentLabel}</span>
                    <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{currentValue}</p>
                </div>
                <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    <span className="text-[10px] text-stone-400 uppercase">{previousLabel}</span>
                    <p className="text-lg font-bold text-stone-500 dark:text-stone-400">{previousValue}</p>
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

export const GradientKPICard: React.FC<GradientKPIConfig> = ({
    label, value, change, trend, icon, gradient = 'indigo'
}) => {
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
}

export const CompactKPICard: React.FC<CompactKPIConfig> = ({
    label, value, change, trend, color = 'indigo'
}) => {
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];
    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    const getTrendColor = () => {
        if (isNeutral) return 'text-stone-500';
        if (isPositive) return 'text-emerald-600';
        return 'text-rose-600';
    };

    return (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
                <div className={`w-1 h-10 rounded-full ${colors.bg.replace('bg-', 'bg-').replace('-50', '-500').replace('-900/20', '-500')}`}
                     style={{ backgroundColor: colors.line }} />
                <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider">{label}</span>
                    <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{value}</p>
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
}

export const RadialKPICard: React.FC<RadialKPIConfig> = ({
    label, value, percentage, subtitle, color = 'indigo'
}) => {
    const colors = colorMap[color];
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm hover:shadow-md transition-all">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">{label}</span>

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
                    <span className="text-xl font-bold text-stone-800 dark:text-stone-100">{percentage}%</span>
                </div>
            </div>

            <div className="text-center mt-3">
                <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{value}</p>
                {subtitle && <span className="text-xs text-stone-400">{subtitle}</span>}
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
}

export const MiniBarKPICard: React.FC<MiniBarKPIConfig> = ({
    label, value, change, trend, chartData, icon, color = 'indigo'
}) => {
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-stone-500 bg-stone-100 dark:bg-stone-800';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{label}</span>
                {icon && <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</div>}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{value}</h3>
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
}

export const MiniAreaKPICard: React.FC<MiniAreaKPIConfig> = ({
    label, value, change, trend, chartData, icon, color = 'indigo'
}) => {
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-stone-500 bg-stone-100 dark:bg-stone-800';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    // Get gradient color with opacity
    const areaColor = colors.line;
    const areaGradientId = `gradient-${color}`;

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{label}</span>
                {icon && <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>{icon}</div>}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{value}</h3>
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
}

export const MultiMetricKPICard: React.FC<MultiMetricKPIConfig> = ({
    label, metrics, icon
}) => {
    return (
        <div className="flex flex-col p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{label}</span>
                {icon && <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">{icon}</div>}
            </div>

            <div className="space-y-3">
                {metrics.map((metric, index) => {
                    const percentage = Math.min((metric.value / metric.maxValue) * 100, 100);
                    const metricColors = colorMap[metric.color];

                    return (
                        <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-stone-600 dark:text-stone-400">{metric.name}</span>
                                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                                    {metric.value.toLocaleString()}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
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
}

export const FullChartKPICard: React.FC<FullChartKPIConfig> = ({
    label, value, change, trend, chartData, icon, color = 'indigo'
}) => {
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colors = colorMap[color];

    const getTrendColor = () => {
        if (isNeutral) return 'text-stone-500 bg-stone-100 dark:bg-stone-800';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
        return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{label}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{value}</h3>
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

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.line }} />
                    <span className="text-[10px] text-stone-500">Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                    <span className="text-[10px] text-stone-500">Previous</span>
                </div>
            </div>
        </div>
    );
};
