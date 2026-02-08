import React from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { DashboardChart } from '../../../components/dashboard/DashboardChart';
import { DashboardTable } from '../../../components/dashboard/DashboardTable';
import {
  ChatText as MessageSquare,
  Clock,
  FileText,
  WarningCircle as AlertCircle,
  CurrencyDollar as DollarSign,
  ShieldWarning as ShieldAlert,
} from 'phosphor-react';

export const VendorRfqPipeline: React.FC = () => {
  // R04: Vendor & RFQ Pipeline
  const kpis = [
    {
      title: 'RFQs Sent',
      value: '42',
      trend: 'Last 30 days',
      trendDirection: 'neutral',
      icon: <FileText size={20} />,
      color: 'blue',
    },
    {
      title: 'Unanswered RFQs',
      value: '8',
      trend: 'Follow-up needed',
      trendDirection: 'down',
      icon: <AlertCircle size={20} />,
      color: 'orange',
    },
    {
      title: 'Avg Response Time',
      value: '2.1 Days',
      trend: 'Improving',
      trendDirection: 'up',
      icon: <Clock size={20} />,
      color: 'green',
    },
    {
      title: 'Quotes Received',
      value: '115',
      trend: 'High response rate',
      trendDirection: 'up',
      icon: <MessageSquare size={20} />,
      color: 'indigo',
    },
    {
      title: 'Best Price Savings',
      value: 'SAR 12.5k',
      trend: 'vs Budget',
      trendDirection: 'up',
      icon: <DollarSign size={20} />,
      color: 'emerald',
    },
    {
      title: 'Avg Lead Time',
      value: '14 Days',
      trend: 'Stable',
      trendDirection: 'neutral',
      icon: <Clock size={20} />,
      color: 'blue',
    },
    {
      title: 'Late Quotes',
      value: '15%',
      trend: 'Of total',
      trendDirection: 'down',
      icon: <Clock size={20} />,
      color: 'red',
    },
    {
      title: 'Single Source Risk',
      value: '5 Items',
      trend: 'High Risk',
      trendDirection: 'down',
      icon: <ShieldAlert size={20} />,
      color: 'red',
    },
  ];

  const rfqsByStatus = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Draft', 'Sent', 'Partial Quotes', 'Closed', 'Awarded'] },
    yAxis: { type: 'value' },
    series: [{ name: 'RFQs', type: 'bar', data: [5, 12, 8, 10, 7], itemStyle: { color: '#3b82f6' } }],
  };

  const responseTimeDist = {
    title: { text: '' },
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
        name: 'Response Time',
        type: 'pie',
        selectedMode: 'multiple',
        radius: '65%',
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: 50, name: '< 24 Hours' },
          { value: 30, name: '1-3 Days' },
          { value: 15, name: '4-7 Days' },
          { value: 5, name: '> 1 Week' },
        ],
      },
    ],
  };

  const tableColumns = [
    { header: 'RFQ ID', accessor: 'rfq_id' },
    { header: 'Vendor Name', accessor: 'vendor_name' },
    { header: 'Item Code', accessor: 'item_code' },
    { header: 'Qty', accessor: 'requested_qty' },
    { header: 'RFQ Status', accessor: 'rfq_status' },
    { header: 'Quote Status', accessor: 'quote_status' },
    { header: 'Response (Hrs)', accessor: 'response_time_hours' },
    {
      header: 'Best Price',
      accessor: 'best_price_flag',
      render: (val: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
        >
          {val}
        </span>
      ),
    },
  ];

  const tableData = [
    {
      rfq_id: 'RFQ-9001',
      vendor_name: 'TechSolutions Inc',
      item_code: 'IT-Servers',
      requested_qty: '5',
      rfq_status: 'Sent',
      quote_status: 'Received',
      response_time_hours: '18',
      best_price_flag: 'Yes',
    },
    {
      rfq_id: 'RFQ-9001',
      vendor_name: 'Global IT',
      item_code: 'IT-Servers',
      requested_qty: '5',
      rfq_status: 'Sent',
      quote_status: 'Received',
      response_time_hours: '48',
      best_price_flag: 'No',
    },
    {
      rfq_id: 'RFQ-9002',
      vendor_name: 'Safety First Co',
      item_code: 'PPE-Gloves',
      requested_qty: '2500',
      rfq_status: 'Sent',
      quote_status: 'Pending',
      response_time_hours: '-',
      best_price_flag: '-',
    },
    {
      rfq_id: 'RFQ-9003',
      vendor_name: 'Office Depot',
      item_code: 'Stationery',
      requested_qty: '500',
      rfq_status: 'Closed',
      quote_status: ' awarded',
      response_time_hours: '24',
      best_price_flag: 'Yes',
    },
    {
      rfq_id: 'RFQ-9004',
      vendor_name: 'BuildMat',
      item_code: 'Cement',
      requested_qty: '1000',
      rfq_status: 'Sent',
      quote_status: 'Late',
      response_time_hours: '120',
      best_price_flag: 'No',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Vendor & RFQ Pipeline</h1>
      <p className="text-gray-500 text-sm mb-6">RFQ flow from request to quote and vendor responsiveness.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 h-full">
          <DashboardChart title="RFQs by Status" options={rfqsByStatus} height="100%" />
        </div>
        <div className="h-full">
          <DashboardChart title="Response Time Distribution" options={responseTimeDist} height="100%" />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] mb-20">
        <DashboardTable title="RFQ Pipeline" columns={tableColumns} data={tableData} />
      </div>
    </div>
  );
};

export default VendorRfqPipeline;
