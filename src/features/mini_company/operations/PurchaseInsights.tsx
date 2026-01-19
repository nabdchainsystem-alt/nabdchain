import React from 'react';

// Import all dashboards
import { PurchaseOverviewDashboard } from './PurchaseOverviewDashboard';
import { SupplierPerformanceDashboard } from './SupplierPerformanceDashboard';
import { PurchaseBehaviorDashboard } from './PurchaseBehaviorDashboard';
import { CostControlDashboard } from './CostControlDashboard';
import { PurchaseFunnelDashboard } from './PurchaseFunnelDashboard';
import { DependencyRiskDashboard } from './DependencyRiskDashboard';
import { ForecastPlanningDashboard } from './ForecastPlanningDashboard';

const PurchaseInsights: React.FC = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-monday-dark-surface">
            <PurchaseOverviewDashboard />
            <SupplierPerformanceDashboard />
            <PurchaseBehaviorDashboard />
            <CostControlDashboard />
            <PurchaseFunnelDashboard />
            <DependencyRiskDashboard />
            <ForecastPlanningDashboard />
        </div>
    );
};

export default PurchaseInsights;
