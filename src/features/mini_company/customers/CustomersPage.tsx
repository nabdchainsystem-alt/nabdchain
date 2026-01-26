import React, { useState, useMemo, useCallback } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { Users, Diamond, Activity, Table, Kanban, ListDashes, Database } from 'phosphor-react';
import { CustomerOverviewDashboard } from './CustomerOverviewDashboard';
import { SegmentationValueDashboard } from './SegmentationValueDashboard';
import { BehaviorPatternsDashboard } from './BehaviorPatternsDashboard';
import { RetentionChurnDashboard } from './RetentionChurnDashboard';
import { JourneyTouchpointsDashboard } from './JourneyTouchpointsDashboard';
import { SatisfactionFeedbackDashboard } from './SatisfactionFeedbackDashboard';
import { ForecastLifetimeRiskDashboard } from './ForecastLifetimeRiskDashboard';
import { CustomerDeptData } from './CustomerDeptData';
import { useLanguage } from '../../../contexts/LanguageContext';

const INITIAL_BOARD: Board = {
    id: 'customer-data',
    name: 'Customer Intelligence',
    description: 'Analyze customer behavior and trends',
    type: 'project',
    columns: [
        { id: 'c1', title: 'New Leads', type: 'status' },
        { id: 'c2', title: 'Qualified', type: 'status' },
        { id: 'c3', title: 'Active', type: 'status' }
    ],
    tasks: [],
    availableViews: [
        'customer_overview',
        'segmentation_value',
        'behavior_patterns',
        'retention_churn',
        'journey_touchpoints',
        'satisfaction_feedback',
        'forecast_risk',
        'dept_data'
    ],
    defaultView: 'overview'
};

export const CustomersPage = () => {
    const { t } = useLanguage();

    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('mini_company_customers_board');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure all initial views are present (merge new dashboards with saved preferences)
            const savedViews = parsed.availableViews || [];
            const initialViews = INITIAL_BOARD.availableViews || [];
            // Add any new views from INITIAL_BOARD that aren't in saved data
            const mergedViews = [...savedViews];
            initialViews.forEach(view => {
                if (!mergedViews.includes(view)) {
                    mergedViews.push(view);
                }
            });
            // Remove unwanted views (table, kanban, datatable) - keep only dept_data
            const filteredViews = mergedViews.filter((v: string) => v !== 'table' && v !== 'kanban' && v !== 'datatable');
            return { ...parsed, availableViews: filteredViews };
        }
        return INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('mini_company_customers_board', JSON.stringify(updated));
            return updated;
        });
    };

    const handleUpdateTasks = (tasks: any[]) => {
        setBoard(prev => {
            const updated = { ...prev, tasks };
            localStorage.setItem('mini_company_customers_board', JSON.stringify(updated));
            return updated;
        });
    };

    const dashboardSections = useMemo(() => [
        {
            title: t('customer_intelligence'),
            options: [
                {
                    id: 'customer_overview',
                    label: t('customer_overview'),
                    icon: Users,
                    description: t('customer_overview_desc')
                },
                {
                    id: 'segmentation_value',
                    label: t('segmentation_value'),
                    icon: Diamond,
                    description: t('segmentation_value_desc')
                },
                {
                    id: 'behavior_patterns',
                    label: t('behavior_patterns'),
                    icon: Activity,
                    description: t('behavior_patterns_desc')
                },
                {
                    id: 'retention_churn',
                    label: t('retention_churn'),
                    icon: Activity,
                    description: t('retention_churn_desc')
                },
                {
                    id: 'journey_touchpoints',
                    label: t('journey_touchpoints'),
                    icon: Users,
                    description: t('journey_touchpoints_desc')
                },
                {
                    id: 'satisfaction_feedback',
                    label: t('satisfaction_feedback'),
                    icon: Diamond,
                    description: t('satisfaction_feedback_desc')
                },
                {
                    id: 'forecast_risk',
                    label: t('forecast_lifetime_risk'),
                    icon: Diamond,
                    description: t('forecast_lifetime_risk_desc')
                }
            ]
        },
        {
            title: t('data_management'),
            options: [
                { id: 'dept_data', label: 'Dept Data', icon: Database, description: t('dept_data_desc') }
            ]
        }
    ], [t]);

    // Render custom dashboard views - memoized to prevent recreation
    const renderCustomView = useCallback((viewId: string) => {
        switch (viewId) {
            case 'customer_overview':
                return <CustomerOverviewDashboard />;
            case 'segmentation_value':
                return <SegmentationValueDashboard />;
            case 'behavior_patterns':
                return <BehaviorPatternsDashboard />;
            case 'retention_churn':
                return <RetentionChurnDashboard />;
            case 'journey_touchpoints':
                return <JourneyTouchpointsDashboard />;
            case 'satisfaction_feedback':
                return <SatisfactionFeedbackDashboard />;
            case 'forecast_risk':
                return <ForecastLifetimeRiskDashboard />;
            case 'dept_data':
                return <CustomerDeptData />;
            default:
                return null;
        }
    }, []);

    // Translated labels (separated from board object to prevent remounts)
    const boardName = t('customer_intelligence');
    const boardDescription = t('customer_intelligence_desc');

    // Create localized board - only depends on board data, not translations
    const localizedBoard = useMemo(() => ({
        ...board,
        name: boardName,
        description: boardDescription
    }), [board, boardName, boardDescription]);

    return (
        <BoardView
            board={localizedBoard}
            onUpdateBoard={handleUpdateBoard}
            onUpdateTasks={handleUpdateTasks}
            isDepartmentLayout={true}
            renderCustomView={renderCustomView}
            dashboardSections={dashboardSections}
        />
    );
};
