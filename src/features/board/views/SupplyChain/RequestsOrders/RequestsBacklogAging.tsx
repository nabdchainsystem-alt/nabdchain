import React from "react";
import { StatCard } from "../../../components/dashboard/StatCard";
import { DashboardChart } from "../../../components/dashboard/DashboardChart";
import { DashboardTable } from "../../../components/dashboard/DashboardTable";
import { WarningCircle as AlertCircle, Clock, List, Warning as AlertTriangle, Stack as Layers, ArrowUpRight } from 'phosphor-react';

export const RequestsBacklogAging: React.FC = () => {
    // R02: Requests Backlog & Aging
    const kpis = [
        { title: "Backlog Total", value: "215", trend: "+12 vs last week", trendDirection: "down", icon: <List size={20} />, color: "blue" },
        { title: "Backlog > 7d", value: "45", trend: "Growing", trendDirection: "down", icon: <Clock size={20} />, color: "yellow" },
        { title: "Backlog > 14d", value: "18", trend: "Stable", trendDirection: "neutral", icon: <Clock size={20} />, color: "orange" },
        { title: "Backlog > 30d", value: "6", trend: "-2 items", trendDirection: "up", icon: <AlertTriangle size={20} />, color: "red" },
        { title: "Avg Aging Days", value: "6.2", trend: "Increasing", trendDirection: "down", icon: <Clock size={20} />, color: "gray" },
        { title: "Bottleneck Stage", value: "Finance Approval", trend: "15 items stuck", trendDirection: "down", icon: <Layers size={20} />, color: "purple" },
        { title: "Blocked Requests", value: "8", trend: "Information Missing", trendDirection: "neutral", icon: <AlertCircle size={20} />, color: "red" },
        { title: "Reopened", value: "3", trend: "this week", trendDirection: "neutral", icon: <ArrowUpRight size={20} />, color: "blue" },
    ];

    const agingBuckets = {
        title: { text: '' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['0-3 Days', '4-7 Days', '8-14 Days', '15-30 Days', '>30 Days'] },
        yAxis: { type: 'value' },
        series: [
            { name: 'Requests', type: 'bar', data: [110, 35, 45, 18, 6], itemStyle: { color: '#3b82f6' } }
        ]
    };

    const backlogTrend = {
        title: { text: '' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        yAxis: { type: 'value' },
        series: [
            { name: 'Total Backlog', type: 'line', data: [180, 185, 190, 205, 210, 215, 215], smooth: true, itemStyle: { color: '#ef4444' }, areaStyle: { opacity: 0.1 } }
        ]
    };

    const blockedByReason = {
        tooltip: { trigger: 'item', formatter: '{b}  {c}' },
        legend: { orient: 'horizontal', bottom: 0, left: 'center', itemWidth: 6, itemHeight: 6, itemGap: 4, textStyle: { fontSize: 8 }, selectedMode: 'multiple' },
        series: [
            {
                name: 'Block Reason',
                type: 'pie',
                selectedMode: 'multiple',
                radius: '65%',
                center: ['50%', '45%'],
                itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
                label: { show: false },
                emphasis: { label: { show: false } },
                data: [
                    { value: 40, name: 'Missing Info' },
                    { value: 30, name: 'Budget Hold' },
                    { value: 20, name: 'Vendor Selection' },
                    { value: 10, name: 'Policy Check' }
                ]
            }
        ]
    };

    const tableColumns = [
        { header: "Request ID", accessor: "request_id" },
        { header: "Department", accessor: "department" },
        { header: "Priority", accessor: "priority" },
        { header: "Created Date", accessor: "created_date" },
        { header: "Due Date", accessor: "due_date" },
        { header: "Aging (Days)", accessor: "aging_days" },
        { header: "Owner", accessor: "owner" },
        {
            header: "Status", accessor: "status", render: (val: string) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'Critical' ? 'bg-red-100 text-red-700' :
                    val === 'Stuck' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {val}
                </span>
            )
        }
    ];

    const tableData = [
        { request_id: "PR-850", department: "Ops", priority: "High", created_date: "2024-11-15", due_date: "2024-11-20", aging_days: "33", owner: "John Doe", status: "Stuck" },
        { request_id: "PR-882", department: "IT", priority: "Medium", created_date: "2024-12-01", due_date: "2024-12-05", aging_days: "17", owner: "Jane Smith", status: "Overdue" },
        { request_id: "PR-890", department: "Marketing", priority: "Low", created_date: "2024-12-10", due_date: "2024-12-25", aging_days: "8", owner: "Mike Ross", status: "Pending" },
        { request_id: "PR-895", department: "HR", priority: "High", created_date: "2024-12-14", due_date: "2024-12-18", aging_days: "4", owner: "Sarah Connor", status: "Active" },
        { request_id: "PR-899", department: "Admin", priority: "Critical", created_date: "2024-12-17", due_date: "2024-12-17", aging_days: "1", owner: "Bruce Wayne", status: "Critical" },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Requests Backlog & Aging</h1>
            <p className="text-gray-500 text-sm mb-6">Backlog health, aging buckets, and bottlenecks.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, idx) => <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as any} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
                <div className="lg:col-span-2 h-full"><DashboardChart title="Aging Buckets" options={agingBuckets} height="100%" /></div>
                <div className="h-full"><DashboardChart title="Blocked Orders by Reason" options={blockedByReason} height="100%" /></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
                <div className="h-full"><DashboardChart title="Backlog Trend (7 Days)" options={backlogTrend} height="100%" /></div>
                <div className="lg:col-span-2 h-full bg-white dark:bg-monday-dark-surface rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <DashboardTable title="Backlog List" columns={tableColumns} data={tableData} />
                </div>
            </div>

            <div className="flex-1 min-h-[50px] mb-20"></div>
        </div>
    );
};

export default RequestsBacklogAging;
