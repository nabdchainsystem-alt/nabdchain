import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
    color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendDirection, icon, color = 'blue' }) => {
    const trendColor = trendDirection === 'up' ? 'text-green-500' : trendDirection === 'down' ? 'text-red-500' : 'text-gray-500';

    return (
        <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="text-gray-500 text-sm font-medium">{title}</div>
                {icon && <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500`}>{icon}</div>}
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
                {trend && (
                    <div className={`text-xs font-medium mt-1 ${trendColor} flex items-center gap-1`}>
                        {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '•'} {trend}
                    </div>
                )}
            </div>
        </div>
    );
};
