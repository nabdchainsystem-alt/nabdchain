import React, { useEffect, useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { Users, Diamond, Activity, Table, Kanban, ListDashes } from 'phosphor-react';
import { CustomerOverviewDashboard } from './CustomerOverviewDashboard';
import { SegmentationValueDashboard } from './SegmentationValueDashboard';
import { BehaviorPatternsDashboard } from './BehaviorPatternsDashboard';
import { RetentionChurnDashboard } from './RetentionChurnDashboard';
import { JourneyTouchpointsDashboard } from './JourneyTouchpointsDashboard';
import { SatisfactionFeedbackDashboard } from './SatisfactionFeedbackDashboard';
import { ForecastLifetimeRiskDashboard } from './ForecastLifetimeRiskDashboard';

const INITIAL_BOARD: Board = {
    id: 'customer-data',
    name: 'Customer Intelligence',
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
        'table',
        'kanban'
    ]
};

export const CustomersPage = () => {
    const [board, setBoard] = useState<Board>(INITIAL_BOARD);

    // Load board from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('mini_company_customers_board');
        if (saved) {
            const parsed = JSON.parse(saved);
            const requiredViews = ['customer_overview', 'segmentation_value', 'behavior_patterns'];
            const currentViews = parsed.availableViews || [];
            if (requiredViews.some(v => !currentViews.includes(v))) {
                const merged = {
                    ...parsed,
                    availableViews: Array.from(new Set([...currentViews, ...requiredViews]))
                };
                setBoard(merged);
            } else {
                setBoard(parsed);
            }
        }
    }, []);

    // Save board to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('mini_company_customers_board', JSON.stringify(board));
    }, [board]);

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => ({ ...prev, ...updates }));
    };

    const handleUpdateTasks = (tasks: any[]) => {
        // In a real app, this would update tasks in the backend
        // For now, we just update the local state if needed
        console.log('Tasks updated:', tasks);
    };

    const dashboardSections = [
        {
            title: 'Customer Intelligence',
            options: [
                {
                    id: 'customer_overview',
                    label: 'Customer Overview',
                    icon: Users,
                    description: 'Base size & health'
                },
                {
                    id: 'segmentation_value',
                    label: 'Segmentation & Value',
                    icon: Diamond,
                    description: 'Value-based analysis'
                },
                {
                    id: 'behavior_patterns',
                    label: 'Behavior & Patterns',
                    icon: Activity,
                    description: 'Purchasing habits'
                },
                {
                    id: 'retention_churn',
                    label: 'Retention & Churn',
                    icon: Activity, // Using generic icon as we didn't import others yet for this list, or let's use Activity/Users
                    description: 'Stability analysis'
                },
                {
                    id: 'journey_touchpoints',
                    label: 'Journey & Touchpoints',
                    icon: Users,
                    description: 'Lifecycle mapping'
                },
                {
                    id: 'satisfaction_feedback',
                    label: 'Satisfaction & Feedback',
                    icon: Diamond,
                    description: 'Sentiment & NPS'
                },
                {
                    id: 'forecast_risk',
                    label: 'Forecast & Lifetime Risk',
                    icon: Diamond,
                    description: 'Predictive analytics'
                }
            ]
        }
    ];

    const renderCustomView = (viewId: string) => {
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
            case 'retention_churn':
                return <RetentionChurnDashboard />;
            case 'journey_touchpoints':
                return <JourneyTouchpointsDashboard />;
            case 'satisfaction_feedback':
                return <SatisfactionFeedbackDashboard />;
            case 'forecast_risk':
                return <ForecastLifetimeRiskDashboard />;
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
