import React from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { DashboardChart } from '../../../components/dashboard/DashboardChart';
import { DashboardTable } from '../../../components/dashboard/DashboardTable';
import {
  CurrencyDollar as DollarSign,
  Percent,
  FileText,
  WarningCircle as AlertCircle,
  CreditCard,
  TrendDown as TrendingDown,
  Wallet,
} from 'phosphor-react';

export const OrdersFinanceDashboard: React.FC = () => {
  // O03: Orders Value & Finance
  const kpis = [
    {
      title: 'Total Order Value',
      value: '$4.2M',
      trend: '+$200k vs Plan',
      trendDirection: 'up',
      icon: <DollarSign size={20} />,
      color: 'blue',
    },
    {
      title: 'Invoiced Value',
      value: '$3.8M',
      trend: '90% Invoiced',
      trendDirection: 'up',
      icon: <FileText size={20} />,
      color: 'green',
    },
    {
      title: 'Pending Payment',
      value: '$1.2M',
      trend: 'Collections',
      trendDirection: 'neutral',
      icon: <Wallet size={20} />,
      color: 'orange',
    },
    {
      title: 'Uninvoiced Value',
      value: '$400k',
      trend: 'Action Needed',
      trendDirection: 'down',
      icon: <AlertCircle size={20} />,
      color: 'red',
    },
    {
      title: 'Gross Margin %',
      value: '24%',
      trend: 'Target: 22%',
      trendDirection: 'up',
      icon: <Percent size={20} />,
      color: 'teal',
    },
    {
      title: 'Avg Order Value',
      value: '$12.5k',
      trend: 'Stable',
      trendDirection: 'neutral',
      icon: <DollarSign size={20} />,
      color: 'indigo',
    },
    {
      title: 'Discount Impact',
      value: '$85k',
      trend: 'Promo Season',
      trendDirection: 'down',
      icon: <TrendingDown size={20} />,
      color: 'yellow',
    },
    {
      title: 'Tax Exposure',
      value: '$420k',
      trend: 'VAT',
      trendDirection: 'neutral',
      icon: <CreditCard size={20} />,
      color: 'gray',
    },
  ];

  const valueTrend = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Order Value',
        type: 'line',
        data: [800000, 1200000, 1000000, 1200000],
        smooth: true,
        itemStyle: { color: '#3b82f6' },
      },
    ],
  };

  const valueByStatus = {
    tooltip: { trigger: 'item', formatter: '{b}  {c}' },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 6,
      itemHeight: 6,
      itemGap: 4,
      textStyle: { fontSize: 8 },
      selectedMode: 'multiple',
    },
    series: [
      {
        name: 'Start Value',
        type: 'pie',
        selectedMode: 'multiple',
        radius: '65%',
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: 60, name: 'Invoiced', itemStyle: { color: '#10b981' } },
          { value: 25, name: 'Pending Invoice', itemStyle: { color: '#f59e0b' } },
          { value: 15, name: 'Draft/New', itemStyle: { color: '#cbd5e1' } },
        ],
      },
    ],
  };

  const tableColumns = [
    { header: 'Order ID', accessor: 'order_id' },
    { header: 'Customer', accessor: 'customer' },
    { header: 'Order Value', accessor: 'order_value' },
    { header: 'Discount', accessor: 'discount' },
    { header: 'Tax', accessor: 'tax' },
    { header: 'Inv Status', accessor: 'inv_status' },
    { header: 'Pay Status', accessor: 'pay_status' },
    {
      header: 'Margin',
      accessor: 'margin',
      render: (val: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${val.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {val}
        </span>
      ),
    },
  ];

  const tableData = [
    {
      order_id: 'ORD-9950',
      customer: 'Acme Corp',
      order_value: '$50,000',
      discount: '$5,000',
      tax: '$5,000',
      inv_status: 'Invoiced',
      pay_status: 'Paid',
      margin: '+28%',
    },
    {
      order_id: 'ORD-9952',
      customer: 'Global Inc',
      order_value: '$120,000',
      discount: '$0',
      tax: '$12,000',
      inv_status: 'Pending',
      pay_status: 'Unpaid',
      margin: '+22%',
    },
    {
      order_id: 'ORD-9955',
      customer: 'Tech Solutions',
      order_value: '$15,000',
      discount: '$2,000',
      tax: '$1,500',
      inv_status: 'Invoiced',
      pay_status: 'Overdue',
      margin: '+15%',
    },
    {
      order_id: 'ORD-9960',
      customer: 'Small Biz LLC',
      order_value: '$5,000',
      discount: '$500',
      tax: '$500',
      inv_status: 'Draft',
      pay_status: '-',
      margin: '+30%',
    },
    {
      order_id: 'ORD-9962',
      customer: 'Gov Entity',
      order_value: '$250,000',
      discount: '$0',
      tax: '$0',
      inv_status: 'Pending',
      pay_status: 'Unpaid',
      margin: '+18%',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Orders Value & Finance</h1>
      <p className="text-gray-500 text-sm mb-6">Financial view of orders, invoicing status, and margins.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 h-full">
          <DashboardChart title="Order Value Trend" options={valueTrend} height="100%" />
        </div>
        <div className="h-full">
          <DashboardChart title="Value Split by Status" options={valueByStatus} height="100%" />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] mb-20">
        <DashboardTable title="Order Financials" columns={tableColumns} data={tableData} />
      </div>
    </div>
  );
};

export default OrdersFinanceDashboard;
