import React, { useState, useMemo, useCallback } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import { Package, ChartLine, Shield, ShoppingCart } from 'phosphor-react';
import { SupplierOverviewDashboard } from './SupplierOverviewDashboard';
import { SupplierPerformanceDashboard } from './SupplierPerformanceDashboard';
import { SupplierRiskComplianceDashboard } from './SupplierRiskComplianceDashboard';
import { SupplierOrdersDashboard } from './SupplierOrdersDashboard';
import { useLanguage } from '../../../contexts/LanguageContext';

const INITIAL_BOARD: Board = {
  id: 'dept-suppliers',
  name: 'Suppliers',
  description: 'Manage supplier relationships and database',
  columns: [
    { id: 'name', title: 'Supplier Name', type: 'text' },
    { id: 'contact', title: 'Contact Person', type: 'text' },
    { id: 'email', title: 'Email', type: 'text' },
    { id: 'phone', title: 'Phone', type: 'text' },
    { id: 'category', title: 'Category', type: 'status' },
    { id: 'status', title: 'Status', type: 'status' },
    { id: 'rating', title: 'Rating', type: 'number' },
    { id: 'lead_time', title: 'Lead Time', type: 'number' },
  ],
  tasks: [],
  availableViews: [
    'supplier_overview',
    'supplier_performance',
    'supplier_risk_compliance',
    'supplier_orders',
    'datatable',
  ],
  defaultView: 'overview',
};

const SuppliersPage: React.FC = () => {
  const { t } = useLanguage();

  const [board, setBoard] = useState<Board>(() => {
    const saved = localStorage.getItem('dept-suppliers-data');
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
      // Remove unwanted views (table, kanban) - keep only datatable
      const filteredViews = mergedViews.filter((v: string) => v !== 'table' && v !== 'kanban');
      return { ...parsed, availableViews: filteredViews };
    }
    return INITIAL_BOARD;
  });

  const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoard((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('dept-suppliers-data', JSON.stringify(updated));
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

  const dashboardSections = [
    {
      title: t('supplier_intelligence'),
      options: [
        {
          id: 'supplier_overview',
          label: t('supplier_overview'),
          icon: Package,
          description: t('supplier_overview_desc'),
        },
        {
          id: 'supplier_performance',
          label: t('supplier_performance'),
          icon: ChartLine,
          description: t('supplier_performance_desc'),
        },
        {
          id: 'supplier_risk_compliance',
          label: t('risk_compliance'),
          icon: Shield,
          description: t('risk_compliance_desc'),
        },
        {
          id: 'supplier_orders',
          label: t('supplier_orders'),
          icon: ShoppingCart,
          description: t('supplier_orders_desc'),
        },
      ],
    },
  ];

  const renderCustomView = useCallback((viewId: string) => {
    switch (viewId) {
      case 'supplier_overview':
        return <SupplierOverviewDashboard />;
      case 'supplier_performance':
        return <SupplierPerformanceDashboard />;
      case 'supplier_risk_compliance':
        return <SupplierRiskComplianceDashboard />;
      case 'supplier_orders':
        return <SupplierOrdersDashboard />;
      default:
        return null;
    }
  }, []);

  // Create localized board with translated name and description
  const localizedBoard = useMemo(
    () => ({
      ...board,
      name: t('suppliers'),
      description: t('suppliers_desc'),
    }),
    [board, t],
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

export default SuppliersPage;
