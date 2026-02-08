import React from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { DashboardChart } from '../../../components/dashboard/DashboardChart';
import { DashboardTable } from '../../../components/dashboard/DashboardTable';
import {
  Package,
  CalendarBlank as Calendar,
  Clock,
  Warning as AlertTriangle,
  PlayCircle,
  ShieldWarning as ShieldAlert,
  CheckCircle,
} from 'phosphor-react';

export const DailyOrdersControl: React.FC = () => {
  // O01: Daily Orders Control
  const kpis = [
    {
      title: 'Open Orders',
      value: '342',
      trend: 'High Volume',
      trendDirection: 'up',
      icon: <Package size={20} />,
      color: 'blue',
    },
    {
      title: 'Created Today',
      value: '45',
      trend: '+12 vs avg',
      trendDirection: 'up',
      icon: <Calendar size={20} />,
      color: 'green',
    },
    {
      title: 'Due Today',
      value: '28',
      trend: 'Deadline',
      trendDirection: 'neutral',
      icon: <Clock size={20} />,
      color: 'orange',
    },
    {
      title: 'Overdue Orders',
      value: '12',
      trend: 'Critical',
      trendDirection: 'down',
      icon: <AlertTriangle size={20} />,
      color: 'red',
    },
    {
      title: 'Blocked Orders',
      value: '8',
      trend: 'Action Required',
      trendDirection: 'down',
      icon: <ShieldAlert size={20} />,
      color: 'red',
    },
    {
      title: 'Avg Cycle Time',
      value: '2.4 Days',
      trend: 'Fast',
      trendDirection: 'up',
      icon: <PlayCircle size={20} />,
      color: 'blue',
    },
    {
      title: 'OTIF Today',
      value: '94%',
      trend: 'Target Missed',
      trendDirection: 'down',
      icon: <CheckCircle size={20} />,
      color: 'yellow',
    },
    {
      title: 'Critical Alerts',
      value: '3',
      trend: 'New',
      trendDirection: 'down',
      icon: <AlertTriangle size={20} />,
      color: 'red',
    },
  ];

  const ordersByStatus = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['New', 'Processing', 'Picked', 'Shipped', 'Delivered'] },
    yAxis: { type: 'value' },
    series: [{ name: 'Orders', data: [45, 120, 80, 60, 35], type: 'bar', itemStyle: { color: '#3b82f6' } }],
  };

  const ordersHourly = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['8am', '10am', '12pm', '2pm', '4pm', '6pm'] },
    yAxis: { type: 'value' },
    series: [
      { name: 'Incoming', type: 'line', data: [10, 25, 45, 30, 20, 8], smooth: true, itemStyle: { color: '#8b5cf6' } },
      { name: 'Shipped', type: 'line', data: [5, 15, 35, 40, 25, 10], smooth: true, itemStyle: { color: '#10b981' } },
    ],
  };

  const tableColumns = [
    { header: 'Time', accessor: 'time' },
    { header: 'Order ID', accessor: 'order_id' },
    { header: 'Event', accessor: 'event' },
    { header: 'User', accessor: 'user' },
    { header: 'Value', accessor: 'value' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            val === 'Critical'
              ? 'bg-red-100 text-red-700'
              : val === 'Shipped'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
          }`}
        >
          {val}
        </span>
      ),
    },
  ];

  const tableData = [
    { time: '15:45', order_id: 'ORD-5001', event: 'Order Created', user: 'Sales Rep', value: '$1,200', status: 'New' },
    {
      time: '15:30',
      order_id: 'ORD-4998',
      event: 'Order Shipped',
      user: 'Warehouse',
      value: '$5,000',
      status: 'Shipped',
    },
    {
      time: '14:15',
      order_id: 'ORD-4800',
      event: 'Hold Applied',
      user: 'Credit Control',
      value: '$12,000',
      status: 'Critical',
    },
    {
      time: '13:00',
      order_id: 'ORD-5000',
      event: 'Order Picked',
      user: 'Warehouse',
      value: '$800',
      status: 'Processing',
    },
    { time: '12:30', order_id: 'ORD-4990', event: 'Stock Check', user: 'System', value: '-', status: 'Completed' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Daily Orders Control</h1>
      <p className="text-gray-500 text-sm mb-6">Always-on executive snapshot of orders, status, and alerts.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 h-full">
          <DashboardChart title="Hourly Order Activity" options={ordersHourly} height="100%" />
        </div>
        <div className="h-full">
          <DashboardChart title="Orders by Status" options={ordersByStatus} height="100%" />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] mb-20">
        <DashboardTable title="Live Order Activity" columns={tableColumns} data={tableData} />
      </div>
    </div>
  );
};

export default DailyOrdersControl;
