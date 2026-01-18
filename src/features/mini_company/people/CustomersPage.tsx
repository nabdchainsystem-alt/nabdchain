import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';

const INITIAL_BOARD: Board = {
    id: 'dept-customers',
    name: 'Customers',
    description: 'Manage customer database and relationships',
    columns: [
        { id: 'name', title: 'Customer Name', type: 'text' },
        { id: 'contact', title: 'Contact Person', type: 'text' },
        { id: 'email', title: 'Email', type: 'text' },
        { id: 'status', title: 'Status', type: 'status' }, // Active, Lead, Churned
        { id: 'industry', title: 'Industry', type: 'text' }
    ],
    tasks: [],
    availableViews: ['datatable'],
    defaultView: 'overview'
};

const CustomersPage: React.FC = () => {
    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-customers-data');
        return saved ? JSON.parse(saved) : INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-customers-data', JSON.stringify(updated));
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
            isDepartmentLayout={true}
        />
    );
};

export default CustomersPage;
