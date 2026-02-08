import React from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { DashboardChart } from '../../../components/dashboard/DashboardChart';
import { DashboardTable } from '../../../components/dashboard/DashboardTable';
import {
  ShieldWarning as ShieldAlert,
  PauseCircle,
  Clock,
  TrendUp as TrendingUp,
  Warning as AlertTriangle,
  WarningOctagon as AlertOctagon,
  XCircle,
  ArrowsClockwise as RefreshCw,
} from 'phosphor-react';

export const OrderRisksDashboard: React.FC = () => {
  // O05: Order Risks & Exceptions
  const kpis = [
    {
      title: 'Blocked Orders',
      value: '18',
      trend: 'Requires Action',
      trendDirection: 'down',
      icon: <PauseCircle size={20} />,
      color: 'red',
    },
    {
      title: 'Payment Holds',
      value: '5',
      trend: 'Finance',
      trendDirection: 'neutral',
      icon: <AlertOctagon size={20} />,
      color: 'orange',
    },
    {
      title: 'Stock Blocked',
      value: '8',
      trend: 'Backordered',
      trendDirection: 'down',
      icon: <XCircle size={20} />,
      color: 'red',
    },
    {
      title: 'Late Orders',
      value: '12',
      trend: 'Overdue',
      trendDirection: 'down',
      icon: <Clock size={20} />,
      color: 'yellow',
    },
    {
      title: 'High Value Risk',
      value: '$150k',
      trend: 'Exposure',
      trendDirection: 'down',
      icon: <TrendingUp size={20} />,
      color: 'red',
    },
    {
      title: 'SLA Breaches',
      value: '4',
      trend: 'Today',
      trendDirection: 'down',
      icon: <AlertTriangle size={20} />,
      color: 'orange',
    },
    {
      title: 'Repeated Issues',
      value: '2',
      trend: 'Recurring',
      trendDirection: 'neutral',
      icon: <RefreshCw size={20} />,
      color: 'gray',
    },
    {
      title: 'Critical Risks',
      value: '6',
      trend: 'Immediate',
      trendDirection: 'down',
      icon: <ShieldAlert size={20} />,
      color: 'red',
    },
  ];

  // RefreshCw is now imported from phosphor-react

  const riskByType = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Credit Hold', 'Stockout', 'Verification', 'Data Error', 'Compliance'] },
    yAxis: { type: 'value' },
    series: [{ name: 'Blocked Count', data: [15, 8, 5, 3, 2], type: 'bar', itemStyle: { color: '#3b82f6' } }],
  };

  const riskTrend = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
    yAxis: { type: 'value' },
    series: [
      { name: 'Exceptions', type: 'line', data: [20, 18, 25, 18], smooth: true, itemStyle: { color: '#f97316' } },
    ],
  };

  const tableColumns = [
    { header: 'Order ID', accessor: 'order_id' },
    { header: 'Risk Type', accessor: 'risk_type' },
    { header: 'Severity', accessor: 'severity' },
    { header: 'Root Cause', accessor: 'root_cause' },
    { header: 'Days Stuck', accessor: 'days_stuck' },
    { header: 'Owner', accessor: 'owner' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}
        >
          {val}
        </span>
      ),
    },
  ];

  const tableData = [
    {
      order_id: 'ORD-5501',
      risk_type: 'Credit Hold',
      severity: 'High',
      root_cause: 'Over Limit',
      days_stuck: '5',
      owner: 'Finance',
      status: 'Critical',
    },
    {
      order_id: 'ORD-5520',
      risk_type: 'Stockout',
      severity: 'High',
      root_cause: 'Inventory Error',
      days_stuck: '3',
      owner: 'Warehouse',
      status: 'Critical',
    },
    {
      order_id: 'ORD-5535',
      risk_type: 'Verification',
      severity: 'Medium',
      root_cause: 'Address Match',
      days_stuck: '2',
      owner: 'Sales',
      status: 'Open',
    },
    {
      order_id: 'ORD-5540',
      risk_type: 'Data Error',
      severity: 'Low',
      root_cause: 'Typo',
      days_stuck: '1',
      owner: 'Support',
      status: 'Open',
    },
    {
      order_id: 'ORD-5555',
      risk_type: 'Compliance',
      severity: 'High',
      root_cause: 'Sanctions Check',
      days_stuck: '7',
      owner: 'Legal',
      status: 'Critical',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Order Risks & Exceptions</h1>
      <p className="text-gray-500 text-sm mb-6">
        Problems needing immediate attention: blocked orders, holds, and critical delays.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 h-full">
          <DashboardChart title="Risk Distribution by Type" options={riskByType} height="100%" />
        </div>
        <div className="h-full">
          <DashboardChart title="Exceptions Trend" options={riskTrend} height="100%" />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] mb-20">
        <DashboardTable title="Active Exceptions" columns={tableColumns} data={tableData} />
      </div>
    </div>
  );
};

export default OrderRisksDashboard;
