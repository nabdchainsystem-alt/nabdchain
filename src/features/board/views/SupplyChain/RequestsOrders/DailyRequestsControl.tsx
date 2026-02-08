import React, { useState, useMemo } from 'react';
import { StatCard } from '../../../components/dashboard/StatCard';
import { DashboardChart } from '../../../components/dashboard/DashboardChart';
import {
  Activity,
  CurrencyDollar as DollarSign,
  WarningCircle as AlertCircle,
  CalendarBlank as Calendar,
  Clock,
  CheckCircle,
  MagnifyingGlass as Search,
  Plus,
  Upload,
  ArrowsDownUp as ArrowUpDown,
} from 'phosphor-react';

// Reuse or inline DashboardTable for custom sorting control if needed,
// OR pass sorted data to standard DashboardTable.
// Since DashboardTable is simple, we will reuse it but pass sorted data.
// We need to see if DashboardTable supports header clicks.
// If not, we'll build a custom simple table here to support Sort Clicks.
// Let's assume standard DashboardTable is just a display.
// We will build a "RequestsTable" component inline or here for full control over sorting headers.

interface SortableColumn {
  header: string;
  accessor: string;
  render?: (val: string, row: Record<string, string>) => React.ReactNode;
}

const SimpleSortableTable = ({
  columns,
  data,
  onSort,
  sortConfig,
}: {
  columns: SortableColumn[];
  data: Record<string, string>[];
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-left text-sm whitespace-nowrap">
      <thead className="uppercase tracking-wider border-b-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-stone-900/50 text-gray-500 dark:text-gray-400">
        <tr>
          {columns.map((col, idx) => (
            <th
              key={idx}
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors group select-none"
              onClick={() => onSort(col.accessor)}
            >
              <div className="flex items-center gap-1">
                {col.header}
                <ArrowUpDown
                  size={12}
                  className={`opacity-0 group-hover:opacity-50 ${sortConfig?.key === col.accessor ? 'opacity-100 text-blue-500' : ''}`}
                />
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors">
            {columns.map((col, cIdx) => (
              <td key={cIdx} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
              No requests found matching filters.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export const DailyRequestsControl: React.FC = () => {
  // --- State ---
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Mock Data (moved to state to allow adding new)
  const [requestRows, setRequestRows] = useState([
    {
      time: '14:30',
      event: 'Large PO Approval',
      request_id: 'PR-901',
      user: 'Director',
      department: 'Ops',
      amount: '$8,500',
      status: 'Approved',
    },
    {
      time: '13:15',
      event: 'Emergency PR',
      request_id: 'PR-902',
      user: 'Site Mgr',
      department: 'IT',
      amount: '$1,200',
      status: 'Critical',
    },
    {
      time: '11:00',
      event: 'Batch Process',
      request_id: '-',
      user: 'System',
      department: 'All',
      amount: '-',
      status: 'Completed',
    },
    {
      time: '10:45',
      event: 'Budget Alert',
      request_id: 'PR-899',
      user: 'Finance',
      department: 'Marketing',
      amount: '$12k',
      status: 'Flagged',
    },
    {
      time: '09:00',
      event: 'New Vendor',
      request_id: '-',
      user: 'Officer',
      department: 'Procurement',
      amount: '-',
      status: 'Completed',
    },
  ]);

  // --- Actions ---
  const handleNewRequest = () => {
    // Mock Add
    const newReq = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      event: 'New User Request',
      request_id: `PR-${903 + requestRows.length}`,
      user: 'You',
      department: 'General',
      amount: '$0',
      status: 'Pending',
    };
    setRequestRows([newReq, ...requestRows]);
    // Ideally open a modal here
  };

  const handleImport = () => {
    // Mock Import
    alert('Import functionality would open a file picker here.');
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- Derived Data ---
  const filteredData = useMemo(() => {
    let data = [...requestRows];

    // Filter
    if (filterText) {
      const lower = filterText.toLowerCase();
      data = data.filter(
        (r) =>
          r.event.toLowerCase().includes(lower) ||
          r.request_id.toLowerCase().includes(lower) ||
          r.user.toLowerCase().includes(lower) ||
          r.department.toLowerCase().includes(lower),
      );
    }
    if (statusFilter !== 'All') {
      data = data.filter((r) => r.status === statusFilter);
    }

    // Sort
    if (sortConfig) {
      data.sort((a: Record<string, string>, b: Record<string, string>) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [requestRows, filterText, statusFilter, sortConfig]);

  const tableColumns = [
    { header: 'Time', accessor: 'time' },
    { header: 'Event', accessor: 'event' },
    { header: 'Request ID', accessor: 'request_id' },
    { header: 'User', accessor: 'user' },
    { header: 'Department', accessor: 'department' },
    { header: 'Amount', accessor: 'amount' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            val === 'Critical' || val === 'Flagged'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : val === 'Approved' || val === 'Completed'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
          }`}
        >
          {val}
        </span>
      ),
    },
  ];

  const kpis = [
    {
      title: 'Requests Today',
      value: '24',
      trend: 'Normal Volume',
      trendDirection: 'neutral',
      icon: <Calendar size={20} />,
      color: 'blue',
    },
    {
      title: 'Active Requests',
      value: '142',
      trend: '+5 from yesterday',
      trendDirection: 'up',
      icon: <Activity size={20} />,
      color: 'indigo',
    },
    {
      title: 'Approvals Today',
      value: '18',
      trend: 'Processing',
      trendDirection: 'up',
      icon: <CheckCircle size={20} />,
      color: 'green',
    },
    {
      title: 'Spend Committed',
      value: '$45.2k',
      trend: 'Today',
      trendDirection: 'neutral',
      icon: <DollarSign size={20} />,
      color: 'purple',
    },
    {
      title: 'Overdue Requests',
      value: '12',
      trend: '+2 vs avg',
      trendDirection: 'down',
      icon: <Clock size={20} />,
      color: 'orange',
    },
    {
      title: 'Critical Alerts',
      value: '3',
      trend: 'Action Required',
      trendDirection: 'down',
      icon: <AlertCircle size={20} />,
      color: 'red',
    },
    {
      title: 'Avg Cycle Time',
      value: '3.5 Days',
      trend: '-0.5 days',
      trendDirection: 'up',
      icon: <Activity size={20} />,
      color: 'teal',
    },
    {
      title: 'SLA Compliance',
      value: '98.5%',
      trend: 'Target Met',
      trendDirection: 'up',
      icon: <CheckCircle size={20} />,
      color: 'green',
    },
  ];

  const requestsByStatus = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Draft', 'Pending', 'In Review', 'Approved', 'Rejected'] },
    yAxis: { type: 'value' },
    series: [{ name: 'Requests', type: 'bar', data: [5, 42, 28, 65, 2], itemStyle: { color: '#3b82f6' } }],
  };

  const requestsHourly = {
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['8am', '10am', '12pm', '2pm', '4pm', '6pm'] },
    yAxis: { type: 'value' },
    series: [
      { name: 'Incoming', type: 'line', data: [5, 12, 25, 18, 10, 4], smooth: true, itemStyle: { color: '#8b5cf6' } },
      { name: 'Processed', type: 'line', data: [2, 8, 20, 15, 8, 3], smooth: true, itemStyle: { color: '#10b981' } },
    ],
  };

  const departmentActivity = {
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
        name: 'Dept Activity',
        type: 'pie',
        selectedMode: 'multiple',
        radius: '65%',
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: 35, name: 'Operations' },
          { value: 25, name: 'IT' },
          { value: 20, name: 'Marketing' },
          { value: 15, name: 'HR' },
          { value: 5, name: 'Admin' },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Daily Requests Control</h1>
      <p className="text-gray-500 text-sm mb-6">
        Always-on executive snapshot of requests, approvals, spend and alerts.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 h-full">
          <DashboardChart title="Hourly Activity" options={requestsHourly} height="100%" />
        </div>
        <div className="h-full">
          <DashboardChart title="Requests by Status" options={requestsByStatus} height="100%" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="h-full">
          <DashboardChart title="Department Activity" options={departmentActivity} height="100%" />
        </div>
        <div className="lg:col-span-2 h-full bg-white dark:bg-monday-dark-surface rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Live Activity Log</h3>

            {/* Toolbar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative group flex-1 sm:flex-none">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500"
                />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-stone-900/50 border-none rounded-md outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-40 transition-all font-sans text-stone-800 dark:text-stone-200"
                />
              </div>

              {/* Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-stone-900/50 rounded-md border-none outline-none focus:ring-1 focus:ring-blue-500 text-stone-700 dark:text-stone-300 font-medium cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Critical">Critical</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>

              <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

              {/* Action Buttons */}
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-sm"
              >
                <Upload size={12} />
                Import
              </button>
              <button
                onClick={handleNewRequest}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
              >
                <Plus size={12} />
                New
              </button>
            </div>
          </div>

          <SimpleSortableTable columns={tableColumns} data={filteredData} onSort={handleSort} sortConfig={sortConfig} />
        </div>
      </div>

      <div className="flex-1 min-h-[50px] mb-20"></div>
    </div>
  );
};

export default DailyRequestsControl;
