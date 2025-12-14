import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export interface KPIConfig {
    id: string;
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
    color?: string; // Optional color theme for the card
}

export const KPICard: React.FC<KPIConfig> = ({ label, value, change, trend, icon, color = 'indigo' }) => {
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';

    const getTrendColor = () => {
        if (isNeutral) return 'text-stone-500 bg-stone-100 dark:bg-stone-800';
        if (isPositive) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    };

    const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

    return (
        <div className="flex flex-col p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</span>
                {icon && <div className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20`}>{icon}</div>}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{value}</h3>
            </div>

            <div className={`self-start flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-[10px] font-medium ${getTrendColor()}`}>
                <TrendIcon size={12} />
                <span>{change}</span>
                <span className="opacity-60 font-normal ml-0.5">vs last month</span>
            </div>
        </div>
    );
};
