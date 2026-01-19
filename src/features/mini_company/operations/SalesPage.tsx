import React, { useState, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { ChartLineUp, Gauge, ChartBar, TrendUp, Funnel, UsersThree, Megaphone } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';

// Import dashboard components
import { SalesInsightsDashboard } from './SalesInsightsDashboard';
import { SalesPerformanceDashboard } from './SalesPerformanceDashboard';
import { SalesAnalysisDashboard } from './SalesAnalysisDashboard';
import { SalesForecastDashboard } from './SalesForecastDashboard';
import { SalesFunnelDashboard } from './SalesFunnelDashboard';
import { SalesSegmentationDashboard } from './SalesSegmentationDashboard';
import { SalesPromotionsDashboard } from './SalesPromotionsDashboard';

const INITIAL_BOARD: Board = {
    id: 'dept-sales',
    name: 'Sales',
    description: 'Track sales opportunities and deals',
    columns: [
        { id: 'name', title: 'Deal Name', type: 'text' },
        { id: 'value', title: 'Value', type: 'text' },
        { id: 'stage', title: 'Stage', type: 'status' },
        { id: 'owner', title: 'Owner', type: 'person' },
        { id: 'probability', title: 'Probability', type: 'status' },
        { id: 'closing', title: 'Closing Date', type: 'date' }
    ],
    tasks: [],
    availableViews: [
        'overview',
        'sales_insights',
        'sales_performance',
        'sales_analysis',
        'sales_forecast',
        'sales_funnel',
        'sales_segmentation',
        'sales_promotions',
        'datatable'
    ],
    defaultView: 'overview'
};

const SalesPage: React.FC = () => {
    const { t } = useAppContext();

    // Dashboard sections for the Add View menu
    const dashboardSections = useMemo(() => [
        {
            title: t('sales_dashboards'),
            options: [
                { id: 'sales_insights', label: t('sales_insights'), icon: ChartLineUp, description: t('key_metrics_overview') },
                { id: 'sales_performance', label: t('performance'), icon: Gauge, description: t('efficiency_analysis') },
                { id: 'sales_analysis', label: t('analysis'), icon: ChartBar, description: t('deep_dive_analytics') },
                { id: 'sales_forecast', label: t('forecast'), icon: TrendUp, description: t('predictions_trends') },
                { id: 'sales_funnel', label: t('funnel'), icon: Funnel, description: t('pipeline_visualization') },
                { id: 'sales_segmentation', label: t('segmentation'), icon: UsersThree, description: t('customer_segments') },
                { id: 'sales_promotions', label: t('promotions'), icon: Megaphone, description: t('campaign_effectiveness') },
            ]
        }
    ], [t]);

    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-sales-data');
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
            localStorage.setItem('dept-sales-data', JSON.stringify(updated));
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
            case 'sales_insights':
                return <SalesInsightsDashboard />;
            case 'sales_performance':
                return <SalesPerformanceDashboard />;
            case 'sales_analysis':
                return <SalesAnalysisDashboard />;
            case 'sales_forecast':
                return <SalesForecastDashboard />;
            case 'sales_funnel':
                return <SalesFunnelDashboard />;
            case 'sales_segmentation':
                return <SalesSegmentationDashboard />;
            case 'sales_promotions':
                return <SalesPromotionsDashboard />;
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

export default SalesPage;
