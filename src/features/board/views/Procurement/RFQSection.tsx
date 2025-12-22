
import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    Inbox,
    CalendarCheck,
    Clock,
    AlertCircle,
    Edit2,
    Trash2,
    FileText,
    Send,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    ArrowUpDown
} from 'lucide-react';
import { procurementService } from '../../../../services/procurementService';

const CHART_OPTION = {
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '12%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: ['Open', 'In Review', 'Done', 'Overdue'],
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } }
    },
    series: [{
        name: 'RFQs',
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (params: any) => {
                const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];
                return colors[params.dataIndex];
            }
        },
        data: [0, 0, 0, 0]
    }]
};

interface RFQSectionProps {
    rfqs: any[];
}

export const RFQSection: React.FC<RFQSectionProps> = ({ rfqs }) => {
    const kpis = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        const openRfqs = rfqs.filter(r => r.status === 'Open' || r.status === 'In Review').length;
        const doneToday = rfqs.filter(r => r.status === 'Done' && r.completedDate === today).length;

        const pendingRfqs = rfqs.filter(r => r.status !== 'Done');
        const avgDaysOpen = pendingRfqs.length > 0
            ? Math.round(pendingRfqs.reduce((acc, current) => {
                const created = new Date(current.createdDate).getTime();
                const now = new Date().getTime();
                return acc + (now - created) / (1000 * 60 * 60 * 24);
            }, 0) / pendingRfqs.length)
            : 0;

        const overdueRfqs = rfqs.filter(r => {
            const dueDate = new Date(r.dueDate).getTime();
            const now = new Date().getTime();
            return dueDate < now && r.status !== 'Done';
        }).length;

        return [
            { title: "RFQs Open", value: openRfqs, icon: Inbox, color: "blue", trend: "0%", trendUp: true, description: "Active RFQs" },
            { title: "RFQs Done Today", value: doneToday, icon: CalendarCheck, color: "green", trend: "0%", trendUp: true, description: "Completed" },
            { title: "Avg Days Open", value: avgDaysOpen, icon: Clock, color: "purple", trend: "0%", trendUp: false, description: "Cycle Time" },
            { title: "Overdue RFQs", value: overdueRfqs, icon: AlertCircle, color: "red", trend: "0%", trendUp: true, description: "Critical Action" }
        ];
    }, [rfqs]);

    const chartData = useMemo(() => {
        const counts = {
            'Open': rfqs.filter(r => r.status === 'Open').length,
            'In Review': rfqs.filter(r => r.status === 'In Review').length,
            'Done': rfqs.filter(r => r.status === 'Done').length,
            'Overdue': rfqs.filter(r => {
                const dueDate = new Date(r.dueDate).getTime();
                const now = new Date().getTime();
                return dueDate < now && r.status !== 'Done';
            }).length
        };

        return {
            ...CHART_OPTION,
            series: [{
                ...CHART_OPTION.series[0],
                data: [counts['Open'], counts['In Review'], counts['Done'], counts['Overdue']]
            }]
        };
    }, [rfqs]);

    return (
        <div className="space-y-6 mt-10 border-t border-gray-200 dark:border-gray-800 pt-10">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">RFQ Management</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and manage requests for quotations</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
                {kpis.map((kpi, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                <kpi.icon className="text-gray-500 dark:text-gray-400" size={18} />
                            </div>
                            <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${kpi.trendUp
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                }`}>
                                {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {kpi.trend}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-1">{kpi.value}</h3>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{kpi.title}</p>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{kpi.description}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">RFQs by Status</h3>
                <div className="h-[300px]">
                    <ReactECharts option={chartData} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">RFQ Table</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search RFQs..."
                                className="pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 outline-none w-48"
                            />
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <Filter size={14} />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/40 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                                <th className="px-5 py-3">Quotation ID</th>
                                <th className="px-5 py-3">Request ID</th>
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3">Department</th>
                                <th className="px-5 py-3">Supplier</th>
                                <th className="px-5 py-3">Value</th>
                                <th className="px-5 py-3">Due Date</th>
                                <th className="px-5 py-3">RFQ Status</th>
                                <th className="px-5 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rfqs.map((rfq, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-xs text-gray-700 dark:text-gray-300">
                                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{rfq.id}</td>
                                    <td className="px-5 py-3 italic text-gray-500">{rfq.requestId}</td>
                                    <td className="px-5 py-3">{rfq.date}</td>
                                    <td className="px-5 py-3">{rfq.department}</td>
                                    <td className="px-5 py-3 font-medium">{rfq.supplier}</td>
                                    <td className="px-5 py-3">${rfq.value?.toLocaleString()}</td>
                                    <td className="px-5 py-3">{rfq.dueDate}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${rfq.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                            rfq.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400' :
                                                rfq.status === 'In Review' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400' :
                                                    'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400'
                                            }`}>
                                            {rfq.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-500" title="Edit">
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-gray-500 hover:text-red-600" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                            <button className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-gray-500 hover:text-blue-600" title="Send to PO">
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
