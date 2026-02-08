import React, { useState, useMemo, useCallback } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import { Truck, Factory, Money, Clock, ShieldCheck, Rocket, ShieldWarning, Database } from 'phosphor-react';
import { SupplierOverviewDashboard } from './SupplierOverviewDashboard';
import { SupplierDeliveryDashboard } from './SupplierDeliveryDashboard';
import { SupplierCostDashboard } from './SupplierCostDashboard';
import { SupplierQualityComplianceDashboard } from './SupplierQualityComplianceDashboard';
import { SupplierLeadTimeResponsivenessDashboard } from './SupplierLeadTimeResponsivenessDashboard';
import { SupplierRiskDependencyDashboard } from './SupplierRiskDependencyDashboard';
import { SupplierStrategicValueGrowthDashboard } from './SupplierStrategicValueGrowthDashboard';
import { SupplierDeptData } from './SupplierDeptData';
import { useAppContext } from '../../../contexts/AppContext';

const INITIAL_BOARD: Board = {
  id: 'supplier-data',
  name: 'Supplier Management',
  description: 'Track supplier performance and costs',
  type: 'project',
  columns: [
    { id: 'c1', title: 'New', type: 'status' },
    { id: 'c2', title: 'Active', type: 'status' },
    { id: 'c3', title: 'On Hold', type: 'status' },
  ],
  tasks: [],
  availableViews: [
    'supplier_overview',
    'supplier_delivery',
    'supplier_cost',
    'supplier_quality',
    'supplier_lead_time',
    'supplier_risk',
    'supplier_strategic',
    'dept_data',
  ],
  defaultView: 'overview',
};

export const SuppliersPage = () => {
  const { t } = useAppContext();
  const [board, setBoard] = useState<Board>(() => {
    const saved = localStorage.getItem('mini_company_suppliers_board');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all initial views are present (merge new dashboards with saved preferences)
      const savedViews = parsed.availableViews || [];
      const initialViews = INITIAL_BOARD.availableViews || [];
      // Add any new views from INITIAL_BOARD that aren't in saved data
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
      localStorage.setItem('mini_company_suppliers_board', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateTasks = (tasks: Task[]) => {
    setBoard((prev) => {
      const updated = { ...prev, tasks };
      localStorage.setItem('mini_company_suppliers_board', JSON.stringify(updated));
      return updated;
    });
  };

  const dashboardSections = useMemo(
    () => [
      {
        title: 'Sourcing & Procurement',
        options: [
          {
            id: 'supplier_overview',
            label: t('overview'),
            icon: Factory,
            description: 'Supplier base & Spend',
          },
          {
            id: 'supplier_delivery',
            label: t('delivery_performance'),
            icon: Truck,
            description: 'Reliability & Speed',
          },
          {
            id: 'supplier_cost',
            label: t('cost_variance'),
            icon: Money,
            description: 'Spend controls',
          },
          {
            id: 'supplier_quality',
            label: t('quality_compliance'),
            icon: ShieldCheck,
            description: 'Defects & Standards',
          },
          {
            id: 'supplier_lead_time',
            label: t('lead_time_speed'),
            icon: Clock,
            description: 'Responsiveness',
          },
          {
            id: 'supplier_risk',
            label: t('risk_dependency'),
            icon: ShieldWarning,
            description: 'Supply Chain Risks',
          },
          {
            id: 'supplier_strategic',
            label: t('value_growth'),
            icon: Rocket,
            description: 'Innovation & Partnerships',
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

  // Render custom dashboard views - memoized to prevent recreation
  const renderCustomView = useCallback((viewId: string) => {
    switch (viewId) {
      case 'supplier_overview':
        return <SupplierOverviewDashboard />;
      case 'supplier_delivery':
        return <SupplierDeliveryDashboard />;
      case 'supplier_cost':
        return <SupplierCostDashboard />;
      case 'supplier_quality':
        return <SupplierQualityComplianceDashboard />;
      case 'supplier_lead_time':
        return <SupplierLeadTimeResponsivenessDashboard />;
      case 'supplier_risk':
        return <SupplierRiskDependencyDashboard />;
      case 'supplier_strategic':
        return <SupplierStrategicValueGrowthDashboard />;
      case 'dept_data':
        return <SupplierDeptData />;
      default:
        return null;
    }
  }, []);

  // Translated labels (separated from board object to prevent remounts)
  const boardName = t('suppliers');
  const boardDescription = t('suppliers_page_desc');

  // Create translated board for display - only depends on board data, not translations
  const translatedBoard = useMemo(
    () => ({
      ...board,
      name: boardName,
      description: boardDescription,
    }),
    [board, boardName, boardDescription],
  );

  return (
    <BoardView
      board={translatedBoard}
      onUpdateBoard={handleUpdateBoard}
      onUpdateTasks={handleUpdateTasks}
      isDepartmentLayout={true}
      renderCustomView={renderCustomView}
      dashboardSections={dashboardSections}
    />
  );
};
