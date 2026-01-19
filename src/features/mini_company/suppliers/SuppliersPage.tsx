import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { Truck, Factory, Money, Star, Package, Clock, ShieldCheck, MapTrifold, Handshake, Rocket, ShieldWarning } from 'phosphor-react';
import { SupplierOverviewDashboard } from './SupplierOverviewDashboard';
import { SupplierDeliveryDashboard } from './SupplierDeliveryDashboard';
import { SupplierCostDashboard } from './SupplierCostDashboard';
import { SupplierQualityComplianceDashboard } from './SupplierQualityComplianceDashboard';
import { SupplierLeadTimeResponsivenessDashboard } from './SupplierLeadTimeResponsivenessDashboard';
import { SupplierRiskDependencyDashboard } from './SupplierRiskDependencyDashboard';
import { SupplierStrategicValueGrowthDashboard } from './SupplierStrategicValueGrowthDashboard';

const INITIAL_BOARD: Board = {
    id: 'supplier-data',
    name: 'Supplier Management',
    description: 'Track supplier performance and costs',
    type: 'project',
    columns: [
        { id: 'c1', title: 'New', type: 'status' },
        { id: 'c2', title: 'Active', type: 'status' },
        { id: 'c3', title: 'On Hold', type: 'status' }
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
        'datatable'
    ],
    defaultView: 'overview'
};

export const SuppliersPage = () => {
    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('mini_company_suppliers_board');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure all initial views are present (merge new dashboards with saved preferences)
            const savedViews = parsed.availableViews || [];
            const initialViews = INITIAL_BOARD.availableViews || [];
            // Add any new views from INITIAL_BOARD that aren't in saved data
            const mergedViews = [...savedViews];
            initialViews.forEach(view => {
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
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('mini_company_suppliers_board', JSON.stringify(updated));
            return updated;
        });
    };

    const handleUpdateTasks = (tasks: any[]) => {
        setBoard(prev => {
            const updated = { ...prev, tasks };
            localStorage.setItem('mini_company_suppliers_board', JSON.stringify(updated));
            return updated;
        });
    };

    const dashboardSections = [
        {
            title: 'Sourcing & Procurement',
            options: [
                {
                    id: 'supplier_overview',
                    label: 'Overview',
                    icon: Factory,
                    description: 'Supplier base & Spend'
                },
                {
                    id: 'supplier_delivery',
                    label: 'Delivery Performance',
                    icon: Truck,
                    description: 'Reliability & Speed'
                },
                {
                    id: 'supplier_cost',
                    label: 'Cost & Variance',
                    icon: Money,
                    description: 'Spend controls'
                },
                {
                    id: 'supplier_quality',
                    label: 'Quality & Compliance',
                    icon: ShieldCheck,
                    description: 'Defects & Standards'
                },
                {
                    id: 'supplier_lead_time',
                    label: 'Lead Time & Speed',
                    icon: Clock,
                    description: 'Responsiveness'
                },
                {
                    id: 'supplier_risk',
                    label: 'Risk & Dependency',
                    icon: ShieldWarning,
                    description: 'Supply Chain Risks'
                },
                {
                    id: 'supplier_strategic',
                    label: 'Value & Growth',
                    icon: Rocket,
                    description: 'Innovation & Partnerships'
                }
            ]
        }
    ];

    const renderCustomView = (viewId: string) => {
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
