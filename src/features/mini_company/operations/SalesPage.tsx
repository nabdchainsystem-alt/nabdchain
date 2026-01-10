import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';

const INITIAL_BOARD: Board = {
    id: 'dept-sales',
    name: 'Sales',
    description: 'Track sales opportunities and deals',
    columns: [
        { id: 'name', title: 'Deal Name', type: 'text' },
        { id: 'value', title: 'Value', type: 'text' },
        { id: 'stage', title: 'Stage', type: 'status' }, // Lead, Qualification, Proposal, Negotiation, Closed Won
        { id: 'owner', title: 'Owner', type: 'person' },
        { id: 'probability', title: 'Probability', type: 'status' },
        { id: 'closing', title: 'Closing Date', type: 'date' }
    ],
    tasks: [],
    availableViews: ['kanban', 'table', 'overview'],
    defaultView: 'kanban'
};

const SalesPage: React.FC = () => {
    const [board, setBoard] = useState<Board>(() => {
        const saved = localStorage.getItem('dept-sales-data');
        return saved ? JSON.parse(saved) : INITIAL_BOARD;
    });

    const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('dept-sales-data', JSON.stringify(updated));
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

export default SalesPage;
