import React from 'react';
import { Board } from '../../types';

interface DashboardProps {
  onBoardCreated: (board: Board) => void;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  return (
    <div className="flex-1 bg-white dark:bg-monday-dark-bg h-full transition-colors duration-300">
      {/* Home page cleared as requested */}
    </div>
  );
};