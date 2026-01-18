
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {
    Files,
    Tray as Inbox,
    CalendarBlank as CalendarClock,
    Lightning as Zap,
    Check,
    X,
    PauseCircle,
    PaperPlaneTilt as Send,
    Trash as Trash2,
    CalendarBlank as Calendar,
    Buildings as Building2,
    DotsThree as MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    CaretLeft as ChevronLeft,
    CaretRight as ChevronRight,
    CaretDoubleLeft as ChevronsLeft,
    CaretDoubleRight as ChevronsRight,
    MagnifyingGlass as Search,
    Upload,
    Plus,
    Funnel as Filter,
    ArrowsDownUp as ArrowUpDown,
    FileText,
    CheckCircle,
    Warning as AlertTriangle,
    Bell,
    ArrowsOut,
    ArrowsIn,
    Info
} from 'phosphor-react';
import { NewRequestModal } from './NewRequestModal';
import { ProcurementInfo } from './ProcurementInfo';
import { procurementService } from '../../../../services/procurementService';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { RFQSection } from './RFQSection';
import { NewRFQModal } from './NewRFQModal';
import { appLogger } from '../../../../utils/logger';

// --- Empty / Initial State Data ---

const APPROVAL_THEMES: Record<string, { badge: string; border: string; rowBg: string }> = {
    Approved: {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/40',
        border: 'border-emerald-500',
        rowBg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5'
    },
    'On Hold': {
        badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/40',
        border: 'border-amber-400',
        rowBg: 'hover:bg-amber-50/40 dark:hover:bg-amber-500/5'
    },
    Rejected: {
        badge: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/40',
        border: 'border-rose-500',
        rowBg: 'hover:bg-rose-50/40 dark:hover:bg-rose-500/5'
    },
    Pending: {
        badge: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700',
        border: 'border-gray-200 dark:border-gray-700',
        rowBg: 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
    }
};
const ORDER_APPROVAL_THEMES = APPROVAL_THEMES;

const getScratchStyle = (isDeleted?: boolean): React.CSSProperties | undefined =>
    isDeleted ? {
        textDecoration: 'line-through',
        textDecorationThickness: '4px',
        textDecorationColor: '#e11d48'
    } : undefined;

const withRequestDefaults = (request: any) => ({
    ...request,
    approvalStatus: request.approvalStatus || 'Pending',
    rfqSent: !!request.rfqSent
});

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
                        { offset: 0, color: '#6366f1' },
                        { offset: 1, color: '#4f46e5' }
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

type CalendarViewMode = 'daily' | '5days' | 'weekly' | 'monthly' | 'yearly';

// Empty table data as requested
// ... (We will keep imports, but replace the component logic)

const RequestDetailsModal: React.FC<{ request: any | null; onClose: () => void }> = ({ request, onClose }) => {
    if (!request) return null;
    const items = Array.isArray(request.items) ? request.items : [];

    const meta = [
        { label: 'Status', value: request.status || 'Pending' },
        { label: 'Approval', value: request.approvalStatus || 'Pending' },
        { label: 'Priority', value: request.priority || 'Normal' },
        { label: 'Department', value: request.department || '-' },
        { label: 'Warehouse', value: request.warehouse || '-' },
        { label: 'Date', value: request.date || '-' },
        { label: 'Related To', value: request.relatedTo || '-' },
        { label: 'RFQ', value: request.rfqSent ? 'Sent' : 'Not sent' }
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-monday-dark-surface w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wide">Request</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">#{request.id}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {request.relatedTo || 'No reference provided'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        aria-label="Close request details"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {meta.map((entry) => (
                            <div
                                key={entry.label}
                                className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                            >
                                <p className="text-[11px] uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                                    {entry.label}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">
                                    {entry.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Items ({items.length})</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Each item in this request at a glance
                            </span>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/60 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-2">Item Code</th>
                                        <th className="px-4 py-2">Description</th>
                                        <th className="px-4 py-2">Quantity</th>
                                        <th className="px-4 py-2">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm"
                                            >
                                                No items captured for this request.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item: any) => (
                                            <tr key={item.id || item.itemCode}>
                                                <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">{item.itemCode || '-'}</td>
                                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.description || '-'}</td>
                                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.quantity ?? '-'}</td>
                                                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                                    {item.dueDate || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProcurementOverview: React.FC = () => {
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [selectedRequestDetails, setSelectedRequestDetails] = useState<any | null>(null);
    const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
    const [selectedRequestForRFQ, setSelectedRequestForRFQ] = useState<any>(null);
    const [rfqs, setRfqs] = useState<any[]>([]);
    const [loadingRfqs, setLoadingRfqs] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [ordersRowsPerPage, setOrdersRowsPerPage] = useState(10);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersSearch, setOrdersSearch] = useState('');
    const [ordersStatusFilter, setOrdersStatusFilter] = useState('All');
    const [ordersPriorityFilter, setOrdersPriorityFilter] = useState('All');
    const [ordersFilterOpen, setOrdersFilterOpen] = useState(false);
    const [kpiMode, setKpiMode] = useState<'total' | 'urgent' | 'calendar'>('total');
    const [urgentRange, setUrgentRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState<CalendarViewMode>('monthly');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const isScheduleView = calendarView === '5days' || calendarView === 'weekly';

    React.useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const [requestSearch, setRequestSearch] = useState('');
    const [requestStatusFilter, setRequestStatusFilter] = useState('All');
    const [requestPriorityFilter, setRequestPriorityFilter] = useState('All');
    const [requestDeptFilter, setRequestDeptFilter] = useState('All');
    const [requestFilterOpen, setRequestFilterOpen] = useState(false);

    // State for Table Data
    const [tableData, setTableData] = useState<any[]>([]);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, tableData.length, requestStatusFilter, requestPriorityFilter, requestDeptFilter, requestSearch]);

    useEffect(() => {
        setOrdersPage(1);
    }, [ordersRowsPerPage, ordersSearch, ordersStatusFilter, ordersPriorityFilter, orders.length]);

    useEffect(() => {
        if (!orders.length || !rfqs.length) return;
        const orderMap = new Map(orders.map(o => [o.rfqId, o.id]));
        setRfqs(prev => {
            let changed = false;
            const next = prev.map(r => {
                if (!orderMap.has(r.id)) return r;
                const orderId = orderMap.get(r.id);
                const alreadyAligned = r.sentToOrder && r.orderId === orderId && r.status === 'Sent to PO';
                if (alreadyAligned) return r;
                changed = true;
                return { ...r, sentToOrder: true, orderId, status: r.status === 'Sent to PO' ? r.status : 'Sent to PO' };
            });
            return changed ? next : prev;
        });
    }, [orders, rfqs.length]);

    // Load data from the procurement service (decoupled from Board/Table)
    useEffect(() => {
        loadData();
        loadRfqs();
        loadOrders();
    }, []);

    const loadRfqs = async () => {
        setLoadingRfqs(true);
        try {
            const data = await procurementService.getAllRfqs();
            setRfqs(data.reverse()); // Show most recent first
        } catch (error) {
            appLogger.error("Failed to load RFQs", error);
        } finally {
            setLoadingRfqs(false);
        }
    };

    const loadOrders = async () => {
        setLoadingOrders(true);
        try {
            const data = await procurementService.getAllOrders();
            setOrders(data.reverse());
        } catch (error) {
            appLogger.error("Failed to load orders", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    const loadData = async () => {
        try {
            const data = await procurementService.getAllRequests();
            setTableData(data.reverse().map(withRequestDefaults)); // Most recent first
        } catch (error) {
            appLogger.error("Failed to load requests", error);
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
            items: data.items,
            approvalStatus: 'Pending',
            rfqSent: false
        };

        const updatedRows = [newTask, ...tableData];
        // Note: tableData is reversed tasks, so [newTask, ...tableData] adds to the top of the UI list

        setTableData(updatedRows);
        try {
            await procurementService.createRequest(newTask);
        } catch (error) {
            appLogger.error("Local save failed", error);
        }
        setIsNewRequestOpen(false);
    };

    const handleApprovalChange = async (id: string, approvalStatus: 'Approved' | 'On Hold' | 'Rejected' | 'Pending') => {
        const updateList = (list: any[]) => list.map(item => item.id === id ? { ...item, approvalStatus } : item);

        setTableData(prev => updateList(prev));

        try {
            await procurementService.updateRequest(id, { approvalStatus });
        } catch (error) {
            appLogger.error("Failed to update approval status", error);
        }
    };

    const handleDeleteRequest = async (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleViewRequestDetails = (request: any) => {
        setSelectedRequestDetails(request);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        const id = deleteConfirmId;

        setTableData(prev => prev.map(r => r.id === id ? { ...r, isDeleted: true } : r));
        setSelectedRequestDetails(prev => prev?.id === id ? null : prev);
        try {
            await procurementService.updateRequest(id, { isDeleted: true });
        } catch (error) {
            appLogger.error("Failed to mark request deleted", error);
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
            setTableData(prev => prev.map(req => req.id === rfq.requestId ? { ...req, rfqSent: true } : req));
            try {
                await procurementService.updateRequest(rfq.requestId, { rfqSent: true });
            } catch (error) {
                appLogger.error("Failed to mark request as sent to RFQ", error);
            }
        } catch (error) {
            appLogger.error("Failed to create RFQ on server", error);
            // Fallback: keep optimistic but mark as errored if we had that state, 
            // for now just keep it so the user sees something happened.
        }
    };

    const handleSendRfqToOrder = async (rfq: any) => {
        if (!rfq) return;
        if (rfq.isDeleted) return;
        const alreadySent = rfq.sentToOrder || rfq.orderId || orders.some(o => o.rfqId === rfq.id);
        if (alreadySent) return;

        const orderTotal = Number(rfq.value ?? rfq.totalExVat ?? 0);

        const orderPayload = {
            id: rfq.orderId || `ORD-${Date.now().toString().slice(-6)}`,
            rfqId: rfq.id,
            requestId: rfq.requestId,
            supplier: rfq.supplier,
            department: rfq.department,
            warehouse: rfq.warehouse,
            date: new Date().toISOString().split('T')[0],
            dueDate: rfq.dueDate,
            totalValue: orderTotal,
            priority: rfq.priority || (rfq.isUrgent ? 'Urgent' : 'Normal'),
            status: 'Open',
            approvals: 'Pending',
            relatedTo: rfq.relatedTo,
            items: rfq.items || []
        };

        try {
            const createdOrder = await procurementService.createOrder(orderPayload);
            setOrders(prev => [createdOrder, ...prev.filter(o => o.id !== createdOrder.id)]);
            setRfqs(prev => prev.map(r => r.id === rfq.id ? { ...r, status: 'Sent to PO', sentToOrder: true, orderId: createdOrder.id } : r));
            await procurementService.updateRfq(rfq.id, { status: 'Sent to PO', sentToOrder: true, orderId: createdOrder.id });
        } catch (error) {
            appLogger.error("Failed to send RFQ to order", error);
        }
    };

    const handleDeleteRfq = async (id: string) => {
        setRfqs(prev => prev.map(r => r.id === id ? { ...r, isDeleted: true } : r));
        try {
            await procurementService.updateRfq(id, { isDeleted: true });
        } catch (error) {
            appLogger.error("Failed to mark RFQ deleted", error);
        }
    };

    const handleDeleteOrder = async (id: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, isDeleted: true } : o));
        try {
            await procurementService.updateOrder(id, { isDeleted: true });
        } catch (error) {
            appLogger.error("Failed to mark order deleted", error);
        }
    };

    const handleMarkGR = async (id: string) => {
        const target = orders.find(o => o.id === id);
        if (target?.isDeleted) return;
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Received' } : o));
        try {
            await procurementService.updateOrder(id, { status: 'Received' });
        } catch (error) {
            appLogger.error("Failed to mark goods receipt", error);
        }
    };

    const handleOrderApprovalChange = async (id: string, approvals: 'Approved' | 'On Hold' | 'Rejected' | 'Pending') => {
        const target = orders.find(o => o.id === id);
        if (target?.isDeleted) return;
        setOrders(prev => prev.map(o => o.id === id ? { ...o, approvals } : o));
        try {
            await procurementService.updateOrder(id, { approvals });
        } catch (error) {
            appLogger.error("Failed to update order approval", error);
        }
    };

    // Calculate Dynamic KPIs
    const totalKpis = React.useMemo(() => {
        const activeRequests = tableData.filter(r => !r.isDeleted);
        const total = activeRequests.length;
        const open = activeRequests.filter(r => {
            const status = (r.status || 'Pending').trim();
            const isClosed = ['Done', 'Closed', 'Approved', 'Cancelled', 'Canceled'].includes(status);
            const sentToRfq = !!r.rfqSent;
            return !isClosed && !sentToRfq;
        }).length;

        const todayStr = new Date().toISOString().split('T')[0];
        const today = activeRequests.filter(r => r.date === todayStr || (r.createdAt && r.createdAt.startsWith(todayStr))).length;

        const urgent = activeRequests.filter(r => r.priority === 'Urgent' || r.isUrgent).length;

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

    const urgentKpis = React.useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const msPerDay = 1000 * 60 * 60 * 24;

        const parseDate = (value?: string) => {
            if (!value) return null;
            const normalized = value.split('T')[0];
            const d = new Date(normalized);
            return isNaN(d.getTime()) ? null : d;
        };

        const diffFromToday = (value?: string) => {
            const d = parseDate(value);
            if (!d) return null;
            const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
            const utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
            return Math.floor((utcToday - utcDate) / msPerDay);
        };

        const urgentRequests = tableData.filter(r => r.priority === 'Urgent' || r.isUrgent);
        const createdDiff = (r: any) => diffFromToday(r.date || r.createdAt);

        const rangeCounts = {
            daily: urgentRequests.filter(r => createdDiff(r) === 0).length,
            weekly: urgentRequests.filter(r => {
                const diff = createdDiff(r);
                return diff !== null && diff >= 0 && diff <= 6;
            }).length,
            monthly: urgentRequests.filter(r => {
                const diff = createdDiff(r);
                return diff !== null && diff >= 0 && diff <= 29;
            }).length
        };

        const dueToday = urgentRequests.filter(r => (r.dueDate && r.dueDate.split('T')[0] === todayStr)).length;
        const dueOver3Days = urgentRequests.filter(r => {
            const diff = diffFromToday(r.dueDate);
            return diff !== null && diff > 3;
        }).length;

        const followUpToday = urgentRequests.filter(r => {
            const needsApproval = !['Approved', 'Rejected'].includes(r.approvalStatus);
            const pendingStatus = ['Pending', 'On Hold'].includes(r.status);
            const isToday = createdDiff(r) === 0;
            return (needsApproval || pendingStatus) && isToday;
        }).length;

        return [
            {
                title: "Total Urgent",
                value: rangeCounts[urgentRange].toString(),
                trend: "+0%",
                trendUp: true,
                icon: AlertTriangle,
                description: `${urgentRange.charAt(0).toUpperCase()}${urgentRange.slice(1)} urgent requests`,
                rangeSelector: true
            },
            {
                title: "New Urgent Today",
                value: rangeCounts.daily.toString(),
                trend: "+0%",
                trendUp: true,
                icon: Zap,
                description: "Logged today"
            },
            {
                title: "Due Today",
                value: dueToday.toString(),
                trend: dueOver3Days > 0 ? `${dueOver3Days} past 3d` : "On track",
                trendUp: dueOver3Days === 0,
                icon: CalendarClock,
                description: "Mark > 3 days overdue"
            },
            {
                title: "Follow Up Today",
                value: followUpToday.toString(),
                trend: "+0%",
                trendUp: true,
                icon: Bell,
                description: "Approvals & holds"
            }
        ];
    }, [tableData, urgentRange]);

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

    const urgentChartOption = React.useMemo(() => {
        const deptCounts: Record<string, number> = {};
        tableData
            .filter(r => r.priority === 'Urgent' || r.isUrgent)
            .forEach(r => {
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
                    data: depts.length > 0 ? depts : ['No Urgent Data']
                }
            ],
            series: [
                {
                    ...CHART_OPTION.series[0],
                    data: counts.length > 0 ? counts : [0],
                    itemStyle: {
                        ...CHART_OPTION.series[0].itemStyle,
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#f43f5e' },
                                { offset: 1, color: '#e11d48' }
                            ]
                        }
                    }
                }
            ]
        };
    }, [tableData]);

    const activeKpis = kpiMode === 'total' ? totalKpis : kpiMode === 'urgent' ? urgentKpis : [];
    const activeChartOption = kpiMode === 'total' ? chartOption : urgentChartOption;
    const requestCountsByDate = React.useMemo(() => {
        const counts: Record<string, { total: number; urgent: number }> = {};
        tableData.forEach(r => {
            const key = (r.date || r.createdAt || '').split('T')[0];
            if (!key) return;
            const isUrgent = r.priority === 'Urgent' || r.isUrgent;
            if (!counts[key]) counts[key] = { total: 0, urgent: 0 };
            counts[key].total += 1;
            if (isUrgent) counts[key].urgent += 1;
        });
        return counts;
    }, [tableData]);

    const requestsByDate = React.useMemo(() => {
        const map: Record<string, any[]> = {};
        tableData.forEach(r => {
            const key = (r.date || r.createdAt || '').split('T')[0];
            if (!key) return;
            if (!map[key]) map[key] = [];
            map[key].push(r);
        });
        return map;
    }, [tableData]);

    const requestCountsByMonth = React.useMemo(() => {
        const counts: Record<string, { total: number; urgent: number }> = {};
        tableData.forEach(r => {
            const key = (r.date || r.createdAt || '').split('T')[0];
            if (!key) return;
            const [y, m] = key.split('-');
            if (!y || !m) return;
            const monthKey = `${y}-${m}`;
            const isUrgent = r.priority === 'Urgent' || r.isUrgent;
            if (!counts[monthKey]) counts[monthKey] = { total: 0, urgent: 0 };
            counts[monthKey].total += 1;
            if (isUrgent) counts[monthKey].urgent += 1;
        });
        return counts;
    }, [tableData]);

    const startOfWeek = (date: Date) => {
        const day = (date.getDay() + 6) % 7; // make Monday index 0
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
    };

    const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

    const calendarData = React.useMemo(() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        let cells: Array<Date | null> = [];
        let columns = 7;
        let headerLabels: string[] = [];
        let heading = '';

        if (calendarView === 'daily') {
            columns = 1;
            cells = [calendarDate];
            headerLabels = [weekdayLabels[(calendarDate.getDay() + 6) % 7]];
            heading = calendarDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        } else if (calendarView === '5days') {
            const start = startOfWeek(calendarDate);
            columns = 5;
            cells = Array.from({ length: 5 }, (_, i) => addDays(start, i));
            headerLabels = weekdayLabels.slice(0, 5);
            const end = addDays(start, 4);
            heading = `5-Day View (${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric' })})`;
        } else if (calendarView === 'weekly') {
            const start = startOfWeek(calendarDate);
            columns = 7;
            cells = Array.from({ length: 7 }, (_, i) => addDays(start, i));
            headerLabels = weekdayLabels;
            const end = addDays(start, 6);
            heading = `Week of ${start.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (calendarView === 'yearly') {
            columns = 4;
            cells = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
            headerLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
            heading = `Year ${year}`;
        } else {
            // monthly (default)
            const firstDay = new Date(year, month, 1);
            const startOffset = (firstDay.getDay() + 6) % 7; // Monday start
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            cells = Array(startOffset).fill(null);
            for (let d = 1; d <= daysInMonth; d++) {
                cells.push(new Date(year, month, d));
            }
            columns = 7;
            headerLabels = weekdayLabels;
            heading = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        }

        const rows = Math.max(1, Math.ceil(cells.length / columns));
        while (cells.length < rows * columns) {
            cells.push(null);
        }

        return { cells, columns, rows, headerLabels, heading };
    }, [calendarDate, calendarView]);

    const calendarViewOptions: { value: CalendarViewMode; label: string }[] = [
        { value: 'daily', label: 'Daily' },
        { value: '5days', label: '5 Days' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];

    const todayKey = React.useMemo(() => new Date().toISOString().split('T')[0], []);
    const focusedDateKey = React.useMemo(() => calendarDate.toISOString().split('T')[0], [calendarDate]);

    const workWeekDays = React.useMemo(() => {
        const start = startOfWeek(calendarDate);
        return Array.from({ length: 5 }, (_, i) => addDays(start, i));
    }, [calendarDate]);

    const fullWeekDays = React.useMemo(() => {
        const start = startOfWeek(calendarDate);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [calendarDate]);

    const scheduleTimeSlots = React.useMemo(() => ['All day', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'], []);

    const focusedDailyStats = React.useMemo(() => {
        const list = requestsByDate[focusedDateKey] || [];
        const msPerDay = 1000 * 60 * 60 * 24;
        const parseDate = (value?: string) => {
            if (!value) return null;
            const normalized = value.split('T')[0];
            const d = new Date(normalized);
            return isNaN(d.getTime()) ? null : d;
        };
        const diffInDays = (target?: string) => {
            const d = parseDate(target);
            if (!d) return null;
            const base = parseDate(focusedDateKey);
            if (!base) return null;
            const utcBase = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
            const utcTarget = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
            return Math.floor((utcBase - utcTarget) / msPerDay);
        };

        const urgentList = list.filter(r => r.priority === 'Urgent' || r.isUrgent);
        const dueToday = urgentList.filter(r => (r.dueDate && r.dueDate.split('T')[0] === focusedDateKey)).length;
        const overdue3d = urgentList.filter(r => {
            const diff = diffInDays(r.dueDate);
            return diff !== null && diff > 3;
        }).length;
        const followUp = urgentList.filter(r => {
            const needsApproval = !['Approved', 'Rejected'].includes(r.approvalStatus);
            const pendingStatus = ['Pending', 'On Hold'].includes(r.status);
            return needsApproval || pendingStatus;
        }).length;

        return {
            list,
            urgentList,
            total: list.length,
            urgentCount: urgentList.length,
            dueToday,
            overdue3d,
            followUp
        };
    }, [focusedDateKey, requestsByDate]);

    const rfqRequestIds = React.useMemo(() => new Set(rfqs.map(r => r.requestId)), [rfqs]);

    const requestFilterOptions = React.useMemo(() => {
        const departments = Array.from(new Set(tableData.map(r => r.department || 'Unassigned')));
        const priorities = Array.from(new Set(tableData.map(r => r.priority || ''))).filter(Boolean);
        const statuses = Array.from(new Set(tableData.map(r => r.status || ''))).filter(Boolean);
        return { departments, priorities, statuses };
    }, [tableData]);

    const filteredRequests = React.useMemo(() => {
        return tableData.filter(r => {
            const matchesSearch = requestSearch.trim().length === 0 ||
                r.id?.toLowerCase().includes(requestSearch.toLowerCase()) ||
                r.department?.toLowerCase().includes(requestSearch.toLowerCase()) ||
                r.warehouse?.toLowerCase().includes(requestSearch.toLowerCase()) ||
                r.relatedTo?.toLowerCase().includes(requestSearch.toLowerCase());

            const matchesStatus = requestStatusFilter === 'All' || r.status === requestStatusFilter;
            const matchesPriority = requestPriorityFilter === 'All' || r.priority === requestPriorityFilter;
            const matchesDept = requestDeptFilter === 'All' || r.department === requestDeptFilter;

            return matchesSearch && matchesStatus && matchesPriority && matchesDept;
        });
    }, [tableData, requestSearch, requestStatusFilter, requestPriorityFilter, requestDeptFilter]);

    const totalPages = Math.max(1, Math.ceil((filteredRequests.length || 1) / rowsPerPage));
    const currentPageSafe = Math.min(currentPage, totalPages);
    const startIdx = (currentPageSafe - 1) * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, filteredRequests.length);
    const paginatedTable = filteredRequests.slice(startIdx, endIdx);

    const filteredOrders = React.useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = ordersSearch.trim().length === 0 ||
                order.id?.toLowerCase().includes(ordersSearch.toLowerCase()) ||
                order.supplier?.toLowerCase().includes(ordersSearch.toLowerCase());

            const matchesStatus = ordersStatusFilter === 'All' || order.status === ordersStatusFilter;
            const matchesPriority = ordersPriorityFilter === 'All' || order.priority === ordersPriorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [orders, ordersSearch, ordersStatusFilter, ordersPriorityFilter]);

    const ordersTotalPages = Math.max(1, Math.ceil((filteredOrders.length || 1) / ordersRowsPerPage));
    const ordersPageSafe = Math.min(ordersPage, ordersTotalPages);
    const ordersStart = (ordersPageSafe - 1) * ordersRowsPerPage;
    const ordersEnd = Math.min(ordersStart + ordersRowsPerPage, filteredOrders.length);
    const paginatedOrders = filteredOrders.slice(ordersStart, ordersEnd);

    const ordersKpis = React.useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const total = orders.length;
        const open = orders.filter(o => !['Closed', 'Canceled', 'Cancelled', 'Done'].includes(o.status || '')).length;
        const todays = orders.filter(o => o.date === today).length;
        const urgent = orders.filter(o => ['High', 'Urgent', 'Critical'].includes((o.priority || '').toString())).length;

        return [
            { title: 'Total Orders', value: total, icon: Files, color: 'blue' },
            { title: 'Open Orders', value: open, icon: Inbox, color: 'green' },
            { title: "Today's Orders", value: todays, icon: CalendarClock, color: 'purple' },
            { title: 'Urgent Orders', value: urgent, icon: Zap, color: 'red' }
        ];
    }, [orders]);

    const ordersFilterOptions = React.useMemo(() => {
        const statuses = Array.from(new Set(orders.map(o => o.status || ''))).filter(Boolean);
        const priorities = Array.from(new Set(orders.map(o => o.priority || ''))).filter(Boolean);
        return { statuses, priorities };
    }, [orders]);

    const ordersByDepartmentChart = React.useMemo(() => {
        const counts: Record<string, number> = {};
        orders.forEach(o => {
            const dept = o.department || 'Unassigned';
            counts[dept] = (counts[dept] || 0) + 1;
        });
        const categories = Object.keys(counts);
        const values = Object.values(counts);

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
            xAxis: {
                type: 'category',
                data: categories.length ? categories : ['No Data'],
                axisTick: { show: false },
                axisLabel: { rotate: 15 }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } }
            },
            series: [{
                type: 'bar',
                data: values.length ? values : [0],
                barWidth: '35%',
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#6366f1' },
                            { offset: 1, color: '#4f46e5' }
                        ]
                    }
                }
            }]
        };
    }, [orders]);

    return (
        <div ref={containerRef} className={`w-full h-full p-6 pb-20 overflow-y-auto bg-white dark:bg-monday-dark-surface relative font-sans space-y-6 ${isFullScreen ? 'fixed inset-0 z-[999]' : ''} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>

            <ProcurementInfo isOpen={showInfo} onClose={() => setShowInfo(false)} />

            <NewRequestModal
                isOpen={isNewRequestOpen}
                onClose={() => setIsNewRequestOpen(false)}
                onSubmit={handleCreateRequest}
                existingTasks={tableData}
            />

            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Procurement Requests</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track your procurement requisitions</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-full p-1 shadow-sm">
                        <button
                            onClick={() => setKpiMode('total')}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${kpiMode === 'total'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                        >
                            Total
                        </button>
                        <button
                            onClick={() => setKpiMode('urgent')}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${kpiMode === 'urgent'
                                ? 'bg-rose-500 text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                        >
                            Urgent
                        </button>
                        <button
                            onClick={() => setKpiMode('calendar')}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${kpiMode === 'calendar'
                                ? 'bg-emerald-500 text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                        >
                            Calendar
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    >
                        {isFullScreen ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-monday-dark-elevated px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <Info size={18} className="text-indigo-500" />
                        About Dashboard
                    </button>
                </div>
            </div>

            {kpiMode === 'calendar' ? (
                <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-4 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm h-[520px] flex flex-col">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wide">Calendar</p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{calendarData.heading}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View request load by day</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                <div className="flex items-center gap-1 px-1.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                                    {calendarViewOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setCalendarView(option.value)}
                                            className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${calendarView === option.value
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/30">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Total
                                </span>
                                <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200 border border-rose-100 dark:border-rose-500/30">
                                    <span className="h-2 w-2 rounded-full bg-rose-500"></span> Urgent
                                </span>
                                <div className="flex items-center gap-1 ml-2">
                                    <button
                                        onClick={() => {
                                            if (calendarView === 'daily') setCalendarDate(prev => addDays(prev, -1));
                                            else if (calendarView === '5days' || calendarView === 'weekly') setCalendarDate(prev => addDays(prev, -7));
                                            else if (calendarView === 'yearly') setCalendarDate(prev => new Date(prev.getFullYear() - 1, 0, 1));
                                            else setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                                        }}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        aria-label="Previous"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCalendarDate(new Date())}
                                        className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (calendarView === 'daily') setCalendarDate(prev => addDays(prev, 1));
                                            else if (calendarView === '5days' || calendarView === 'weekly') setCalendarDate(prev => addDays(prev, 7));
                                            else if (calendarView === 'yearly') setCalendarDate(prev => new Date(prev.getFullYear() + 1, 0, 1));
                                            else setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                                        }}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        aria-label="Next"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex-1 flex flex-col">
                            {isScheduleView ? (
                                <div className="flex-1 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
                                    <div
                                        className="grid border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40 text-[11px] font-semibold text-gray-600 dark:text-gray-300"
                                        style={{ gridTemplateColumns: `80px repeat(${isScheduleView ? (calendarView === '5days' ? workWeekDays.length : fullWeekDays.length) : 0}, minmax(0, 1fr))` }}
                                    >
                                        <div className="px-3 py-2 uppercase tracking-wide text-left">All day</div>
                                        {(calendarView === '5days' ? workWeekDays : fullWeekDays).map(day => {
                                            const key = day.toISOString().split('T')[0];
                                            const counts = requestCountsByDate[key];
                                            return (
                                                <div key={key} className="px-3 py-2 border-l border-gray-200 dark:border-gray-800">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col leading-tight">
                                                            <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                                                                {day.toLocaleDateString('default', { weekday: 'long' })}
                                                            </span>
                                                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                                {day.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/30">
                                                                {counts?.total ?? 0}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200 border border-rose-100 dark:border-rose-500/30">
                                                                {counts?.urgent ?? 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: `80px repeat(${calendarView === '5days' ? workWeekDays.length : fullWeekDays.length}, minmax(0, 1fr))` }}>
                                        <div className="border-r border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/30 text-[11px] text-gray-500 dark:text-gray-400">
                                            {scheduleTimeSlots.map((slot, idx) => (
                                                <div key={slot} className={`h-full px-3 flex items-start ${idx === 0 ? 'pt-2 pb-1' : 'py-4'} border-b border-gray-200 dark:border-gray-800`}>
                                                    {slot}
                                                </div>
                                            ))}
                                        </div>
                                        {(calendarView === '5days' ? workWeekDays : fullWeekDays).map(day => {
                                            const key = day.toISOString().split('T')[0];
                                            const counts = requestCountsByDate[key];
                                            return (
                                                <div key={key} className="grid border-r border-gray-200 dark:border-gray-800" style={{ gridTemplateRows: `repeat(${scheduleTimeSlots.length}, minmax(0, 1fr))` }}>
                                                    {scheduleTimeSlots.map((slot, idx) => (
                                                        <div key={slot} className={`relative border-b border-gray-200 dark:border-gray-800 ${idx === scheduleTimeSlots.length - 1 ? '' : ''}`}>
                                                            {idx === 0 && counts && (
                                                                <div className="absolute inset-x-2 top-2 flex items-center gap-2 text-[11px]">
                                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/30">
                                                                        Total {counts.total}
                                                                    </span>
                                                                    {counts.urgent > 0 && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200 border border-rose-100 dark:border-rose-500/30">
                                                                            Urgent {counts.urgent}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {!counts && idx === 0 && (
                                                                <div className="absolute inset-x-2 top-2 text-[11px] text-gray-400 dark:text-gray-600">No entries</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="grid text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                                        style={{ gridTemplateColumns: `repeat(${calendarData.columns}, minmax(0, 1fr))` }}
                                    >
                                        {calendarData.headerLabels.map(label => (
                                            <div key={label} className="text-center py-1">{label}</div>
                                        ))}
                                    </div>
                                    <div
                                        className="grid gap-2 text-sm mt-2 flex-1"
                                        style={{
                                            gridTemplateColumns: `repeat(${calendarData.columns}, minmax(0, 1fr))`,
                                            gridTemplateRows: `repeat(${calendarData.rows}, minmax(0, 1fr))`
                                        }}
                                    >
                                        {calendarData.cells.map((day, idx) => {
                                            if (!day) {
                                                return <div key={idx} className="h-full rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40"></div>;
                                            }
                                            const key = day.toISOString().split('T')[0];
                                            const counts = calendarView === 'yearly'
                                                ? requestCountsByMonth[`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`]
                                                : requestCountsByDate[key];
                                            const isToday = calendarView === 'yearly'
                                                ? (day.getFullYear() === new Date().getFullYear() && day.getMonth() === new Date().getMonth())
                                                : key === todayKey;
                                            const hasUrgent = counts?.urgent;
                                            const dayLabel = calendarView === 'yearly'
                                                ? day.toLocaleString('default', { month: 'short' })
                                                : day.getDate();
                                            const subLabel = calendarView === 'yearly'
                                                ? day.getFullYear().toString()
                                                : calendarView === 'monthly'
                                                    ? ''
                                                    : day.toLocaleString('default', { month: 'short' });
                                            const isFocusedDay = calendarView === 'daily' && key === focusedDateKey;
                                            const detail = isFocusedDay ? focusedDailyStats : null;
                                            return (
                                                <div
                                                    key={key}
                                                    className={`h-full rounded-lg border bg-white dark:bg-monday-dark-surface flex flex-col p-2 transition-colors ${isToday
                                                        ? 'border-indigo-400 shadow-sm'
                                                        : 'border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-500/40'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-200">
                                                        <div className="flex items-baseline gap-1">
                                                            <span>{dayLabel}</span>
                                                            {subLabel && <span className="text-[10px] text-gray-400 dark:text-gray-500">{subLabel}</span>}
                                                        </div>
                                                        {hasUrgent ? <span className="w-2 h-2 rounded-full bg-rose-500" /> : null}
                                                    </div>
                                                    {counts ? (
                                                        <div className="mt-auto space-y-1">
                                                            <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                                                <span>Total</span>
                                                                <span className="font-semibold text-emerald-600 dark:text-emerald-300">{counts.total}</span>
                                                            </div>
                                                            {counts.urgent > 0 && (
                                                                <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                                                    <span>Urgent</span>
                                                                    <span className="font-semibold text-rose-600 dark:text-rose-300">{counts.urgent}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="mt-auto text-[11px] text-gray-400 dark:text-gray-600">No entries</div>
                                                    )}
                                                    {isFocusedDay && (
                                                        <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2 space-y-2 text-[11px]">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                                                    Total {detail?.total ?? 0}
                                                                </span>
                                                                <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200 border border-rose-100 dark:border-rose-500/30">
                                                                    Urgent {detail?.urgentCount ?? 0}
                                                                </span>
                                                                <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200 border border-amber-100 dark:border-amber-500/30">
                                                                    Due today {detail?.dueToday ?? 0}
                                                                </span>
                                                                <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-500/30">
                                                                    Follow up {detail?.followUp ?? 0}
                                                                </span>
                                                                {detail?.overdue3d ? (
                                                                    <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-200 border border-orange-100 dark:border-orange-500/30">
                                                                        Overdue 3d+ {detail.overdue3d}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <div className="space-y-1 max-h-28 overflow-auto">
                                                                {detail?.urgentList && detail.urgentList.length > 0 ? (
                                                                    detail.urgentList.slice(0, 4).map((req: any) => (
                                                                        <div
                                                                            key={req.id}
                                                                            className="flex items-center justify-between rounded-md border border-rose-100 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/10 px-2 py-1"
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-100">
                                                                                    {req.id || 'Urgent Request'}
                                                                                </span>
                                                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                                                    {req.department || '—'} · {req.status || 'Pending'}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-200">
                                                                                Due {req.dueDate ? req.dueDate.split('T')[0] : '—'}
                                                                            </span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">No urgent items for this day</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* 1. KPIs Section */}
                    <div className="grid grid-cols-4 gap-4">
                        {activeKpis.map((kpi, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                        <kpi.icon className="text-gray-500 dark:text-gray-400" size={18} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {kpi.rangeSelector && (
                                            <div className="flex items-center gap-1 px-1.5 py-1 rounded-full border border-rose-100 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/10">
                                                {(['daily', 'weekly', 'monthly'] as const).map(range => (
                                                    <button
                                                        key={range}
                                                        onClick={() => setUrgentRange(range)}
                                                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${urgentRange === range
                                                            ? 'bg-white dark:bg-rose-500/30 text-rose-600 dark:text-rose-50 shadow-sm'
                                                            : 'text-rose-500 dark:text-rose-200 hover:bg-white/60 dark:hover:bg-rose-500/20'
                                                            }`}
                                                    >
                                                        {range.charAt(0).toUpperCase() + range.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${kpi.trendUp
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                            }`}>
                                            {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                            {kpi.trend}
                                        </div>
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
                    <div className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {kpiMode === 'total' ? 'Department Request Volume' : 'Top Urgent Requester Departments'}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {kpiMode === 'total'
                                        ? 'Breakdown of procurement requests across departments'
                                        : 'Highlighting where urgent requests originate'}
                                </p>
                            </div>
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 transition-colors">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>

                        <div className="w-full -ml-2">
                            <ReactECharts
                                option={activeChartOption}
                                style={{ height: '300px', width: '100%' }}
                                theme={null}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* 3. Requests Table */}
            <div className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm flex-1 flex flex-col">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-monday-dark-surface rounded-t-lg">
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
                                value={requestSearch}
                                onChange={(e) => setRequestSearch(e.target.value)}
                                placeholder="Search requests..."
                                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-[#15171b] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none w-48"
                            />
                        </div>

                        <div className="relative">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => setRequestFilterOpen(prev => !prev)}
                            >
                                <Filter size={14} />
                                Filter
                            </button>
                            {requestFilterOpen && (
                                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 space-y-3 z-20">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</label>
                                        <select
                                            value={requestStatusFilter}
                                            onChange={(e) => setRequestStatusFilter(e.target.value)}
                                            className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        >
                                            <option value="All">All</option>
                                            {requestFilterOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Priority</label>
                                        <select
                                            value={requestPriorityFilter}
                                            onChange={(e) => setRequestPriorityFilter(e.target.value)}
                                            className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        >
                                            <option value="All">All</option>
                                            {requestFilterOptions.priorities.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Department</label>
                                        <select
                                            value={requestDeptFilter}
                                            onChange={(e) => setRequestDeptFilter(e.target.value)}
                                            className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        >
                                            <option value="All">All</option>
                                            {requestFilterOptions.departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        className="w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                                        onClick={() => {
                                            setRequestStatusFilter('All');
                                            setRequestPriorityFilter('All');
                                            setRequestDeptFilter('All');
                                            setRequestSearch('');
                                        }}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        {/* Actions */}
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <Upload size={14} />
                            Import
                        </button>

                        <button
                            onClick={() => setIsNewRequestOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-lg shadow-sm hover:shadow transition-all active:scale-95"
                        >
                            <Plus size={14} />
                            New Request
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/40 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 whitespace-nowrap">
                                <th className="px-4 py-3 w-10 text-center">
                                    <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
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
                                paginatedTable.map((row, idx) => {
                                    const approvalStatus = row.approvalStatus || 'Pending';
                                    const hasExistingRfq = row.rfqSent || rfqRequestIds.has(row.id);
                                    const isDeleted = !!row.isDeleted;
                                    const canSendToRFQ = !isDeleted && approvalStatus === 'Approved' && !hasExistingRfq;
                                    const theme = APPROVAL_THEMES[approvalStatus] || APPROVAL_THEMES.Pending;

                                    const rfqTitle = isDeleted
                                        ? 'Request marked as deleted'
                                        : hasExistingRfq
                                            ? 'RFQ already created'
                                            : approvalStatus !== 'Approved'
                                                ? 'Approve request before creating RFQ'
                                                : 'Create RFQ';

                                    return (
                                        <tr
                                            key={idx}
                                            style={getScratchStyle(isDeleted)}
                                            className={`transition-colors group text-xs text-gray-700 dark:text-gray-300 ${theme.rowBg} ${isDeleted ? 'opacity-60' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    disabled={isDeleted}
                                                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 disabled:opacity-40"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewRequestDetails(row)}
                                                    className="font-semibold text-indigo-700 dark:text-indigo-400 hover:underline underline-offset-2 decoration-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 rounded"
                                                >
                                                    {row.id}
                                                </button>
                                            </td>
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
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 text-[10px] font-medium uppercase tracking-wide">
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
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${theme.badge}`}>
                                                        {approvalStatus}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleApprovalChange(row.id, 'Approved')}
                                                            disabled={isDeleted}
                                                            className="p-1.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Approve"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprovalChange(row.id, 'On Hold')}
                                                            disabled={isDeleted}
                                                            className="p-1.5 hover:bg-amber-50 text-gray-400 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Hold"
                                                        >
                                                            <PauseCircle size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprovalChange(row.id, 'Rejected')}
                                                            disabled={isDeleted}
                                                            className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Reject"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => canSendToRFQ && handleOpenRFQModal(row)}
                                                        disabled={!canSendToRFQ}
                                                        className={`p-1.5 rounded transition-colors ${canSendToRFQ
                                                            ? 'hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400'
                                                            : 'text-gray-300 cursor-not-allowed opacity-60'
                                                            }`}
                                                        title={rfqTitle}
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRequest(row.id)}
                                                        disabled={isDeleted}
                                                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
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
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="ml-2">{tableData.length === 0 ? '0-0 of 0' : `${startIdx + 1}-${endIdx} of ${tableData.length}`}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                            disabled={currentPageSafe === 1}
                            onClick={() => setCurrentPage(1)}
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                            disabled={currentPageSafe === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                            disabled={currentPageSafe >= totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                            disabled={currentPageSafe >= totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                        >
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
                title="Mark Request as Deleted"
                message="This will keep the request visible but scratched out for record-keeping. Proceed?"
                confirmLabel="Mark Deleted"
                variant="warning"
            />

            <RequestDetailsModal
                request={selectedRequestDetails}
                onClose={() => setSelectedRequestDetails(null)}
            />

            <NewRFQModal
                isOpen={isRFQModalOpen}
                onClose={() => setIsRFQModalOpen(false)}
                onSubmit={handleCreateRFQ}
                requestData={selectedRequestForRFQ}
            />

            <RFQSection
                rfqs={rfqs}
                onDeleteRfq={handleDeleteRfq}
                onSendToOrder={handleSendRfqToOrder}
            />

            {/* Orders Section */}
            <div className="space-y-5">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Orders</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monitor internal orders after RFQs are processed</p>
                </div>

                {/* Orders KPIs */}
                <div className="grid grid-cols-4 gap-4">
                    {ordersKpis.map((kpi, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                    <kpi.icon className="text-gray-500 dark:text-gray-400" size={18} />
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                    <ArrowUpRight size={12} />
                                    Stable
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-1">{kpi.value}</h3>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{kpi.title}</p>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{kpi.color}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Orders Chart */}
                <div className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Orders by Department</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Distribution of orders across departments</p>
                        </div>
                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 transition-colors">
                            <MoreHorizontal size={16} />
                        </button>
                    </div>

                    <div className="w-full -ml-2">
                        <ReactECharts
                            option={ordersByDepartmentChart}
                            style={{ height: '280px', width: '100%' }}
                            theme={null}
                        />
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm flex-1 flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-monday-dark-surface rounded-t-lg sticky top-0 z-10">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Orders Table</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track internal orders lifecycle</p>
                        </div>

                        <div className="flex items-center gap-3 relative">
                            {/* Search & Filter */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <Search size={14} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={ordersSearch}
                                    onChange={(e) => setOrdersSearch(e.target.value)}
                                    placeholder="Search orders..."
                                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-[#15171b] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none w-48"
                                />
                            </div>

                            <div className="relative">
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => setOrdersFilterOpen(prev => !prev)}
                                >
                                    <Filter size={14} />
                                    Filter
                                </button>
                                {ordersFilterOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 space-y-3 z-20">
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</label>
                                            <select
                                                value={ordersStatusFilter}
                                                onChange={(e) => setOrdersStatusFilter(e.target.value)}
                                                className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            >
                                                <option value="All">All</option>
                                                {ordersFilterOptions.statuses.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Priority</label>
                                            <select
                                                value={ordersPriorityFilter}
                                                onChange={(e) => setOrdersPriorityFilter(e.target.value)}
                                                className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            >
                                                <option value="All">All</option>
                                                {ordersFilterOptions.priorities.map(priority => (
                                                    <option key={priority} value={priority}>{priority}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            className="w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                                            onClick={() => {
                                                setOrdersStatusFilter('All');
                                                setOrdersPriorityFilter('All');
                                                setOrdersSearch('');
                                            }}
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[240px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/40 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 whitespace-nowrap">
                                    <th className="px-4 py-3">Order ID</th>
                                    <th className="px-4 py-3">Supplier</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Total Value</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-center">Approvals</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-xs border-none">
                                            No orders found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map((order, idx) => {
                                        const approvalTheme = ORDER_APPROVAL_THEMES[order.approvals || 'Pending'] || ORDER_APPROVAL_THEMES.Pending;
                                        const isDeleted = !!order.isDeleted;
                                        return (
                                            <tr
                                                key={idx}
                                                style={getScratchStyle(isDeleted)}
                                                className={`transition-colors group text-xs text-gray-700 dark:text-gray-300 ${approvalTheme.rowBg} ${isDeleted ? 'opacity-60' : ''}`}
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{order.id}</td>
                                                <td className="px-4 py-3 text-gray-500">{order.supplier}</td>
                                                <td className="px-4 py-3 text-gray-500">{order.date || '-'}</td>
                                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-semibold">
                                                    {order.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border ${order.priority === 'Urgent'
                                                            ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                                                            : order.priority === 'High'
                                                                ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30'
                                                                : order.priority === 'Medium'
                                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30'
                                                                    : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                                            }`}
                                                    >
                                                        {order.priority || 'Normal'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 text-[10px] font-medium uppercase tracking-wide">
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2 w-full">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${approvalTheme.badge}`}>
                                                            {order.approvals || 'Pending'}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleOrderApprovalChange(order.id, 'Approved')}
                                                                disabled={isDeleted}
                                                                className="p-1.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                                title="Approve"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleOrderApprovalChange(order.id, 'On Hold')}
                                                                disabled={isDeleted}
                                                                className="p-1.5 hover:bg-amber-50 text-gray-400 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                                title="Hold"
                                                            >
                                                                <PauseCircle size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleOrderApprovalChange(order.id, 'Rejected')}
                                                                disabled={isDeleted}
                                                                className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                                title="Reject"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleMarkGR(order.id)}
                                                            disabled={isDeleted}
                                                            className="p-1.5 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Goods Receipt"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteOrder(order.id)}
                                                            disabled={isDeleted}
                                                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20 rounded-b-lg">
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>Rows per page:</span>
                            <select
                                value={ordersRowsPerPage}
                                onChange={(e) => setOrdersRowsPerPage(Number(e.target.value))}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="ml-2">{filteredOrders.length === 0 ? '0-0 of 0' : `${ordersStart + 1}-${ordersEnd} of ${filteredOrders.length}`}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                                disabled={ordersPageSafe === 1}
                                onClick={() => setOrdersPage(1)}
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                                disabled={ordersPageSafe === 1}
                                onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                                disabled={ordersPageSafe >= ordersTotalPages}
                                onClick={() => setOrdersPage(prev => Math.min(ordersTotalPages, prev + 1))}
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-50"
                                disabled={ordersPageSafe >= ordersTotalPages}
                                onClick={() => setOrdersPage(ordersTotalPages)}
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
