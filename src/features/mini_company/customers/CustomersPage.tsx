import React, { useState } from 'react';
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
        'datatable'
    ],
    defaultView: 'overview'
};

export const CustomersPage = () => {
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
            return { ...parsed, availableViews: mergedViews };
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
