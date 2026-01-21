import React from 'react';
import { CalendarBlank, Target, TrendUp, WarningCircle } from 'phosphor-react';
import { StatCard } from '../../board/components/dashboard/StatCard';
import { DashboardChart } from '../../board/components/dashboard/DashboardChart';
import { useAppContext } from '../../../contexts/AppContext';

interface PlanningDashboardProps {
    viewId?: string;
    title?: string;
}

export const PlanningDashboard: React.FC<PlanningDashboardProps> = ({ viewId, title }) => {
    const { t } = useAppContext();
    const kpis = [
        { title: t('forecast_accuracy'), value: '89%', trend: '+2%', trendDirection: 'up' as const, icon: <Target size={20} />, color: 'blue' },
        { title: t('demand_growth'), value: '+12%', trend: 'YoY', trendDirection: 'up' as const, icon: <TrendUp size={20} />, color: 'green' },
        { title: t('planning_cycle'), value: t('weekly'), trend: t('active'), trendDirection: 'neutral' as const, icon: <CalendarBlank size={20} />, color: 'indigo' },
        { title: t('stockout_risks'), value: '4', trend: t('attention'), trendDirection: 'down' as const, icon: <WarningCircle size={20} />, color: 'red' },
    ];

    const chartOptions = {
        title: { text: '' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
        yAxis: { type: 'value' },
        series: [
            { name: t('forecast'), data: [800, 950, 1100, 1400], type: 'line', smooth: true, itemStyle: { color: '#3b82f6' } },
            { name: t('actual'), data: [810, 940, 1050, null], type: 'line', smooth: true, itemStyle: { color: '#10b981' } }
        ]
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('demand_planning')}</h1>
            <p className="text-gray-500 text-sm mb-6">{t('forecasting_desc')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, idx) => <StatCard key={idx} {...kpi} />)}
            </div>

            <div className="h-96 bg-white dark:bg-monday-dark-surface p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <DashboardChart title={t('forecast_vs_actual')} options={chartOptions} height="100%" />
            </div>
        </div>
    );
};
