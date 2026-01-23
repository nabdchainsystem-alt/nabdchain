import React, { memo, useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'phosphor-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export interface KPIConfig {
    id: string;
    label: string;
    subtitle?: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
    color?: string; // Optional color theme for the card
    sparklineData?: number[];
    loading?: boolean;
}

// Skeleton shimmer component for loading state
const KPICardSkeleton: React.FC = () => (
    <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm h-full justify-between">
        <div className="flex justify-between items-start mb-1">
            <div className="flex flex-col gap-1">
                <div className="h-3 w-20 rounded shimmer bg-zinc-200 dark:bg-monday-dark-hover" />
                <div className="h-2 w-14 rounded shimmer bg-zinc-100 dark:bg-monday-dark-elevated" />
            </div>
            <div className="w-8 h-8 rounded-lg shimmer bg-zinc-100 dark:bg-monday-dark-elevated" />
        </div>

        <div className="flex justify-between items-end mt-3">
            <div className="flex flex-col gap-2">
                <div className="h-7 w-24 rounded shimmer bg-zinc-200 dark:bg-monday-dark-hover" />
                <div className="h-5 w-32 rounded-full shimmer bg-zinc-100 dark:bg-monday-dark-elevated" />
            </div>
            <div className="h-10 w-20 rounded shimmer bg-zinc-100 dark:bg-monday-dark-elevated" />
        </div>
    </div>
);

export const KPICard: React.FC<KPIConfig> = memo(({ label, subtitle, value, change, trend, icon, color = 'indigo', sparklineData, loading }) => {
    if (loading) {
        return <KPICardSkeleton />;
    }

    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';

    const getTrendColor = () => {
        if (isNeutral) return 'text-zinc-500 dark:text-monday-dark-text-secondary bg-zinc-100 dark:bg-monday-dark-hover';
        if (isPositive) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-monday-dark-surface border border-zinc-200 dark:border-monday-dark-border rounded-xl shadow-sm hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow h-full justify-between animate-fade-in-up">
            <div className="flex justify-between items-start mb-1">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-monday-dark-text-secondary uppercase tracking-wider">{label}</span>
                    {subtitle && <span className="text-[10px] text-zinc-400 dark:text-monday-dark-text-muted font-medium">{subtitle}</span>}
                </div>
                {icon && <div className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20`}>{icon}</div>}
            </div>

            <div className="flex justify-between items-end mt-1">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-bold text-zinc-800 dark:text-monday-dark-text leading-tight">{value}</h3>
                    <div className={`flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium w-fit ${getTrendColor()}`}>
                        <TrendIcon size={12} />
                        <span>{change}</span>
                        <span className="opacity-60 font-normal ml-0.5">vs last month</span>
                    </div>
                </div>

                {sparklineData && (
                    <div className="h-10 w-20 opacity-50 mb-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData.map((v, i) => ({ value: v, i }))}>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    fill="#e2e8f0"
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
});

KPICard.displayName = 'KPICard';

// Export skeleton for standalone use
export const KPICardLoading = KPICardSkeleton;
