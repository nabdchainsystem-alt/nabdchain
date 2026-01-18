import React from 'react';

// Import all dashboards
import { SalesInsightsDashboard } from './SalesInsightsDashboard';
import { SalesPerformanceDashboard } from './SalesPerformanceDashboard';
import { SalesAnalysisDashboard } from './SalesAnalysisDashboard';
import { SalesForecastDashboard } from './SalesForecastDashboard';
import { SalesFunnelDashboard } from './SalesFunnelDashboard';
import { SalesSegmentationDashboard } from './SalesSegmentationDashboard';
import { SalesPromotionsDashboard } from './SalesPromotionsDashboard';

const SalesInsights: React.FC = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-monday-dark-surface">
            <SalesInsightsDashboard />
            <SalesPerformanceDashboard hideFullscreen />
            <SalesAnalysisDashboard hideFullscreen />
            <SalesForecastDashboard hideFullscreen />
            <SalesFunnelDashboard hideFullscreen />
            <SalesSegmentationDashboard hideFullscreen />
            <SalesPromotionsDashboard hideFullscreen />
        </div>
    );
};

export default SalesInsights;
