import React, { useState, useMemo, useCallback } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import {
  Package,
  ArrowsLeftRight,
  Clock,
  Target,
  ShoppingCart,
  Buildings,
  TrendUp,
  ChartLineUp,
  Database,
} from 'phosphor-react';
import InventoryInsights from './InventoryInsights';
import { InventoryOverviewDashboard } from './InventoryOverviewDashboard';
import { StockMovementDashboard } from './StockMovementDashboard';
import { InventoryAgingDashboard } from './InventoryAgingDashboard';
import { StockAccuracyDashboard } from './StockAccuracyDashboard';
import { ReorderPlanningDashboard } from './ReorderPlanningDashboard';
import { WarehousePerformanceDashboard } from './WarehousePerformanceDashboard';
import { InventoryForecastDashboard } from './InventoryForecastDashboard';
import { InventoryDeptData } from './InventoryDeptData';
import { useAppContext } from '../../../contexts/AppContext';

const InventoryPage: React.FC = () => {
  const { t } = useAppContext();

  const INITIAL_BOARD: Board = useMemo(
    () => ({
      id: 'dept-inventory',
      name: t('stock_inventory'),
      description: t('manage_stock_levels'),
      columns: [
        { id: 'name', title: t('item_name'), type: 'text' },
        { id: 'sku', title: t('sku'), type: 'text' },
        { id: 'quantity', title: t('quantity'), type: 'text' },
        { id: 'status', title: t('status'), type: 'status' },
        { id: 'location', title: t('location'), type: 'text' },
      ],
      tasks: [],
      availableViews: [
        'inventory_insights',
        'inventory_overview',
        'stock_movement',
        'inventory_aging',
        'stock_accuracy',
        'reorder_planning',
        'warehouse_performance',
        'inventory_forecast',
        'dept_data',
      ],
      defaultView: 'inventory_insights',
    }),
    [t],
  );

  // Dashboard sections for the Add View menu
  const dashboardSections = useMemo(
    () => [
      {
        title: t('dashboards'),
        options: [
          {
            id: 'inventory_insights',
            label: t('inventory_insights'),
            icon: ChartLineUp,
            description: t('inventory_insights_desc'),
          },
          {
            id: 'inventory_overview',
            label: t('inventory_overview'),
            icon: Package,
            description: t('inventory_overview_desc'),
          },
          {
            id: 'stock_movement',
            label: t('stock_movement'),
            icon: ArrowsLeftRight,
            description: t('stock_movement_desc'),
          },
          {
            id: 'inventory_aging',
            label: t('aging_dead_stock'),
            icon: Clock,
            description: t('aging_dead_stock_desc'),
          },
          {
            id: 'stock_accuracy',
            label: t('accuracy_shrinkage'),
            icon: Target,
            description: t('accuracy_shrinkage_desc'),
          },
          {
            id: 'reorder_planning',
            label: t('reorder_planning'),
            icon: ShoppingCart,
            description: t('reorder_planning_desc'),
          },
          {
            id: 'warehouse_performance',
            label: t('warehouse_perf'),
            icon: Buildings,
            description: t('warehouse_perf_desc'),
          },
          {
            id: 'inventory_forecast',
            label: t('forecast_risk'),
            icon: TrendUp,
            description: t('forecast_risk_desc'),
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
    const saved = localStorage.getItem('dept-inventory-data');
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
      localStorage.setItem('dept-inventory-data', JSON.stringify(updated));
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

  // Render custom dashboard views - memoized to prevent recreation
  const renderCustomView = useCallback((viewId: string) => {
    switch (viewId) {
      case 'inventory_insights':
        return <InventoryInsights />;
      case 'inventory_overview':
        return <InventoryOverviewDashboard />;
      case 'stock_movement':
        return <StockMovementDashboard />;
      case 'inventory_aging':
        return <InventoryAgingDashboard />;
      case 'stock_accuracy':
        return <StockAccuracyDashboard />;
      case 'reorder_planning':
        return <ReorderPlanningDashboard />;
      case 'warehouse_performance':
        return <WarehousePerformanceDashboard />;
      case 'inventory_forecast':
        return <InventoryForecastDashboard />;
      case 'dept_data':
        return <InventoryDeptData />;
      default:
        return null;
    }
  }, []);

  // Translated labels (separated from board object to prevent remounts)
  const boardName = t('stock_inventory');
  const boardDescription = t('manage_stock_levels');

  // Create localized board - only depends on board data, not translations
  const localizedBoard = useMemo(
    () => ({
      ...board,
      name: boardName,
      description: boardDescription,
    }),
    [board, boardName, boardDescription],
  );

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

export default InventoryPage;
