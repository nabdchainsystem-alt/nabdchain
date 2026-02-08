import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import { appLogger } from '../../../utils/logger';

const INITIAL_BOARD: Board = {
  id: 'dept-sales',
  name: 'Sales Pipeline',
  description: 'Track leads and manage deals',
  columns: [
    { id: 'name', title: 'Deal Name', type: 'text' },
    { id: 'value', title: 'Value', type: 'currency' },
    { id: 'company', title: 'Company', type: 'text' },
    { id: 'status', title: 'Stage', type: 'status' }, // Lead, Negotiation, Closed Won
    { id: 'probability', title: 'Probability', type: 'status' },
  ],
  tasks: [],
  availableViews: ['table', 'kanban', 'overview', 'datatable'],
  defaultView: 'table',
};

const SalesPage: React.FC = () => {
  const [board, setBoard] = useState<Board>(() => {
    const saved = localStorage.getItem('dept-sales-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Ensure 'value' column is currency type
        const updatedCols = parsed.columns.map((c: { id: string; type: string }) =>
          c.id === 'value' && c.type === 'number' ? { ...c, type: 'currency' } : c,
        );
        return { ...parsed, columns: updatedCols };
      } catch (e) {
        appLogger.error('Failed to parse saved board', e);
        return INITIAL_BOARD;
      }
    }
    return INITIAL_BOARD;
  });

  const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoard((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('dept-sales-data', JSON.stringify(updated));
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

  return (
    <BoardView
      board={board}
      onUpdateBoard={handleUpdateBoard}
      onUpdateTasks={handleUpdateTasks}
      isDepartmentLayout={true}
    />
  );
};

export default SalesPage;
