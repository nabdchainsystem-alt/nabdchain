import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';

const INITIAL_BOARD: Board = {
  id: 'dept-finance',
  name: 'Finance & Expenses',
  description: 'Track expenses and manage budgets',
  columns: [
    { id: 'item', title: 'Item', type: 'text' },
    { id: 'amount', title: 'Amount', type: 'number' },
    { id: 'category', title: 'Category', type: 'status' }, // Operational, Marketing, Salary
    { id: 'date', title: 'Date', type: 'date' },
    { id: 'status', title: 'Status', type: 'status' }, // Pending, Approved, Paid
  ],
  tasks: [],
  availableViews: ['table', 'kanban', 'overview', 'datatable'],
  defaultView: 'table',
};

const FinancePage: React.FC = () => {
  const [board, setBoard] = useState<Board>(() => {
    const saved = localStorage.getItem('dept-finance-data');
    return saved ? JSON.parse(saved) : INITIAL_BOARD;
  });

  const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoard((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('dept-finance-data', JSON.stringify(updated));
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

export default FinancePage;
