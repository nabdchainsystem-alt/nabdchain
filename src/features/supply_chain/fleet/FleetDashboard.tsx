import React from 'react';
import { Truck, Activity, Wrench, Fuel } from 'lucide-react';
import { StatCard } from '../../board/components/dashboard/StatCard';
import { DashboardChart } from '../../board/components/dashboard/DashboardChart';
import { useAppContext } from '../../../contexts/AppContext';

interface FleetDashboardProps {
    viewId?: string;
    title?: string;
}

export const FleetDashboard: React.FC<FleetDashboardProps> = ({ viewId, title }) => {
    const { t } = useAppContext();
    const kpis = [
        { title: t('total_fleet'), value: '64', trend: t('active'), trendDirection: 'neutral' as const, icon: <Truck size={20} />, color: 'blue' },
        { title: t('in_maintenance'), value: '5', trend: t('scheduled'), trendDirection: 'neutral' as const, icon: <Wrench size={20} />, color: 'orange' },
        { title: t('distance_today'), value: '3,200 km', trend: 'Avg', trendDirection: 'neutral' as const, icon: <Activity size={20} />, color: 'green' },
        { title: t('fuel_efficiency'), value: '92%', trend: '-1%', trendDirection: 'down' as const, icon: <Fuel size={20} />, color: 'indigo' },
    ];

    const chartOptions = {
        title: { text: '' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Truck', 'Van', 'Bike', 'Car'] },
        yAxis: { type: 'value' },
        series: [{ data: [100, 200, 150, 80], type: 'bar', itemStyle: { color: '#3b82f6' } }]
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#09090b] p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{title || t('fleet_management')}</h1>
            <p className="text-gray-500 text-sm mb-6">{t('vehicle_status_desc')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, idx) => <StatCard key={idx} {...kpi} />)}
            </div>

            <div className="h-96 bg-white dark:bg-[#1a1d24] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <DashboardChart title={t('utilization_by_type')} options={chartOptions} height="100%" />
            </div>
        </div>
    );
};
