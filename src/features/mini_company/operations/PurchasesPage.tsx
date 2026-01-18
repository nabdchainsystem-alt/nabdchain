import React, { useState, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { ChartLineUp, ShoppingCart, Truck, TrendUp, CurrencyDollar, Funnel, ShieldWarning, Target } from 'phosphor-react';
import { PurchaseOverviewDashboard } from './PurchaseOverviewDashboard';
import { SupplierPerformanceDashboard } from './SupplierPerformanceDashboard';
import { PurchaseBehaviorDashboard } from './PurchaseBehaviorDashboard';
import { CostControlDashboard } from './CostControlDashboard';
import { PurchaseFunnelDashboard } from './PurchaseFunnelDashboard';
import { DependencyRiskDashboard } from './DependencyRiskDashboard';
import { ForecastPlanningDashboard } from './ForecastPlanningDashboard';

const INITIAL_BOARD: Board = {
    id: 'dept-purchases',
    name: 'Purchases',
    description: 'Track purchase orders and requisitions',
    columns: [
        { id: 'name', title: 'Item Name', type: 'text' },
        { id: 'requestedBy', title: 'Requested By', type: 'person' },
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'amount', title: 'Amount', type: 'text' }, // or number if supported
        { id: 'date', title: 'Date', type: 'date' }
    ],
    tasks: [],
    availableViews: ['purchase_overview', 'supplier_performance', 'purchase_behavior', 'cost_control', 'purchase_funnel', 'dependency_risk', 'forecast_planning', 'datatable'],
    defaultView: 'overview'
};

const PurchasesPage: React.FC = () => {
    // Dashboard sections for the Add View menu
    const dashboardSections = useMemo(() => [
        {
            title: 'Dashboards',
            options: [
                {
                    id: 'purchase_overview',
                    label: 'Purchase Overview',
                    icon: ChartLineUp,
                    description: 'High-level snapshot of purchasing activity'
                },
                {
                    id: 'supplier_performance',
                    label: 'Supplier Performance',
                    icon: Truck,
                    description: 'Evaluate reliability, cost, and risk'
                },
                {
                    id: 'purchase_behavior',
                    label: 'Purchase Behavior',
                    icon: TrendUp,
                    description: 'Reveal hidden patterns and anomalies'
                },
                {
                    id: 'cost_control',
                    label: 'Cost Control',
                    icon: CurrencyDollar,
                    description: 'Identify overspending and efficiency gaps'
                },
                {
                    id: 'purchase_funnel',
                    label: 'Purchase Funnel',
                    icon: Funnel,
                    description: 'Track flows and approval bottlenecks'
                },
                {
                    id: 'dependency_risk',
                    label: 'Dependency & Risk',
                    icon: ShieldWarning,
                    description: 'Measure reliance and operational risk'
                },
                {
                    id: 'forecast_planning',
                    label: 'Forecast & Planning',
                    icon: Target,
                    description: 'Predict future needs and budget impact'
                }
            ]
        }
    ], []);

    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-purchases-data');
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
            return { ...parsed, availableViews: mergedViews };
        }
        return INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-purchases-data', JSON.stringify(updated));
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
            case 'purchase_overview':
                return <PurchaseOverviewDashboard />;
            case 'supplier_performance':
                return <SupplierPerformanceDashboard />;
            case 'purchase_behavior':
                return <PurchaseBehaviorDashboard />;
            case 'cost_control':
                return <CostControlDashboard />;
            case 'purchase_funnel':
                return <PurchaseFunnelDashboard />;
            case 'dependency_risk':
                return <DependencyRiskDashboard />;
            case 'forecast_planning':
                return <ForecastPlanningDashboard />;
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

export default PurchasesPage;
