import React, { useState } from 'react';
import { BoardView } from '../board/BoardView';
import { Board } from '../../types';

const INITIAL_BOARD: Board = {
    id: 'dept-dashboards',
    name: 'Dashboards',
    description: 'Centralized view of all department dashboards',
    columns: [
        { id: 'name', title: 'Dashboard Name', type: 'text' },
        { id: 'owner', title: 'Owner', type: 'person' },
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'updated', title: 'Last Updated', type: 'date' }
    ],
    tasks: [],
    availableViews: ['overview', 'table'],
    defaultView: 'overview'
};

const DashboardsPage: React.FC = () => {
    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-dashboards-data');
        return saved ? JSON.parse(saved) : INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-dashboards-data', JSON.stringify(updated));
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

export default DashboardsPage;
