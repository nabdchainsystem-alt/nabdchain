import React, { useState } from 'react';
import { BoardView } from '../board/BoardView';
import { Board } from '../../types';

const INITIAL_BOARD: Board = {
    id: 'dept-inventory',
    name: 'Stock / Inventory',
    description: 'Manage stock levels and inventory',
    columns: [
        { id: 'name', title: 'Item Name', type: 'text' },
        { id: 'sku', title: 'SKU', type: 'text' },
        { id: 'quantity', title: 'Quantity', type: 'text' },
        { id: 'status', title: 'Status', type: 'status' }, // In Stock, Low Stock, Out of Stock
        { id: 'location', title: 'Location', type: 'text' }
    ],
    tasks: [],
    availableViews: ['table', 'kanban', 'overview'],
    defaultView: 'table'
};

const InventoryPage: React.FC = () => {
    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-inventory-data');
        return saved ? JSON.parse(saved) : INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-inventory-data', JSON.stringify(updated));
            return updated;
        });
    };

    const handleUpdateTasks = (tasks: any[]) => {
        setBoard(prev => {
            const updated = { ...prev, tasks };
            localStorage.setItem(`board-tasks-${prev.id}`, JSON.stringify(tasks));
            return updated;
        });
    };

    return (
        <BoardView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onUpdateTasks={handleUpdateTasks}
        />
    );
};

export default InventoryPage;
