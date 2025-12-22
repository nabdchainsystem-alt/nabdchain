
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    Files,
    Inbox,
    CalendarClock,
    Zap,
    Check,
    X,
    PauseCircle,
    Send,
    Trash2,
    Calendar,
    Building2,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    Upload,
    Plus,
    Filter,
    ArrowUpDown,
    FileText
} from 'lucide-react';
import { NewRequestModal } from './NewRequestModal';
import { procurementService } from '../../../../services/procurementService';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { RFQSection } from './RFQSection';
import { NewRFQModal } from './NewRFQModal';

// --- Empty / Initial State Data ---

const KPI_DATA = [
    {
        title: "Total Requests",
        value: "0",
        trend: "0%",
        trendUp: true,
        icon: Files,
        description: "Year to Date"
    },
    {
        title: "Open Requests",
        value: "0",
        trend: "0%",
        trendUp: true,
        icon: Inbox,
        description: "Pending Action"
    },
    {
        title: "Today's Requests",
        value: "0",
        trend: "0%",
        trendUp: true,
        icon: CalendarClock,
        description: "New Incoming"
    },
    {
        title: "Urgent Requests",
        value: "0",
        trend: "0%",
        trendUp: true,
        icon: Zap,
        isUrgent: true,
        description: "Needs Attention"
    }
];

const CHART_OPTION = {
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#111827', fontSize: 12 },
        padding: [8, 12],
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);'
    },
    grid: {
        left: '1%',
        right: '1%',
        bottom: '3%',
        top: '12%',
        containLabel: true
    },
    xAxis: [
        {
            type: 'category',
            data: [],
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#6b7280', fontSize: 11, margin: 12 }
        }
    ],
    yAxis: [
        {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
            axisLabel: { color: '#6b7280', fontSize: 11 }
        }
    ],
    series: [
        {
            name: 'Requests',
            type: 'bar',
            barWidth: '24px',
            data: [],
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: '#3b82f6' },
                        { offset: 1, color: '#2563eb' }
                    ]
                },
                borderRadius: [4, 4, 0, 0]
            },
            emphasis: {
                itemStyle: { color: '#1d4ed8' }
            }
        }
    ]
};

// Empty table data as requested
// ... (We will keep imports, but replace the component logic)

interface ProcurementOverviewProps {
    tasks?: any[];
    onUpdateTasks?: (tasks: any[]) => void;
}

export const ProcurementOverview: React.FC<ProcurementOverviewProps> = ({ tasks: externalTasks, onUpdateTasks }) => {
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
    const [selectedRequestForRFQ, setSelectedRequestForRFQ] = useState<any>(null);
    const [rfqs, setRfqs] = useState<any[]>([]);
    const [loadingRfqs, setLoadingRfqs] = useState(false);

    // State for Table Data
    const [tableData, setTableData] = useState<any[]>([]);

    // Sync external tasks to internal table data
    useEffect(() => {
        if (externalTasks) {
            setTableData([...externalTasks].reverse());
        } else {
            loadData();
        }
        loadRfqs();
    }, [externalTasks]);

    const loadRfqs = async () => {
        setLoadingRfqs(true);
        try {
            const data = await procurementService.getAllRfqs();
            setRfqs(data.reverse()); // Show most recent first
        } catch (error) {
            console.error("Failed to load RFQs", error);
        } finally {
            setLoadingRfqs(false);
        }
    };

    const loadData = async () => {
        try {
            const data = await procurementService.getAllRequests();
            setTableData(data.reverse()); // Most recent first
        } catch (error) {
            console.error("Failed to load requests", error);
        }
    };

    const handleCreateRequest = async (data: any) => {
        // Map modal data to board task structure
        const newTask = {
            id: data.id || Date.now().toString(),
            name: data.id, // Using ID as name if name is missing, or just name
            date: data.date,
            department: data.department,
            warehouse: data.warehouse,
            relatedTo: data.relatedTo,
            status: "Pending",
            priority: data.status,
            isUrgent: data.status === 'Urgent',
            items: data.items
        };

        const updatedRows = [newTask, ...tableData];
        // Note: tableData is reversed tasks, so [newTask, ...tableData] adds to the top of the UI list

        if (onUpdateTasks) {
            // Need to reverse back if sending to parent which expects original order, 
            // or just append to externalTasks if it exists.
            onUpdateTasks([newTask, ...(externalTasks || [])]);
        } else {
            setTableData(updatedRows);
            try {
                await procurementService.createRequest(newTask);
            } catch (error) {
                console.error("Local save failed", error);
            }
        }
        setIsNewRequestOpen(false);
    };
    const handleDeleteRequest = async (id: string) => {
        setDeleteConfirmId(id);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        const id = deleteConfirmId;

        if (onUpdateTasks) {
            // Update parent state (BoardView -> ProcurementPage)
            const updatedRows = (externalTasks || []).filter(r => r.id !== id);
            onUpdateTasks(updatedRows);
        } else {
            // Update local state and API
            setTableData(prev => prev.filter(r => r.id !== id));
            try {
                await procurementService.deleteRequest(id);
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
        setDeleteConfirmId(null);
    };

    const handleOpenRFQModal = (request: any) => {
        setSelectedRequestForRFQ(request);
        setIsRFQModalOpen(true);
    };

    const handleCreateRFQ = async (rfq: any) => {
        setIsRFQModalOpen(false); // Close immediately for reactivity

        // Optimistic update
        const optimisticId = `RFQ-OPT-${Date.now()}`;
        const optimisticRfq = { ...rfq, id: optimisticId, isOptimistic: true };
        setRfqs(prev => [optimisticRfq, ...prev]);

        try {
            const created = await procurementService.createRfq(rfq);
            // Replace optimistic with real data
            setRfqs(prev => prev.map(r => r.id === optimisticId ? created : r));
        } catch (error) {
            console.error("Failed to create RFQ on server", error);
            // Fallback: keep optimistic but mark as errored if we had that state, 
            // for now just keep it so the user sees something happened.
        }
    };

    // Calculate Dynamic KPIs
    const kpis = React.useMemo(() => {
        const total = tableData.length;
        const open = tableData.filter(r => r.status && !['Done', 'Closed', 'Approved'].includes(r.status)).length;

        const todayStr = new Date().toISOString().split('T')[0];
        const today = tableData.filter(r => r.date === todayStr || (r.createdAt && r.createdAt.startsWith(todayStr))).length;

        const urgent = tableData.filter(r => r.priority === 'Urgent' || r.isUrgent).length;

        return [
            {
                title: "Total Requests",
                value: total.toString(),
                trend: "+12%", // Mock trend for now
                trendUp: true,
                icon: Files,
                description: "Year to Date"
            },
            {
                title: "Open Requests",
                value: open.toString(),
                trend: "-5%",
                trendUp: false,
                icon: Inbox,
                description: "Pending Action"
            },
            {
                title: "Today's Requests",
                value: today.toString(),
                trend: "+8%",
                trendUp: true,
                icon: CalendarClock,
                description: "New Incoming"
            },
            {
                title: "Urgent Requests",
                value: urgent.toString(),
                trend: "+2%",
                trendUp: true,
                icon: Zap,
                isUrgent: true,
                description: "Needs Attention"
            }
        ];
    }, [tableData]);

    // Calculate Dynamic Chart Options
    const chartOption = React.useMemo(() => {
        const deptCounts: Record<string, number> = {};
        tableData.forEach(r => {
            const dept = r.department || 'Unassigned';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        const depts = Object.keys(deptCounts);
        const counts = Object.values(deptCounts);

        return {
            ...CHART_OPTION,
            xAxis: [
                {
                    ...CHART_OPTION.xAxis[0],
                    data: depts.length > 0 ? depts : ['No Data']
                }
            ],
            series: [
                {
                    ...CHART_OPTION.series[0],
                    data: counts.length > 0 ? counts : [0]
                }
            ]
        };
    }, [tableData]);

    return (
        <div className="w-full h-full p-5 pb-20 overflow-y-auto bg-[#f8f9fa] dark:bg-[#0f1115] space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            <NewRequestModal
                isOpen={isNewRequestOpen}
                onClose={() => setIsNewRequestOpen(false)}
                onSubmit={handleCreateRequest}
                existingTasks={tableData}
            />

            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Procurement Requests</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track your procurement requisitions</p>
            </div>

            {/* 1. KPIs Section */}
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

            {/* 2. Chart Section */}
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Department Request Volume</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Breakdown of procurement requests across departments</p>
                    </div>
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 transition-colors">
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                <div className="w-full -ml-2">
                    <ReactECharts
                        option={chartOption}
                        style={{ height: '300px', width: '100%' }}
                        theme={null}
                    />
                </div>
            </div>

            {/* 3. Requests Table */}
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm flex-1 flex flex-col">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#1a1d24] rounded-t-lg sticky top-0 z-10">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Requests Table</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage and process incoming requisitions</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search & Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Search size={14} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search requests..."
                                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-[#15171b] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none w-48"
                            />
                        </div>

                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <Filter size={14} />
                            Filter
                        </button>

                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        {/* Actions */}
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <Upload size={14} />
                            Import
                        </button>

                        <button
                            onClick={() => setIsNewRequestOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg shadow-sm hover:shadow transition-all active:scale-95"
                        >
                            <Plus size={14} />
                            New Request
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/40 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 whitespace-nowrap">
                                <th className="px-4 py-3 w-10 text-center">
                                    <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 group select-none">
                                    <div className="flex items-center gap-1">Request ID <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 group select-none">
                                    <div className="flex items-center gap-1">Date <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 group select-none">
                                    <div className="flex items-center gap-1">Department <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 group select-none">
                                    <div className="flex items-center gap-1">Warehouse <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th className="px-4 py-3">Related to</th>
                                <th className="px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 group select-none">
                                    <div className="flex items-center gap-1">Status <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 group select-none">
                                    <div className="flex items-center gap-1">Priority <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                </th>
                                <th className="px-4 py-3 text-center">Approval</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-xs text-center border-none">
                                        <div className="flex flex-col items-center gap-2">
                                            <Inbox size={24} className="opacity-20" />
                                            <span>No requests found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tableData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group text-xs text-gray-700 dark:text-gray-300">
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.id}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.date}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                <Building2 size={10} />
                                                {row.department}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{row.warehouse}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.relatedTo}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 text-[10px] font-medium uppercase tracking-wide">
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border ${row.priority === 'Urgent' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' :
                                                row.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30' :
                                                    row.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30' :
                                                        'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                                }`}>
                                                {row.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button className="p-1.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 rounded-lg transition-colors" title="Approve">
                                                    <Check size={14} />
                                                </button>
                                                <button className="p-1.5 hover:bg-amber-50 text-gray-400 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 rounded-lg transition-colors" title="Hold">
                                                    <PauseCircle size={14} />
                                                </button>
                                                <button className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-lg transition-colors" title="Reject">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleOpenRFQModal(row)}
                                                    className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors"
                                                    title="RFQ"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(row.id)}
                                                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20 rounded-b-lg">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="ml-2">0-0 of 0</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50" disabled>
                            <ChevronsLeft size={16} />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50" disabled>
                            <ChevronLeft size={16} />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50" disabled>
                            <ChevronRight size={16} />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50" disabled>
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={executeDelete}
                title="Delete Request"
                message="Are you sure you want to delete this procurement request? This action cannot be undone."
                confirmLabel="Delete Request"
                variant="danger"
            />

            <NewRFQModal
                isOpen={isRFQModalOpen}
                onClose={() => setIsRFQModalOpen(false)}
                onSubmit={handleCreateRFQ}
                requestData={selectedRequestForRFQ}
            />

            <RFQSection rfqs={rfqs} />
        </div>
    );
};
