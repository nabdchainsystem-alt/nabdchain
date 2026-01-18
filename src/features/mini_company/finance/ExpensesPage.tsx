import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { Wallet, Tag, Receipt } from 'phosphor-react';
import ReactECharts from 'echarts-for-react';
import { ExpensesOverviewDashboard } from './ExpensesOverviewDashboard';
import { CategoryAnalysisDashboard } from './CategoryAnalysisDashboard';
import { FixedVariableDashboard } from './FixedVariableDashboard';
import { TrendsAnomaliesDashboard } from './TrendsAnomaliesDashboard';
import { ApprovalFlowDashboard } from './ApprovalFlowDashboard';
import { DeptAccountabilityDashboard } from './DeptAccountabilityDashboard';
import { ForecastOptimizationDashboard } from './ForecastOptimizationDashboard';

const INITIAL_BOARD: Board = {
    id: 'dept-expenses',
    name: 'Expenses',
    description: 'Track and approve expenses',
    columns: [
        { id: 'name', title: 'Description', type: 'text' },
        { id: 'amount', title: 'Amount', type: 'text' },
        { id: 'requester', title: 'Requester', type: 'person' },
        { id: 'status', title: 'Status', type: 'status' }, // Pending, Approved, Rejected
        { id: 'date', title: 'Date', type: 'date' },
        { id: 'category', title: 'Category', type: 'status' } // Travel, Meals, Supplies
    ],
    tasks: [],
    availableViews: [
        'expenses_overview',
        'category_analysis',
        'fixed_variable',
        'trends_anomalies',
        'approval_flow',
        'dept_accountability',
        'forecast_optimization',
        'table',
        'kanban',
        'datatable'
    ],
    defaultView: 'expenses_overview'
};

const ExpensesPage: React.FC = () => {
    // Define dashboard sections for the board view
    const dashboardSections = [
        {
            title: 'Control & Analysis',
            options: [
                {
                    id: 'expenses_overview',
                    label: 'Expenses Overview',
                    icon: Wallet,
                    description: 'Operational spending snapshot'
                },
                {
                    id: 'category_analysis',
                    label: 'Category Analysis',
                    icon: Tag,
                    description: 'Control overspending & variances'
                },
                {
                    id: 'fixed_variable',
                    label: 'Fixed vs Variable',
                    icon: Receipt,
                    description: 'Cost structure & flexibility'
                },
                {
                    id: 'trends_anomalies',
                    label: 'Trends & Anomalies',
                    icon: Tag,
                    description: 'Detect abnormal behavior'
                }
            ]
        },
        {
            title: 'Governance & Strategy',
            options: [
                {
                    id: 'approval_flow',
                    label: 'Approval & Control',
                    icon: Wallet,
                    description: 'Workflow efficiency'
                },
                {
                    id: 'dept_accountability',
                    label: 'Dept Accountability',
                    icon: Receipt,
                    description: 'Cost center ownership'
                },
                {
                    id: 'forecast_optimization',
                    label: 'Forecast & Optimization',
                    icon: Tag,
                    description: 'Future planning & savings'
                }
            ]
        }
    ];

    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-expenses-data');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure new dashboard views are available
            const requiredViews = ['expenses_overview', 'category_analysis', 'fixed_variable', 'trends_anomalies', 'approval_flow', 'dept_accountability', 'forecast_optimization'];
            const currentViews = parsed.availableViews || [];
            const missingViews = requiredViews.filter((v: string) => !currentViews.includes(v));
            if (missingViews.length > 0) {
                parsed.availableViews = [...currentViews, ...missingViews];
            }
            return parsed;
        }
        return INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-expenses-data', JSON.stringify(updated));
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

    const renderCustomView = (viewId: string) => {
        switch (viewId) {
            case 'expenses_overview':
                return <ExpensesOverviewDashboard />;
            case 'category_analysis':
                return <CategoryAnalysisDashboard />;
            case 'fixed_variable':
                return <FixedVariableDashboard />;
            case 'trends_anomalies':
                return <TrendsAnomaliesDashboard />;
            case 'approval_flow':
                return <ApprovalFlowDashboard />;
            case 'dept_accountability':
                return <DeptAccountabilityDashboard />;
            case 'forecast_optimization':
                return <ForecastOptimizationDashboard />;
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

export default ExpensesPage;
