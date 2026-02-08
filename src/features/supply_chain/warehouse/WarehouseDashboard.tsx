import React, { useMemo } from 'react';
import { Activity } from 'phosphor-react';
import { StatCard } from '../../board/components/dashboard/StatCard';
import { DashboardChart } from '../../board/components/dashboard/DashboardChart';
import warehouseMaster from './warehouse_semantic_master.json';

interface WarehouseDashboardProps {
  viewId?: string;
  title?: string;
}

// Helper to get random mock value
const getMockValue = (key: string) => {
  const hash = key.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  if (key.includes('pct') || key.includes('rate')) return `${70 + (hash % 30)}%`;
  if (key.includes('coss') || key.includes('value')) return `$${(hash * 100).toLocaleString()}`;
  return (hash % 500).toString();
};

export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({ viewId, title }) => {
  const dashboardConfig = useMemo(() => {
    if (!viewId) return warehouseMaster.dashboards[0]; // Default
    return warehouseMaster.dashboards.find((d) => d.id === viewId) || warehouseMaster.dashboards[0];
  }, [viewId]);

  const kpis = useMemo(() => {
    const kpiKeys = dashboardConfig.kpis || [];
    const dict = (warehouseMaster.kpis_dictionary as Record<string, { en?: string }>) || {};

    return kpiKeys.map((key: string) => ({
      title: dict[key]?.en || key,
      value: getMockValue(key),
      trend: 'vs. last week',
      trendDirection: Math.random() > 0.5 ? 'up' : 'down',
      icon: <Activity size={20} />, // Default icon
      color: ['blue', 'green', 'orange', 'purple'][Math.floor(Math.random() * 4)],
    }));
  }, [dashboardConfig]);

  const chartOptions = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    yAxis: { type: 'value' },
    series: [{ data: [120, 200, 150, 80, 70, 110, 130], type: 'bar', itemStyle: { color: '#3b82f6' } }],
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{title || dashboardConfig.name_en}</h1>
      <p className="text-gray-500 text-sm mb-6">Dynamic Dashboard View: {dashboardConfig.name_en}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map(
          (
            kpi: {
              title: string;
              value: string;
              trend: string;
              trendDirection: string;
              icon: React.ReactNode;
              color: string;
            },
            idx: number,
          ) => (
            <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
          ),
        )}
      </div>

      <div className="h-96 bg-white dark:bg-monday-dark-surface p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <DashboardChart title={`${dashboardConfig.name_en} Trends`} options={chartOptions} height="100%" />
      </div>
    </div>
  );
};
