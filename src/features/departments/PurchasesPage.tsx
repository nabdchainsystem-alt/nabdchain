import React, { useState } from 'react';
import { BoardView } from '../board/BoardView';
import { Board } from '../../types';

const INITIAL_BOARD: Board = {
    id: 'dept-purchases',
    name: 'Purchases',
    description: 'Track purchase orders and requisitions',
    columns: [
        { id: 'name', title: 'Item Name', type: 'text' },
        { id: 'requestedBy', title: 'Requested By', type: 'person' },
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'amount', title: 'Amount', type: 'text' }, // or number if supported
        { id: 'date', title: 'Date', type: 'date' }
    ],
    tasks: [],
    availableViews: ['table', 'kanban', 'overview'],
    defaultView: 'table'
};

const PurchasesPage: React.FC = () => {
    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-purchases-data');
        return saved ? JSON.parse(saved) : INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-purchases-data', JSON.stringify(updated));
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

export default PurchasesPage;
