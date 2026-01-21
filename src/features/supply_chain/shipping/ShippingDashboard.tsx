import React from 'react';
import { Truck, MapPin, Warning, CheckCircle } from 'phosphor-react';
import { StatCard } from '../../board/components/dashboard/StatCard';
import { DashboardChart } from '../../board/components/dashboard/DashboardChart';
import { useAppContext } from '../../../contexts/AppContext';

interface ShippingDashboardProps {
    viewId?: string;
    title?: string;
}

export const ShippingDashboard: React.FC<ShippingDashboardProps> = ({ viewId, title }) => {
    const { t } = useAppContext();
    const kpis = [
        { title: t('active_shipments'), value: '45', trend: t('on_track'), trendDirection: 'neutral' as const, icon: <Truck size={20} />, color: 'blue' },
        { title: t('delayed'), value: '3', trend: '+1 Today', trendDirection: 'down' as const, icon: <Warning size={20} />, color: 'red' },
        { title: t('delivered_today'), value: '18', trend: t('target_met'), trendDirection: 'up' as const, icon: <CheckCircle size={20} />, color: 'green' },
        { title: t('in_transit'), value: '24', trend: t('normal'), trendDirection: 'neutral' as const, icon: <MapPin size={20} />, color: 'purple' },
    ];

    const chartOptions = {
        title: { text: '' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Zone A', 'Zone B', 'Zone C', 'Intl'] },
        yAxis: { type: 'value' },
        series: [{ data: [30, 45, 20, 15], type: 'pie', radius: '60%' }]
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{title || t('shipping_dashboard')}</h1>
            <p className="text-gray-500 text-sm mb-6">{t('logistics_tracking_desc')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, idx) => <StatCard key={idx} {...kpi} />)}
            </div>

            <div className="h-96 bg-white dark:bg-monday-dark-surface p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <DashboardChart title={t('shipments_by_zone')} options={chartOptions} height="100%" />
            </div>
        </div>
    );
};
