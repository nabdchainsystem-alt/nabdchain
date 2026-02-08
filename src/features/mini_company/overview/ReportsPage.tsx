import React, { useState, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

const INITIAL_BOARD: Board = {
  id: 'dept-reports',
  name: 'Reports',
  description: 'Centralized access to all system reports',
  columns: [
    { id: 'name', title: 'Report Name', type: 'text' },
    { id: 'type', title: 'Type', type: 'status' },
    { id: 'generated', title: 'Last Generated', type: 'date' },
    { id: 'owner', title: 'Owner', type: 'person' },
    { id: 'frequency', title: 'Frequency', type: 'status' },
  ],
  tasks: [],
  availableViews: ['datatable'],
  defaultView: 'overview',
};

const ReportsPage: React.FC = () => {
  const { t } = useLanguage();

  const [board, setBoard] = useState<Board>(() => {
    const saved = localStorage.getItem('dept-reports-data');
    return saved ? JSON.parse(saved) : INITIAL_BOARD;
  });

  const handleUpdateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoard((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('dept-reports-data', JSON.stringify(updated));
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
      name: t('reports'),
      description: t('reports_desc'),
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

export default ReportsPage;
