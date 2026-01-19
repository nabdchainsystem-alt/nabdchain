import React from 'react';

// Import all dashboards
import { ExpensesOverviewDashboard } from './ExpensesOverviewDashboard';
import { CategoryAnalysisDashboard } from './CategoryAnalysisDashboard';
import { FixedVariableDashboard } from './FixedVariableDashboard';
import { TrendsAnomaliesDashboard } from './TrendsAnomaliesDashboard';
import { ApprovalFlowDashboard } from './ApprovalFlowDashboard';
import { DeptAccountabilityDashboard } from './DeptAccountabilityDashboard';
import { ForecastOptimizationDashboard } from './ForecastOptimizationDashboard';

const ExpensesInsights: React.FC = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-monday-dark-surface">
            <ExpensesOverviewDashboard />
            <CategoryAnalysisDashboard />
            <FixedVariableDashboard />
            <TrendsAnomaliesDashboard />
            <ApprovalFlowDashboard />
            <DeptAccountabilityDashboard />
            <ForecastOptimizationDashboard />
        </div>
    );
};

export default ExpensesInsights;
