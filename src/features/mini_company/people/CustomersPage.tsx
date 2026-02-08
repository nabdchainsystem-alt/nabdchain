import React, { useState, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

const INITIAL_BOARD: Board = {
  id: 'dept-customers',
  name: 'Customers',
  description: 'Manage customer database and relationships',
  columns: [
    { id: 'name', title: 'Customer Name', type: 'text' },
    { id: 'contact', title: 'Contact Person', type: 'text' },
    { id: 'email', title: 'Email', type: 'text' },
    { id: 'status', title: 'Status', type: 'status' },
    { id: 'industry', title: 'Industry', type: 'text' },
  ],
  tasks: [],
  availableViews: ['datatable'],
  defaultView: 'overview',
};

const CustomersPage: React.FC = () => {
  const { t } = useLanguage();

  const [board, setBoard] = useState<Board>(() => {
    const saved = localStorage.getItem('dept-customers-data');
    return saved ? JSON.parse(saved) : INITIAL_BOARD;
  });

  const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoard((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('dept-customers-data', JSON.stringify(updated));
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

  // Create localized board with translated name and description
  const localizedBoard = useMemo(
    () => ({
      ...board,
      name: t('customers'),
      description: t('customers_desc'),
    }),
    [board, t],
  );

  return (
    <BoardView
      board={localizedBoard}
      onUpdateBoard={handleUpdateBoard}
      onUpdateTasks={handleUpdateTasks}
      isDepartmentLayout={true}
    />
  );
};

export default CustomersPage;
