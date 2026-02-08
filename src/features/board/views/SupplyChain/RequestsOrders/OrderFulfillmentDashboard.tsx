import React from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { DashboardChart } from '../../../components/dashboard/DashboardChart';
import { DashboardTable } from '../../../components/dashboard/DashboardTable';
import {
  Truck,
  CheckCircle,
  Package,
  Clock,
  WarningOctagon as AlertOctagon,
  ArrowsClockwise as RefreshCw,
  Cube as Box,
} from 'phosphor-react';

export const OrderFulfillmentDashboard: React.FC = () => {
  // O02: Order Fulfillment
  const kpis = [
    {
      title: 'Fulfillment Rate',
      value: '96%',
      trend: 'Target Met',
      trendDirection: 'up',
      icon: <CheckCircle size={20} />,
      color: 'green',
    },
    {
      title: 'OTIF Rate',
      value: '92%',
      trend: 'Improving',
      trendDirection: 'up',
      icon: <Truck size={20} />,
      color: 'blue',
    },
    {
      title: 'Backorder Qty',
      value: '1,200',
      trend: '+50 vs last week',
      trendDirection: 'down',
      icon: <Package size={20} />,
      color: 'orange',
    },
    {
      title: 'Delay Rate',
      value: '4%',
      trend: 'Stable',
      trendDirection: 'neutral',
      icon: <Clock size={20} />,
      color: 'yellow',
    },
    {
      title: 'Avg Delay',
      value: '1.5 Days',
      trend: 'Acceptable',
      trendDirection: 'up',
      icon: <Clock size={20} />,
      color: 'green',
    },
    {
      title: 'Waiting Stock',
      value: '15 Orders',
      trend: 'Stockout',
      trendDirection: 'down',
      icon: <AlertOctagon size={20} />,
      color: 'red',
    },
    {
      title: 'Waiting Ship',
      value: '24 Orders',
      trend: 'Ready',
      trendDirection: 'neutral',
      icon: <Box size={20} />,
      color: 'blue',
    },
    {
      title: 'Returns Today',
      value: '3',
      trend: 'Quality Issue',
      trendDirection: 'down',
      icon: <RefreshCw size={20} />,
      color: 'red',
    },
  ];

  const deliveryStatus = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['On Time', 'Late', 'Partial', 'Not Shipped'] },
    yAxis: { type: 'value' },
    series: [{ name: 'Orders', data: [350, 15, 20, 45], type: 'bar', itemStyle: { color: '#3b82f6' } }],
  };

  const otifTrend = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
    yAxis: { type: 'value' },
    series: [{ name: 'OTIF %', type: 'line', data: [88, 90, 91, 92], smooth: true, itemStyle: { color: '#3b82f6' } }],
  };

  const tableColumns = [
    { header: 'Order ID', accessor: 'order_id' },
    { header: 'Warehouse', accessor: 'warehouse' },
    { header: 'Ordered Qty', accessor: 'ordered_qty' },
    { header: 'Shipped Qty', accessor: 'shipped_qty' },
    { header: 'Backorder Qty', accessor: 'backorder_qty' },
    { header: 'Promised Date', accessor: 'promised_date' },
    { header: 'ETA', accessor: 'eta' },
    {
      header: 'OTIF',
      accessor: 'otif_flag',
      render: (val: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {val}
        </span>
      ),
    },
  ];

  const tableData = [
    {
      order_id: 'ORD-9901',
      warehouse: 'Main WH',
      ordered_qty: '100',
      shipped_qty: '100',
      backorder_qty: '0',
      promised_date: '2024-12-18',
      eta: '2024-12-18',
      otif_flag: 'Yes',
    },
    {
      order_id: 'ORD-9902',
      warehouse: 'Site A',
      ordered_qty: '50',
      shipped_qty: '30',
      backorder_qty: '20',
      promised_date: '2024-12-17',
      eta: '2024-12-20',
      otif_flag: 'No',
    },
    {
      order_id: 'ORD-9903',
      warehouse: 'Main WH',
      ordered_qty: '200',
      shipped_qty: '200',
      backorder_qty: '0',
      promised_date: '2024-12-18',
      eta: '2024-12-19',
      otif_flag: 'No',
    },
    {
      order_id: 'ORD-9905',
      warehouse: 'Site B',
      ordered_qty: '10',
      shipped_qty: '10',
      backorder_qty: '0',
      promised_date: '2024-12-16',
      eta: '2024-12-16',
      otif_flag: 'Yes',
    },
    {
      order_id: 'ORD-9908',
      warehouse: 'Main WH',
      ordered_qty: '75',
      shipped_qty: '0',
      backorder_qty: '75',
      promised_date: '2024-12-18',
      eta: 'TBD',
      otif_flag: 'No',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Order Fulfillment</h1>
      <p className="text-gray-500 text-sm mb-6">Execution & delivery reality, unexpected shortages and backorders.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 h-full">
          <DashboardChart title="OTIF Trend" options={otifTrend} height="100%" />
        </div>
        <div className="h-full">
          <DashboardChart title="Delivery Status" options={deliveryStatus} height="100%" />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] mb-20">
        <DashboardTable title="Fulfillment Progress" columns={tableColumns} data={tableData} />
      </div>
    </div>
  );
};

export default OrderFulfillmentDashboard;
