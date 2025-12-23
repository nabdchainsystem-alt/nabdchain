
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
    ArrowUpDown,
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { procurementService } from '../../../../services/procurementService';

const getScratchStyle = (isDeleted?: boolean): React.CSSProperties | undefined =>
    isDeleted ? {
        textDecoration: 'line-through',
        textDecorationThickness: '4px',
        textDecorationColor: '#e11d48'
    } : undefined;

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
        data: ['Open', 'Sent to PO', 'Overdue (>3d)', 'Canceled'],
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
            color: '#3b82f6'
        },
        data: [0, 0, 0, 0]
    }]
};

interface RFQSectionProps {
    rfqs: any[];
    onDeleteRfq?: (id: string) => void;
    onSendToOrder?: (rfq: any) => void;
}

export const RFQSection: React.FC<RFQSectionProps> = ({ rfqs, onDeleteRfq, onSendToOrder }) => {
    const [rfqRowsPerPage, setRfqRowsPerPage] = useState(10);
    const [rfqPage, setRfqPage] = useState(1);
    const [rfqSearch, setRfqSearch] = useState('');
    const [rfqStatusFilter, setRfqStatusFilter] = useState('All');
    const [rfqFilterOpen, setRfqFilterOpen] = useState(false);

    useEffect(() => {
        setRfqPage(1);
    }, [rfqRowsPerPage, rfqs.length, rfqSearch, rfqStatusFilter]);

    const kpis = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const now = Date.now();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

        const stats = rfqs.reduce(
            (acc, rfq) => {
                const status = rfq.status || 'Open';
                const created = rfq.createdDate ? new Date(rfq.createdDate).getTime() : (rfq.date ? new Date(rfq.date).getTime() : now);
                const isCanceled = ['Canceled', 'Cancelled', 'Void'].includes(status);
                const isSentToPO = ['Done', 'Sent', 'Sent to PO', 'Approved', 'Closed', 'Received'].includes(status);
                const isOverdue = !isSentToPO && !isCanceled && created < (now - threeDaysMs);

                if (isCanceled) acc.canceled += 1;
                else if (isSentToPO) acc.sent += 1;
                else if (isOverdue) acc.overdue += 1;
                else acc.open += 1;

                if (!isSentToPO && !isCanceled) {
                    acc.pendingForAvg.push(created);
                }

                if (status === 'Done' && rfq.completedDate === today) {
                    acc.doneToday += 1;
                }

                return acc;
            },
            { open: 0, sent: 0, overdue: 0, canceled: 0, doneToday: 0, pendingForAvg: [] as number[] }
        );

        const avgDaysOpen = stats.pendingForAvg.length > 0
            ? Math.round(stats.pendingForAvg.reduce((acc, created) => acc + (now - created) / (1000 * 60 * 60 * 24), 0) / stats.pendingForAvg.length)
            : 0;

        return [
            { title: "RFQs Open", value: stats.open, icon: Inbox, color: "blue", trend: "0%", trendUp: true, description: "Active RFQs" },
            { title: "RFQs Done Today", value: stats.doneToday, icon: CalendarCheck, color: "green", trend: "0%", trendUp: true, description: "Completed" },
            { title: "Avg Days Open", value: avgDaysOpen, icon: Clock, color: "purple", trend: "0%", trendUp: false, description: "Cycle Time" },
            { title: "Overdue RFQs", value: stats.overdue, icon: AlertCircle, color: "red", trend: "0%", trendUp: true, description: "Critical Action" }
        ];
    }, [rfqs]);

    const chartData = useMemo(() => {
        const now = Date.now();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

        const counts = rfqs.reduce(
            (acc, rfq) => {
                const status = rfq.status || 'Open';
                const created = rfq.createdDate ? new Date(rfq.createdDate).getTime() : (rfq.date ? new Date(rfq.date).getTime() : now);
                const isCanceled = ['Canceled', 'Cancelled', 'Void'].includes(status);
                const isSentToPO = ['Done', 'Sent', 'Sent to PO', 'Approved', 'Closed'].includes(status);
                const isOverdue = !isSentToPO && !isCanceled && created < (now - threeDaysMs);

                if (isCanceled) acc.canceled += 1;
                else if (isSentToPO) acc.sent += 1;
                else if (isOverdue) acc.overdue += 1;
                else acc.open += 1;

                return acc;
            },
            { open: 0, sent: 0, overdue: 0, canceled: 0 }
        );

        return {
            ...CHART_OPTION,
            series: [{
                ...CHART_OPTION.series[0],
                data: [counts.open, counts.sent, counts.overdue, counts.canceled]
            }]
        };
    }, [rfqs]);

    const rfqStatusOptions = useMemo(() => {
        const statuses = Array.from(new Set(rfqs.map(r => r.status || ''))).filter(Boolean);
        return statuses;
    }, [rfqs]);

    const filteredRfqs = useMemo(() => {
        return rfqs.filter(r => {
            const matchesSearch = rfqSearch.trim().length === 0 ||
                r.id?.toLowerCase().includes(rfqSearch.toLowerCase()) ||
                r.supplier?.toLowerCase().includes(rfqSearch.toLowerCase()) ||
                r.requestId?.toLowerCase().includes(rfqSearch.toLowerCase());

            const matchesStatus = rfqStatusFilter === 'All' || r.status === rfqStatusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [rfqs, rfqSearch, rfqStatusFilter]);

    const rfqTotalPages = Math.max(1, Math.ceil((filteredRfqs.length || 1) / rfqRowsPerPage));
    const rfqPageSafe = Math.min(rfqPage, rfqTotalPages);
    const rfqStart = (rfqPageSafe - 1) * rfqRowsPerPage;
    const rfqEnd = Math.min(rfqStart + rfqRowsPerPage, filteredRfqs.length);
    const paginatedRfqs = filteredRfqs.slice(rfqStart, rfqEnd);

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
                    <div className="flex items-center gap-3 relative">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={rfqSearch}
                                onChange={(e) => setRfqSearch(e.target.value)}
                                placeholder="Search RFQs..."
                                className="pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 outline-none w-48"
                            />
                        </div>
                        <div className="relative">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                onClick={() => setRfqFilterOpen(prev => !prev)}
                            >
                                <Filter size={14} />
                                Filter
                            </button>
                            {rfqFilterOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 space-y-2 z-20">
                                    <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</label>
                                    <select
                                        value={rfqStatusFilter}
                                        onChange={(e) => setRfqStatusFilter(e.target.value)}
                                        className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    >
                                        <option value="All">All</option>
                                        {rfqStatusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="w-full text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1"
                                        onClick={() => { setRfqStatusFilter('All'); setRfqSearch(''); }}
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                            {paginatedRfqs.map((rfq, idx) => {
                                const alreadySentToOrder = Boolean(rfq.sentToOrder || rfq.orderId);
                                const isDeleted = !!rfq.isDeleted;
                                const sendLabel = isDeleted ? 'Marked as deleted' : alreadySentToOrder ? 'Already sent to Order' : 'Send to Order';
                                const disableSend = isDeleted || alreadySentToOrder || !onSendToOrder;

                                return (
                                    <tr
                                        key={idx}
                                        style={getScratchStyle(isDeleted)}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-xs text-gray-700 dark:text-gray-300 ${isDeleted ? 'opacity-60' : ''}`}
                                    >
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{rfq.id}</td>
                                        <td className="px-5 py-3 italic text-gray-500">{rfq.requestId}</td>
                                        <td className="px-5 py-3">{rfq.date}</td>
                                        <td className="px-5 py-3">{rfq.department}</td>
                                        <td className="px-5 py-3 font-medium">{rfq.supplier}</td>
                                        <td className="px-5 py-3">SAR {rfq.value?.toLocaleString()}</td>
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
                                                <button
                                                    disabled={isDeleted}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => !isDeleted && onDeleteRfq?.(rfq.id)}
                                                    disabled={isDeleted}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-gray-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => !disableSend && onSendToOrder?.(rfq)}
                                                    disabled={disableSend}
                                                    className={`p-1.5 rounded transition-colors ${disableSend
                                                        ? 'text-gray-400 cursor-not-allowed opacity-60'
                                                        : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 hover:text-blue-600'
                                                        }`}
                                                    title={sendLabel}
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20 rounded-b-lg">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            value={rfqRowsPerPage}
                            onChange={(e) => {
                                setRfqRowsPerPage(Number(e.target.value));
                                setRfqPage(1);
                            }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="ml-2">{rfqs.length === 0 ? '0-0 of 0' : `${rfqStart + 1}-${rfqEnd} of ${rfqs.length}`}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                            disabled={rfqPageSafe === 1}
                            onClick={() => setRfqPage(1)}
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                            disabled={rfqPageSafe === 1}
                            onClick={() => setRfqPage(prev => Math.max(1, prev - 1))}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                            disabled={rfqPageSafe >= rfqTotalPages}
                            onClick={() => setRfqPage(prev => Math.min(rfqTotalPages, prev + 1))}
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                            disabled={rfqPageSafe >= rfqTotalPages}
                            onClick={() => setRfqPage(rfqTotalPages)}
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
