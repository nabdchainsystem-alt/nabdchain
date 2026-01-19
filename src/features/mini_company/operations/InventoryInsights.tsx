import React from 'react';

// Import all dashboards
import { InventoryOverviewDashboard } from './InventoryOverviewDashboard';
import { StockMovementDashboard } from './StockMovementDashboard';
import { InventoryAgingDashboard } from './InventoryAgingDashboard';
import { StockAccuracyDashboard } from './StockAccuracyDashboard';
import { ReorderPlanningDashboard } from './ReorderPlanningDashboard';
import { WarehousePerformanceDashboard } from './WarehousePerformanceDashboard';
import { InventoryForecastDashboard } from './InventoryForecastDashboard';

const InventoryInsights: React.FC = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-monday-dark-surface">
            <InventoryOverviewDashboard />
            <StockMovementDashboard />
            <InventoryAgingDashboard />
            <StockAccuracyDashboard />
            <ReorderPlanningDashboard />
            <WarehousePerformanceDashboard />
            <InventoryForecastDashboard />
        </div>
    );
};

export default InventoryInsights;
