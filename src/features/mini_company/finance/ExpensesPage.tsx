import React, { useState, useMemo, useCallback } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { Wallet, Tag, Receipt, Database } from 'phosphor-react';
import { ExpensesOverviewDashboard } from './ExpensesOverviewDashboard';
import { CategoryAnalysisDashboard } from './CategoryAnalysisDashboard';
import { FixedVariableDashboard } from './FixedVariableDashboard';
import { TrendsAnomaliesDashboard } from './TrendsAnomaliesDashboard';
import { ApprovalFlowDashboard } from './ApprovalFlowDashboard';
import { DeptAccountabilityDashboard } from './DeptAccountabilityDashboard';
import { ForecastOptimizationDashboard } from './ForecastOptimizationDashboard';
import { ExpensesDeptData } from './ExpensesDeptData';
import { useLanguage } from '../../../contexts/LanguageContext';

const INITIAL_BOARD: Board = {
    id: 'dept-expenses',
    name: 'Expenses',
    description: 'Track and approve expenses',
    columns: [
        { id: 'name', title: 'description', type: 'text' },
        { id: 'amount', title: 'amount', type: 'text' },
        { id: 'requester', title: 'requester', type: 'person' },
        { id: 'status', title: 'status', type: 'status' },
        { id: 'date', title: 'date', type: 'date' },
        { id: 'category', title: 'category', type: 'status' }
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
        'dept_data'
    ],
    defaultView: 'overview'
};

const ExpensesPage: React.FC = () => {
    const { t } = useLanguage();

    // Define dashboard sections for the board view - memoized
    const dashboardSections = useMemo(() => [
        {
            title: t('control_analysis'),
            options: [
                {
                    id: 'expenses_overview',
                    label: t('expenses_overview'),
                    icon: Wallet,
                    description: t('expenses_overview_desc')
                },
                {
                    id: 'category_analysis',
                    label: t('category_analysis'),
                    icon: Tag,
                    description: t('category_analysis_desc')
                },
                {
                    id: 'fixed_variable',
                    label: t('fixed_variable'),
                    icon: Receipt,
                    description: t('fixed_variable_desc')
                },
                {
                    id: 'trends_anomalies',
                    label: t('trends_anomalies'),
                    icon: Tag,
                    description: t('trends_anomalies_desc')
                }
            ]
        },
        {
            title: t('governance_strategy'),
            options: [
                {
                    id: 'approval_flow',
                    label: t('approval_control'),
                    icon: Wallet,
                    description: t('approval_control_desc')
                },
                {
                    id: 'dept_accountability',
                    label: t('dept_accountability'),
                    icon: Receipt,
                    description: t('dept_accountability_desc')
                },
                {
                    id: 'forecast_optimization',
                    label: t('forecast_optimization'),
                    icon: Tag,
                    description: t('forecast_optimization_desc')
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

    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-expenses-data');
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
            // Remove unwanted views (table, kanban, datatable) - keep only dept_data
            const filteredViews = mergedViews.filter((v: string) => v !== 'table' && v !== 'kanban' && v !== 'datatable');
            return { ...parsed, availableViews: filteredViews };
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

    // Render custom dashboard views - memoized to prevent recreation
    const renderCustomView = useCallback((viewId: string) => {
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
            case 'dept_data':
                return <ExpensesDeptData />;
            default:
                return null;
        }
    }, []);

    // Translated labels (separated from board object to prevent remounts)
    const boardName = t('expenses');
    const boardDescription = t('expenses_desc');

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

export default ExpensesPage;
