import React from "react";
import { StatCard } from "../../../components/dashboard/StatCard";
import { DashboardChart } from "../../../components/dashboard/DashboardChart";
import { DashboardTable } from "../../../components/dashboard/DashboardTable";
import { CheckCircle, Clock, Users, WarningCircle as AlertCircle, Warning as AlertTriangle, FastForward } from 'phosphor-react';

export const ApprovalsFlowDashboard: React.FC = () => {
    // R05: Approvals Flow & SLA
    const kpis = [
        { title: "Pending Approvals", value: "32", trend: "High load", trendDirection: "up", icon: <Clock size={20} />, color: "orange" },
        { title: "Avg Time", value: "1.2 Days", trend: "Within SLA", trendDirection: "neutral", icon: <CheckCircle size={20} />, color: "green" },
        { title: "SLA Compliance", value: "96.5%", trend: "Target: 98%", trendDirection: "down", icon: <CheckCircle size={20} />, color: "teal" },
        { title: "SLA Breaches", value: "4", trend: "Action Required", trendDirection: "down", icon: <AlertTriangle size={20} />, color: "red" },
        { title: "Top Bottleneck", value: "Finance", trend: "15 pend.", trendDirection: "down", icon: <AlertCircle size={20} />, color: "purple" },
        { title: "Max Delay", value: "4 Days", trend: "Dept Head", trendDirection: "down", icon: <Clock size={20} />, color: "red" },
        { title: "Escalations", value: "2", trend: "This week", trendDirection: "neutral", icon: <AlertCircle size={20} />, color: "orange" },
        { title: "Fastest Stage", value: "Manager", trend: "0.2 Days", trendDirection: "up", icon: <FastForward size={20} />, color: "blue" },
    ];

    const pendingByStage = {
        title: { text: '' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Line Manager', 'Dept Head', 'Finance', 'Director', 'VP'] },
        yAxis: { type: 'value' },
        series: [{ name: 'Pending', data: [5, 8, 15, 3, 1], type: 'bar', color: '#3b82f6' }]
    };

    const approvalTimeByStage = {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Line Manager', 'Dept Head', 'Finance', 'Director'] },
        yAxis: { type: 'value', name: 'Avg Hours' },
        series: [
            { name: 'Avg Time', type: 'line', data: [4, 12, 36, 24], smooth: true, itemStyle: { color: '#3b82f6' } }
        ]
    };

    const tableColumns = [
        { header: "Request ID", accessor: "request_id" },
        { header: "Department", accessor: "department" },
        { header: "Stage", accessor: "approval_stage" },
        { header: "Status", accessor: "approval_status" },
        { header: "Approver", accessor: "approver" },
        { header: "Created Date", accessor: "created_date" },
        { header: "Time Pending", accessor: "approval_time_days" },
        {
            header: "SLA", accessor: "sla_status", render: (val: string) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'Breached' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{val}</span>
            )
        }
    ];

    const tableData = [
        { request_id: "PR-8821", department: "Ops", approval_stage: "Finance", approval_status: "Pending", approver: "CFO", created_date: "2024-12-15", approval_time_days: "3.5", sla_status: "Breached" },
        { request_id: "PR-8824", department: "IT", approval_stage: "Dept Head", approval_status: "Pending", approver: "IT Director", created_date: "2024-12-18", approval_time_days: "0.5", sla_status: "On Track" },
        { request_id: "PR-8829", department: "Marketing", approval_stage: "Final Auth", approval_status: "Pending", approver: "CEO", created_date: "2024-12-17", approval_time_days: "1.2", sla_status: "On Track" },
        { request_id: "PR-8830", department: "Admin", approval_stage: "Finance", approval_status: "Pending", approver: "Controller", created_date: "2024-12-16", approval_time_days: "2.1", sla_status: "Warning" },
        { request_id: "PR-8835", department: "HR", approval_stage: "Line Manager", approval_status: "Pending", approver: "HR Mgr", created_date: "2024-12-18", approval_time_days: "0.1", sla_status: "On Track" },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-monday-dark-bg p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Approvals Flow & SLA</h1>
            <p className="text-gray-500 text-sm mb-6">Approval bottlenecks and SLA compliance by stage.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpis.map((kpi, idx) => <StatCard key={idx} {...kpi} trendDirection={kpi.trendDirection as any} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
                <div className="lg:col-span-2 h-full"><DashboardChart title="Pending by Stage" options={pendingByStage} height="100%" /></div>
                <div className="h-full"><DashboardChart title="Avg Approval Time (Hours)" options={approvalTimeByStage} height="100%" /></div>
            </div>

            <div className="flex-1 min-h-[300px] mb-20">
                <DashboardTable title="Approval Queue" columns={tableColumns} data={tableData} />
            </div>
        </div>
    );
};

export default ApprovalsFlowDashboard;
