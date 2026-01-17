import React from 'react';
import { Users, Star, Clock, DollarSign } from 'lucide-react';
import { StatCard } from '../../board/components/dashboard/StatCard';
import { DashboardChart } from '../../board/components/dashboard/DashboardChart';
import { useAppContext } from '../../../contexts/AppContext';

interface VendorsDashboardProps {
    viewId?: string;
    title?: string;
}

export const VendorsDashboard: React.FC<VendorsDashboardProps> = ({ viewId, title }) => {
    const { t } = useAppContext();
    const kpis = [
        { title: t('active_vendors'), value: '128', trend: t('total'), trendDirection: 'neutral' as const, icon: <Users size={20} />, color: 'blue' },
        { title: t('top_rated'), value: '45', trend: 'Score > 90%', trendDirection: 'up' as const, icon: <Star size={20} />, color: 'yellow' },
        { title: t('avg_lead_time'), value: '14 Days', trend: '-2 Days', trendDirection: 'up' as const, icon: <Clock size={20} />, color: 'green' },
        { title: t('monthly_spend'), value: '$1.2M', trend: '+5%', trendDirection: 'down' as const, icon: <DollarSign size={20} />, color: 'purple' },
    ];

    const chartOptions = {
        title: { text: '' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Fabric', 'Electronics', 'Packaging', 'Software'] },
        yAxis: { type: 'value' },
        series: [{ data: [40, 30, 20, 10], type: 'bar', itemStyle: { color: '#3b82f6' } }]
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#09090b] p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{title || t('vendor_management')}</h1>
            <p className="text-gray-500 text-sm mb-6">{t('supplier_performance_desc')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, idx) => <StatCard key={idx} {...kpi} />)}
            </div>

            <div className="h-96 bg-white dark:bg-[#1a1d24] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <DashboardChart title={t('spend_by_category')} options={chartOptions} height="100%" />
            </div>
        </div>
    );
};
