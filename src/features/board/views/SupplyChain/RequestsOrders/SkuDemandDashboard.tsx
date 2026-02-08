import React from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { DashboardChart } from '../../../components/dashboard/DashboardChart';
import { DashboardTable } from '../../../components/dashboard/DashboardTable';
import {
  Package,
  TrendUp as TrendingUp,
  Warning as AlertTriangle,
  Stack as Layers,
  ChartBar as BarChart,
  Cube as Box,
} from 'phosphor-react';

export const SkuDemandDashboard: React.FC = () => {
  // R03: SKU Demand & Critical Items
  const kpis = [
    {
      title: 'Requested SKUs',
      value: '842',
      trend: '+15 new items',
      trendDirection: 'up',
      icon: <Package size={20} />,
      color: 'blue',
    },
    {
      title: 'Total Qty',
      value: '15.4k',
      trend: 'High Volume',
      trendDirection: 'up',
      icon: <Box size={20} />,
      color: 'indigo',
    },
    {
      title: 'Critical SKUs',
      value: '12',
      trend: 'Top Priority',
      trendDirection: 'neutral',
      icon: <AlertTriangle size={20} />,
      color: 'red',
    },
    {
      title: 'Top SKU (Vol)',
      value: 'Safety Gloves',
      trend: '2,500 units',
      trendDirection: 'neutral',
      icon: <TrendingUp size={20} />,
      color: 'green',
    },
    {
      title: 'Shortage SKUs',
      value: '8',
      trend: 'Stockout Risk',
      trendDirection: 'down',
      icon: <AlertTriangle size={20} />,
      color: 'orange',
    },
    {
      title: 'Stock Coverage',
      value: '92%',
      trend: 'Target: 95%',
      trendDirection: 'down',
      icon: <Layers size={20} />,
      color: 'teal',
    },
    {
      title: 'Top Category',
      value: 'PPE',
      trend: '40% of demand',
      trendDirection: 'neutral',
      icon: <BarChart size={20} />,
      color: 'purple',
    },
    {
      title: 'Rush Items',
      value: '24',
      trend: 'Urgent',
      trendDirection: 'neutral',
      icon: <AlertTriangle size={20} />,
      color: 'red',
    },
  ];

  const topSkusByQty = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Gloves', 'Helmets', 'Boots', 'Vests', 'Paper', 'Ink'] },
    yAxis: { type: 'value' },
    series: [{ name: 'Qty', data: [2500, 1200, 950, 800, 600, 450], type: 'bar', itemStyle: { color: '#3b82f6' } }],
  };

  const demandByCategory = {
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
        name: 'Category Usage',
        type: 'pie',
        selectedMode: 'multiple',
        radius: '65%',
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: 40, name: 'PPE' },
          { value: 25, name: 'Spare Parts' },
          { value: 20, name: 'Stationery' },
          { value: 10, name: 'IT Assets' },
          { value: 5, name: 'Services' },
        ],
      },
    ],
  };

  const tableColumns = [
    { header: 'Item Code', accessor: 'item_code' },
    { header: 'Item Name', accessor: 'item_name' },
    { header: 'Requested Qty', accessor: 'requested_qty' },
    { header: 'Warehouse', accessor: 'warehouse' },
    { header: 'Department', accessor: 'department' },
    { header: 'Due Date', accessor: 'due_date' },
    { header: 'Shortage Qty', accessor: 'shortage_qty' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            val === 'Critical'
              ? 'bg-red-100 text-red-700'
              : val === 'Available'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {val}
        </span>
      ),
    },
  ];

  const tableData = [
    {
      item_code: 'SKU-9901',
      item_name: 'Safety Gloves (L)',
      requested_qty: '2500',
      warehouse: 'Main WH',
      department: 'Ops',
      due_date: '2024-12-25',
      shortage_qty: '0',
      status: 'Available',
    },
    {
      item_code: 'SKU-1022',
      item_name: 'Hard Hat (Yellow)',
      requested_qty: '1200',
      warehouse: 'Main WH',
      department: 'Ops',
      due_date: '2024-12-28',
      shortage_qty: '0',
      status: 'Available',
    },
    {
      item_code: 'SKU-5501',
      item_name: 'Diesel Fuel (L)',
      requested_qty: '5000',
      warehouse: 'Site A',
      department: 'Fleet',
      due_date: '2024-12-20',
      shortage_qty: '500',
      status: 'Partial',
    },
    {
      item_code: 'SKU-3320',
      item_name: 'Specific Pump Part',
      requested_qty: '5',
      warehouse: 'Spare Parts',
      department: 'Maint',
      due_date: '2024-12-19',
      shortage_qty: '5',
      status: 'Critical',
    },
    {
      item_code: 'SKU-8821',
      item_name: 'Hydraulic Oil',
      requested_qty: '200',
      warehouse: 'Site B',
      department: 'Maint',
      due_date: '2024-12-22',
      shortage_qty: '0',
      status: 'Available',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">SKU Demand & Critical Items</h1>
      <p className="text-gray-500 text-sm mb-6">Item/SKU demand with criticality and warehouse impact.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 h-full">
          <DashboardChart title="Top SKUs by Quantity" options={topSkusByQty} height="100%" />
        </div>
        <div className="h-full">
          <DashboardChart title="Demand by Category" options={demandByCategory} height="100%" />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] mb-20">
        <DashboardTable title="Requests by Item/SKU" columns={tableColumns} data={tableData} />
      </div>
    </div>
  );
};

export default SkuDemandDashboard;
