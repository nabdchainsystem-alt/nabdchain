import React, { useState, useCallback, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import procurementMaster from './Procurement Dashboard/requests_orders_semantic_master.json';
import { lazyWithRetry } from '../../../utils/lazyWithRetry';
import { boardLogger } from '../../../utils/logger';

// Lazy load dashboards
const DailyRequestsControl = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/DailyRequestsControl').then(m => ({ default: m.DailyRequestsControl })));
const RequestsBacklogAging = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/RequestsBacklogAging').then(m => ({ default: m.RequestsBacklogAging })));
const SkuDemandDashboard = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/SkuDemandDashboard').then(m => ({ default: m.SkuDemandDashboard })));
const VendorRfqPipeline = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/VendorRfqPipeline').then(m => ({ default: m.VendorRfqPipeline })));
const ApprovalsFlowDashboard = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/ApprovalsFlowDashboard').then(m => ({ default: m.ApprovalsFlowDashboard })));
const SpendBudgetExposure = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/SpendBudgetExposure').then(m => ({ default: m.SpendBudgetExposure })));
const RisksExceptionsDashboard = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/RisksExceptionsDashboard').then(m => ({ default: m.RisksExceptionsDashboard })));
const DailyOrdersControl = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/DailyOrdersControl').then(m => ({ default: m.DailyOrdersControl })));
const OrderFulfillmentDashboard = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/OrderFulfillmentDashboard').then(m => ({ default: m.OrderFulfillmentDashboard })));
const OrdersFinanceDashboard = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/OrdersFinanceDashboard').then(m => ({ default: m.OrdersFinanceDashboard })));
const CustomerVendorPerformance = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/CustomerVendorPerformance').then(m => ({ default: m.CustomerVendorPerformance })));
const OrderRisksDashboard = lazyWithRetry(() => import('../../board/views/SupplyChain/RequestsOrders/OrderRisksDashboard').then(m => ({ default: m.OrderRisksDashboard })));

const INITIAL_PROCUREMENT_BOARD: Board = {
    id: 'procurement-main',
    name: 'Procurement',
    description: 'Track and manage procurement requests and orders',
    columns: [
        { id: 'name', title: 'Name', type: 'text' },
        { id: 'assignees', title: 'Person', type: 'person' },
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'dueDate', title: 'Due date', type: 'date' },
        { id: 'priority', title: 'Priority', type: 'priority' }
    ],
    tasks: [],
    availableViews: ['overview', 'kanban', 'table'],
    defaultView: 'overview'
};

const ProcurementPage: React.FC = () => {
    // ONE-TIME MIGRATION: Clear corrupted table data
    React.useEffect(() => {
        const migrated = localStorage.getItem('procurement-table-migrated-v2');
        if (!migrated) {
            localStorage.removeItem('room-table-columns-v4-procurement-main-table');
            localStorage.removeItem('room-table-columns-v4-procurement-main-undefined');
            localStorage.setItem('procurement-table-migrated-v2', 'true');
            boardLogger.info('Procurement table reset to standard layout');
        }
    }, []);

    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('procurement-board-data');
        const initial = saved ? JSON.parse(saved) : INITIAL_PROCUREMENT_BOARD;

        // Load tasks from central storage
        const savedTasks = localStorage.getItem(`board-tasks-${initial.id}`);
        if (savedTasks) {
            try {
                initial.tasks = JSON.parse(savedTasks);
            } catch (e) {
                boardLogger.error("Failed to load global tasks", e);
            }
        }

        // Ensure overview is available and default (fixes stale local storage)
        if (!initial.availableViews?.includes('overview')) {
            initial.availableViews = ['overview', ...(initial.availableViews || [])];
        }
        initial.defaultView = 'overview';

        return initial;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('procurement-board-data', JSON.stringify(updated));
            return updated;
        });
    };

    const handleUpdateTasks = React.useCallback((tasks: any[]) => {
        boardLogger.debug('ProcurementPage: Received tasks update', tasks);
        setBoard(prev => {
            const updated = { ...prev, tasks };
            // Persist to the standard shared key
            localStorage.setItem(`board-tasks-${prev.id}`, JSON.stringify(tasks));
            return updated;
        });
    }, []);

    const requestDashboards = procurementMaster.requests.rich.dashboards || [];
    const orderDashboards = (procurementMaster as any).orders?.rich?.dashboards || [];

    const dashboardSections = useMemo(() => [
        {
            title: 'Requests Dashboards',
            options: requestDashboards.map((d: any) => ({
                label: d.name.en,
                id: d.id,
                description: d.name.en
            }))
        },
        {
            title: 'Orders Dashboards',
            options: orderDashboards.map((d: any) => ({
                label: d.name.en,
                id: d.id,
                description: d.name.en
            }))
        }
    ].filter(s => s.options.length > 0), [requestDashboards, orderDashboards]);

    const renderCustomView = useCallback((viewId: string) => {
        switch (viewId) {
            // Requests (New & Legacy)
            case 'R01': case 'req_control': return <DailyRequestsControl />;
            case 'R02': case 'req_backlog': return <RequestsBacklogAging />;
            case 'R03': case 'req_sku_demand': return <SkuDemandDashboard />;
            case 'R04': case 'req_rfq_pipeline': return <VendorRfqPipeline />;
            case 'R05': case 'req_approvals': return <ApprovalsFlowDashboard />;
            case 'R06': case 'req_spend': return <SpendBudgetExposure />;
            case 'R07': case 'req_risks': return <RisksExceptionsDashboard />;
            // Orders (New & Legacy)
            case 'O01': case 'ord_control': return <DailyOrdersControl />;
            case 'O02': case 'ord_fulfillment': return <OrderFulfillmentDashboard />;
            case 'O03': case 'ord_finance': return <OrdersFinanceDashboard />;
            case 'O04': case 'ord_performance': return <CustomerVendorPerformance />;
            case 'O05': case 'ord_risks': return <OrderRisksDashboard />;
            default: return null;
        }
    }, []);

    return (
        <BoardView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onUpdateTasks={handleUpdateTasks}
            renderCustomView={renderCustomView}
            dashboardSections={dashboardSections}
        />
    );
};

export default ProcurementPage;
