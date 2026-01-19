import React, { useState, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { Package, ArrowsLeftRight, Clock, Target, ShoppingCart, Buildings, TrendUp } from 'phosphor-react';
import { InventoryOverviewDashboard } from './InventoryOverviewDashboard';
import { StockMovementDashboard } from './StockMovementDashboard';
import { InventoryAgingDashboard } from './InventoryAgingDashboard';
import { StockAccuracyDashboard } from './StockAccuracyDashboard';
import { ReorderPlanningDashboard } from './ReorderPlanningDashboard';
import { WarehousePerformanceDashboard } from './WarehousePerformanceDashboard';
import { InventoryForecastDashboard } from './InventoryForecastDashboard';

const INITIAL_BOARD: Board = {
    id: 'dept-inventory',
    name: 'Stock / Inventory',
    description: 'Manage stock levels and inventory',
    columns: [
        { id: 'name', title: 'Item Name', type: 'text' },
        { id: 'sku', title: 'SKU', type: 'text' },
        { id: 'quantity', title: 'Quantity', type: 'text' },
        { id: 'status', title: 'Status', type: 'status' }, // In Stock, Low Stock, Out of Stock
        { id: 'location', title: 'Location', type: 'text' }
    ],
    tasks: [],
    availableViews: [
        'inventory_overview', 'stock_movement', 'inventory_aging',
        'stock_accuracy', 'reorder_planning', 'warehouse_performance', 'inventory_forecast',
        'datatable'
    ],
    defaultView: 'overview'
};

const InventoryPage: React.FC = () => {
    // Dashboard sections for the Add View menu
    const dashboardSections = useMemo(() => [
        {
            title: 'Dashboards',
            options: [
                {
                    id: 'inventory_overview',
                    label: 'Inventory Overview',
                    icon: Package,
                    description: 'Real-time stock levels and health'
                },
                {
                    id: 'stock_movement',
                    label: 'Stock Movement',
                    icon: ArrowsLeftRight,
                    description: 'Track in/out flow and bottlenecks'
                },
                {
                    id: 'inventory_aging',
                    label: 'Aging & Dead Stock',
                    icon: Clock,
                    description: 'Identify slow-moving items'
                },
                {
                    id: 'stock_accuracy',
                    label: 'Accuracy & Shrinkage',
                    icon: Target,
                    description: 'Audit variances and loss prevention'
                },
                {
                    id: 'reorder_planning',
                    label: 'Reorder & Planning',
                    icon: ShoppingCart,
                    description: 'Replenishment and safety stock'
                },
                {
                    id: 'warehouse_performance',
                    label: 'Warehouse Perf.',
                    icon: Buildings,
                    description: 'Efficiency and utilization metrics'
                },
                {
                    id: 'inventory_forecast',
                    label: 'Forecast & Risk',
                    icon: TrendUp,
                    description: 'Predictive demand and supply risk'
                }
            ]
        }
    ], []);

    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-inventory-data');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure all initial views are present (merge new dashboards with saved preferences)
            const savedViews = parsed.availableViews || [];
            const initialViews = INITIAL_BOARD.availableViews || [];
            const mergedViews = [...savedViews];
            initialViews.forEach(view => {
                if (!mergedViews.includes(view)) {
                    mergedViews.push(view);
                }
            });
            // Remove unwanted views (table, kanban) - keep only datatable
            const filteredViews = mergedViews.filter((v: string) => v !== 'table' && v !== 'kanban');
            return { ...parsed, availableViews: filteredViews };
        }
        return INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-inventory-data', JSON.stringify(updated));
            return updated;
        });
    };

    const handleUpdateTasks = (tasks: any[]) => {
        setBoard(prev => {
            const updated = { ...prev, tasks };
            localStorage.setItem(`board-tasks-${prev.id}`, JSON.stringify(tasks));
            return updated;
        });
    };

    // Render custom dashboard views
    const renderCustomView = (viewId: string) => {
        switch (viewId) {
            case 'inventory_overview':
                return <InventoryOverviewDashboard />;
            case 'stock_movement':
                return <StockMovementDashboard />;
            case 'inventory_aging':
                return <InventoryAgingDashboard />;
            case 'stock_accuracy':
                return <StockAccuracyDashboard />;
            case 'reorder_planning':
                return <ReorderPlanningDashboard />;
            case 'warehouse_performance':
                return <WarehousePerformanceDashboard />;
            case 'inventory_forecast':
                return <InventoryForecastDashboard />;
            default:
                return null;
        }
    };

    return (
        <BoardView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onUpdateTasks={handleUpdateTasks}
            isDepartmentLayout={true}
            renderCustomView={renderCustomView}
            dashboardSections={dashboardSections}
        />
    );
};

export default InventoryPage;
