import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';

const INITIAL_BOARD: Board = {
    id: 'dept-reports',
    name: 'Reports',
    description: 'Centralized access to all system reports',
    columns: [
        { id: 'name', title: 'Report Name', type: 'text' },
        { id: 'type', title: 'Type', type: 'status' }, // Financial, Operational, Sales
        { id: 'generated', title: 'Last Generated', type: 'date' },
        { id: 'owner', title: 'Owner', type: 'person' },
        { id: 'frequency', title: 'Frequency', type: 'status' } // Daily, Weekly, Monthly
    ],
    tasks: [],
    availableViews: ['datatable'],
    defaultView: 'overview'
};

const ReportsPage: React.FC = () => {
    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-reports-data');
        return saved ? JSON.parse(saved) : INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-reports-data', JSON.stringify(updated));
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

export default ReportsPage;
