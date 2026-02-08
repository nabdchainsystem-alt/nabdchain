import React, { useState, useMemo, useCallback } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import { ChartLineUp, Truck, TrendUp, CurrencyDollar, Funnel, ShieldWarning, Target, Database } from 'phosphor-react';
import { PurchaseOverviewDashboard } from './PurchaseOverviewDashboard';
import { SupplierPerformanceDashboard } from './SupplierPerformanceDashboard';
import { PurchaseBehaviorDashboard } from './PurchaseBehaviorDashboard';
import { CostControlDashboard } from './CostControlDashboard';
import { PurchaseFunnelDashboard } from './PurchaseFunnelDashboard';
import { DependencyRiskDashboard } from './DependencyRiskDashboard';
import { ForecastPlanningDashboard } from './ForecastPlanningDashboard';
import { PurchaseDeptData } from './PurchaseDeptData';
import { useAppContext } from '../../../contexts/AppContext';

const INITIAL_BOARD: Board = {
  id: 'dept-purchases',
  name: 'Purchases',
  description: 'Track purchase orders and requisitions',
  columns: [
    { id: 'name', title: 'Item Name', type: 'text' },
    { id: 'requestedBy', title: 'Requested By', type: 'person' },
    { id: 'status', title: 'Status', type: 'status' },
    { id: 'amount', title: 'Amount', type: 'text' }, // or number if supported
    { id: 'date', title: 'Date', type: 'date' },
  ],
  tasks: [],
  availableViews: [
    'purchase_overview',
    'supplier_performance',
    'purchase_behavior',
    'cost_control',
    'purchase_funnel',
    'dependency_risk',
    'forecast_planning',
    'dept_data',
  ],
  defaultView: 'overview',
};

const PurchasesPage: React.FC = () => {
  const { t } = useAppContext();

  // Dashboard sections for the Add View menu
  const dashboardSections = useMemo(
    () => [
      {
        title: t('purchases_dashboards'),
        options: [
          {
            id: 'purchase_overview',
            label: t('purchase_overview'),
            icon: ChartLineUp,
            description: t('purchase_overview_desc'),
          },
          {
            id: 'supplier_performance',
            label: t('supplier_performance'),
            icon: Truck,
            description: t('supplier_performance_menu_desc'),
          },
          {
            id: 'purchase_behavior',
            label: t('purchase_behavior'),
            icon: TrendUp,
            description: t('purchase_behavior_desc'),
          },
          {
            id: 'cost_control',
            label: t('cost_control'),
            icon: CurrencyDollar,
            description: t('cost_control_desc'),
          },
          {
            id: 'purchase_funnel',
            label: t('purchase_funnel'),
            icon: Funnel,
            description: t('purchase_funnel_desc'),
          },
          {
            id: 'dependency_risk',
            label: t('dependency_risk'),
            icon: ShieldWarning,
            description: t('dependency_risk_desc'),
          },
          {
            id: 'forecast_planning',
            label: t('forecast_planning'),
            icon: Target,
            description: t('forecast_planning_desc'),
          },
        ],
      },
      {
        title: t('data_management'),
        options: [{ id: 'dept_data', label: 'Dept Data', icon: Database, description: t('dept_data_desc') }],
      },
    ],
    [t],
  );

  const [board, setBoard] = useState<Board>(() => {
    const saved = localStorage.getItem('dept-purchases-data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all initial views are present (merge new dashboards with saved preferences)
      const savedViews = parsed.availableViews || [];
      const initialViews = INITIAL_BOARD.availableViews || [];
      const mergedViews = [...savedViews];
      initialViews.forEach((view) => {
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
    setBoard((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('dept-purchases-data', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateTasks = (tasks: Task[]) => {
    setBoard((prev) => {
      const updated = { ...prev, tasks };
      localStorage.setItem(`board-tasks-${prev.id}`, JSON.stringify(tasks));
      return updated;
    });
  };

  // Translated labels (separated from board object to prevent remounts)
  const boardName = t('purchases_page_title');
  const boardDescription = t('purchases_page_desc');

  // Create localized board - only depends on board data, not translations
  const localizedBoard = useMemo(
    () => ({
      ...board,
      name: boardName,
      description: boardDescription,
    }),
    [board, boardName, boardDescription],
  );

  // Render custom dashboard views - memoized to prevent recreation
  const renderCustomView = useCallback((viewId: string) => {
    switch (viewId) {
      case 'purchase_overview':
        return <PurchaseOverviewDashboard />;
      case 'supplier_performance':
        return <SupplierPerformanceDashboard />;
      case 'purchase_behavior':
        return <PurchaseBehaviorDashboard />;
      case 'cost_control':
        return <CostControlDashboard />;
      case 'purchase_funnel':
        return <PurchaseFunnelDashboard />;
      case 'dependency_risk':
        return <DependencyRiskDashboard />;
      case 'forecast_planning':
        return <ForecastPlanningDashboard />;
      case 'dept_data':
        return <PurchaseDeptData />;
      default:
        return null;
    }
  }, []);

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

export default PurchasesPage;
