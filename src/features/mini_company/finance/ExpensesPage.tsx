import React, { useState } from 'react';
import { BoardView } from '../board/BoardView';
import { Board } from '../../types';

const INITIAL_BOARD: Board = {
    id: 'dept-expenses',
    name: 'Expenses',
    description: 'Track and approve expenses',
    columns: [
        { id: 'name', title: 'Description', type: 'text' },
        { id: 'amount', title: 'Amount', type: 'text' },
        { id: 'requester', title: 'Requester', type: 'person' },
        { id: 'status', title: 'Status', type: 'status' }, // Pending, Approved, Rejected
        { id: 'date', title: 'Date', type: 'date' },
        { id: 'category', title: 'Category', type: 'status' } // Travel, Meals, Supplies
    ],
    tasks: [],
    availableViews: ['table', 'kanban', 'overview'],
    defaultView: 'table'
};

const ExpensesPage: React.FC = () => {
    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-expenses-data');
        return saved ? JSON.parse(saved) : INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-expenses-data', JSON.stringify(updated));
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

export default ExpensesPage;
