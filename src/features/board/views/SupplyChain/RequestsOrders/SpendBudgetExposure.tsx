import React from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { DashboardChart } from '../../../components/dashboard/DashboardChart';
import { DashboardTable } from '../../../components/dashboard/DashboardTable';
import {
  CurrencyDollar as DollarSign,
  ChartPie as PieChart,
  TrendDown as TrendingDown,
  CreditCard,
  ShoppingBag,
  WarningCircle as AlertCircle,
  CheckCircle,
} from 'phosphor-react';

export const SpendBudgetExposure: React.FC = () => {
  // R06: Spend & Budget Exposure
  const kpis = [
    {
      title: 'Requested Spend',
      value: '$450k',
      trend: 'This Month',
      trendDirection: 'neutral',
      icon: <ShoppingBag size={20} />,
      color: 'blue',
    },
    {
      title: 'Approved Spend',
      value: '$320k',
      trend: '71% Rate',
      trendDirection: 'neutral',
      icon: <CheckCircle size={20} />,
      color: 'green',
    },
    {
      title: 'Pending Approval',
      value: '$130k',
      trend: 'High Exposure',
      trendDirection: 'down',
      icon: <CreditCard size={20} />,
      color: 'orange',
    },
    {
      title: 'Budget Utilized',
      value: '78%',
      trend: 'On Track',
      trendDirection: 'up',
      icon: <PieChart size={20} />,
      color: 'purple',
    },
    {
      title: 'Top Item Cost',
      value: '$45k',
      trend: 'Generators',
      trendDirection: 'neutral',
      icon: <DollarSign size={20} />,
      color: 'indigo',
    },
    {
      title: 'Maverick Spend',
      value: '$12k',
      trend: 'Non-Compliant',
      trendDirection: 'down',
      icon: <AlertCircle size={20} />,
      color: 'red',
    },
    {
      title: 'Avg Unit Cost',
      value: '$150',
      trend: '+2% Inflation',
      trendDirection: 'down',
      icon: <TrendingDown size={20} />,
      color: 'yellow',
    },
    {
      title: 'Spend Variance',
      value: '-$5k',
      trend: 'Under Budget',
      trendDirection: 'up',
      icon: <DollarSign size={20} />,
      color: 'green',
    },
  ];

  // CheckCircle is now imported from phosphor-react

  const spendByStatus = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Draft', 'Pending', 'Approved', 'Rejected'] },
    yAxis: { type: 'value' },
    series: [{ name: 'Value', type: 'bar', data: [20000, 130000, 320000, 45000], itemStyle: { color: '#3b82f6' } }],
  };

  const spendTrend = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Spend',
        type: 'line',
        data: [80000, 120000, 95000, 155000],
        smooth: true,
        itemStyle: { color: '#10b981' },
        areaStyle: { opacity: 0.1 },
      },
    ],
  };

  const tableColumns = [
    { header: 'Item Code', accessor: 'item_code' },
    { header: 'Item Name', accessor: 'item_name' },
    { header: 'Qty', accessor: 'requested_qty' },
    { header: 'Unit Cost', accessor: 'unit_cost' },
    { header: 'Total Cost', accessor: 'total_cost' },
    { header: 'Department', accessor: 'department' },
    {
      header: 'Aprv Status',
      accessor: 'approval_status',
      render: (val: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}
        >
          {val}
        </span>
      ),
    },
  ];

  const tableData = [
    {
      item_code: 'IT-005',
      item_name: 'High-Perf Laptop',
      requested_qty: '10',
      unit_cost: '$2,500',
      total_cost: '$25,000',
      department: 'IT',
      approval_status: 'Pending',
    },
    {
      item_code: 'OP-201',
      item_name: 'Generator Set',
      requested_qty: '2',
      unit_cost: '$45,000',
      total_cost: '$90,000',
      department: 'Ops',
      approval_status: 'Approved',
    },
    {
      item_code: 'MK-101',
      item_name: 'Conf Branded Gear',
      requested_qty: '500',
      unit_cost: '$20',
      total_cost: '$10,000',
      department: 'Marketing',
      approval_status: 'Approved',
    },
    {
      item_code: 'HR-002',
      item_name: 'Training License',
      requested_qty: '50',
      unit_cost: '$150',
      total_cost: '$7,500',
      department: 'HR',
      approval_status: 'Pending',
    },
    {
      item_code: 'AD-550',
      item_name: 'Office Furniture',
      requested_qty: '15',
      unit_cost: '$400',
      total_cost: '$6,000',
      department: 'Admin',
      approval_status: 'Pending',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Spend & Budget Exposure</h1>
      <p className="text-gray-500 text-sm mb-6">
        Requested vs approved spend, budget utilization, and high cost items.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 h-full">
          <DashboardChart title="Spend Trend (Weekly)" options={spendTrend} height="100%" />
        </div>
        <div className="h-full">
          <DashboardChart title="Spend by Status" options={spendByStatus} height="100%" />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] mb-20">
        <DashboardTable title="Top Cost Items" columns={tableColumns} data={tableData} />
      </div>
    </div>
  );
};

export default SpendBudgetExposure;
