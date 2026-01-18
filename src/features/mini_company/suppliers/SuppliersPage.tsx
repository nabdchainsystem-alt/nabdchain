import React, { useEffect, useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { Truck, Factory, Money, Star, Package, Clock, ShieldCheck, MapTrifold, Handshake } from 'phosphor-react';
import { SupplierOverviewDashboard } from './SupplierOverviewDashboard';
import { SupplierDeliveryDashboard } from './SupplierDeliveryDashboard';
import { SupplierCostDashboard } from './SupplierCostDashboard';

const INITIAL_BOARD: Board = {
    id: 'supplier-data',
    name: 'Supplier Management',
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
        'table',
        'kanban'
    ]
};

export const SuppliersPage = () => {
    const [board, setBoard] = useState<Board>(INITIAL_BOARD);

    // Load board from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('mini_company_suppliers_board');
        if (saved) {
            const parsed = JSON.parse(saved);
            const requiredViews = ['supplier_overview', 'supplier_delivery', 'supplier_cost'];
            const currentViews = parsed.availableViews || [];
            if (requiredViews.some(v => !currentViews.includes(v))) {
                const merged = {
                    ...parsed,
                    availableViews: Array.from(new Set([...currentViews, ...requiredViews]))
                };
                setBoard(merged);
            } else {
                setBoard(parsed);
            }
        }
    }, []);

    // Save board to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('mini_company_suppliers_board', JSON.stringify(board));
    }, [board]);

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => ({ ...prev, ...updates }));
    };

    const handleUpdateTasks = (tasks: any[]) => {
        // In a real app, this would update tasks in the backend
        console.log('Tasks updated:', tasks);
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
