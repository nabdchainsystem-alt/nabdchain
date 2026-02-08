import React from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { DashboardChart } from '../../../components/dashboard/DashboardChart';
import { DashboardTable } from '../../../components/dashboard/DashboardTable';
import {
  Warning as AlertTriangle,
  ShieldWarning as ShieldAlert,
  Truck,
  WarningOctagon as AlertOctagon,
  ArrowsClockwise as RefreshCw,
  Prohibit as Slash,
  Clock,
} from 'phosphor-react';

export const RisksExceptionsDashboard: React.FC = () => {
  // R07: Risks & Exceptions
  const kpis = [
    {
      title: 'Overdue Requests',
      value: '15',
      trend: '+3 today',
      trendDirection: 'down',
      icon: <Clock size={20} />,
      color: 'orange',
    },
    {
      title: 'Critical Risks',
      value: '5',
      trend: 'High Priority',
      trendDirection: 'down',
      icon: <ShieldAlert size={20} />,
      color: 'red',
    },
    {
      title: 'Stock Blockers',
      value: '8',
      trend: 'Production Stop',
      trendDirection: 'down',
      icon: <Slash size={20} />,
      color: 'red',
    },
    {
      title: 'Payment Holds',
      value: '3',
      trend: 'Finance',
      trendDirection: 'neutral',
      icon: <AlertOctagon size={20} />,
      color: 'yellow',
    },
    {
      title: 'Policy Exceptions',
      value: '11',
      trend: 'Non-Compliance',
      trendDirection: 'down',
      icon: <AlertTriangle size={20} />,
      color: 'purple',
    },
    {
      title: 'Repeat Offenders',
      value: '2',
      trend: 'Users/Vendors',
      trendDirection: 'neutral',
      icon: <RefreshCw size={20} />,
      color: 'gray',
    },
    {
      title: 'High Value Ovd',
      value: '$45k',
      trend: 'Risk Value',
      trendDirection: 'down',
      icon: <ShieldAlert size={20} />,
      color: 'red',
    },
    {
      title: 'Top Risk Reason',
      value: 'Delay',
      trend: '40% of cases',
      trendDirection: 'neutral',
      icon: <Truck size={20} />,
      color: 'blue',
    },
  ];

  const riskByType = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Delay', 'Stockout', 'Price Hike', 'Quality', 'Policy'] },
    yAxis: { type: 'value' },
    series: [{ data: [15, 8, 5, 2, 11], type: 'bar', color: '#3b82f6' }],
  };

  const riskTrend = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
    yAxis: { type: 'value' },
    series: [
      { name: 'Risk Events', type: 'line', data: [10, 15, 12, 18], smooth: true, itemStyle: { color: '#f97316' } },
    ],
  };

  const tableColumns = [
    { header: 'Request ID', accessor: 'request_id' },
    { header: 'Department', accessor: 'department' },
    { header: 'Item/Vendor', accessor: 'item_code' },
    { header: 'Risk Type', accessor: 'risk_type' },
    { header: 'Severity', accessor: 'severity' },
    { header: 'Root Cause', accessor: 'root_cause' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
        >
          {val}
        </span>
      ),
    },
  ];

  const tableData = [
    {
      request_id: 'PR-8821',
      department: 'Ops',
      item_code: 'Generator',
      risk_type: 'Delivery Delay',
      severity: 'High',
      root_cause: 'Storm',
      status: 'Critical',
    },
    {
      request_id: 'PR-8840',
      department: 'IT',
      item_code: 'Servers',
      risk_type: 'Stockout',
      severity: 'High',
      root_cause: 'Chip Shortage',
      status: 'Critical',
    },
    {
      request_id: 'PR-8855',
      department: 'Admin',
      item_code: 'Furniture',
      risk_type: 'Price Hike',
      severity: 'Medium',
      root_cause: 'Inflation',
      status: 'Open',
    },
    {
      request_id: 'PR-8860',
      department: 'HR',
      item_code: 'Agency A',
      risk_type: 'Policy',
      severity: 'Low',
      root_cause: 'No Contract',
      status: 'Open',
    },
    {
      request_id: 'PR-8872',
      department: 'Ops',
      item_code: 'Chemicals',
      risk_type: 'Quality',
      severity: 'High',
      root_cause: 'Failed Lab Test',
      status: 'Critical',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Risks & Exceptions</h1>
      <p className="text-gray-500 text-sm mb-6">Actionable risk board for delays, shortages, and policy exceptions.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 h-full">
          <DashboardChart title="Risks by Type" options={riskByType} height="100%" />
        </div>
        <div className="h-full">
          <DashboardChart title="Risk Trend" options={riskTrend} height="100%" />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] mb-20">
        <DashboardTable title="Exceptions List" columns={tableColumns} data={tableData} />
      </div>
    </div>
  );
};

export default RisksExceptionsDashboard;
