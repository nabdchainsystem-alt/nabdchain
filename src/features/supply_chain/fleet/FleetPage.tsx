import React, { useState, useCallback, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import { FleetDashboard } from './FleetDashboard';
import fleetMaster from './fleet_semantic_master.json';
import { useAppContext } from '../../../contexts/AppContext';
import { useAuth } from '../../../auth-adapter';
import { boardLogger } from '../../../utils/logger';

const INITIAL_BOARD: Board = {
  id: 'fleet-main-v2',
  name: 'Fleet',
  description: 'Vehicle fleet management',
  columns: [
    { id: 'vehicle_id', title: 'Vehicle ID', type: 'text' },
    { id: 'type', title: 'Type', type: 'status' },
    { id: 'driver', title: 'Driver', type: 'person' },
    { id: 'status', title: 'Status', type: 'status' },
    { id: 'maintenance', title: 'Last Service', type: 'date' },
  ],
  tasks: [],
  availableViews: ['overview', 'table', 'kanban'],
  defaultView: 'overview',
};

import { boardService } from '../../../services/boardService';

export const FleetPage: React.FC = () => {
  const { t } = useAppContext();
  const { getToken } = useAuth();
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);
  const [_isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const loadBoard = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setBoard(INITIAL_BOARD);
          setIsLoading(false);
          return;
        }
        let data = await boardService.getBoard(token, 'fleet-main-v2');
        if (!data) {
          data = await boardService.createBoard(token, INITIAL_BOARD);
        }

        // Ensure defaults
        const availableViews = data.availableViews || [];
        let needsUpdate = false;
        if (!availableViews.includes('overview')) {
          availableViews.unshift('overview');
          needsUpdate = true;
        }

        if (needsUpdate) {
          data = await boardService.updateBoard(token, data.id, { availableViews });
        }

        setBoard(data);
      } catch (error) {
        boardLogger.error('Failed to load board', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBoard();
  }, [getToken]);

  const handleUpdateBoard = React.useCallback(
    async (boardId: string, updates: Partial<Board>) => {
      setBoard((prev) => ({ ...prev, ...updates }));
      try {
        const token = await getToken();
        if (token) {
          await boardService.updateBoard(token, boardId, updates);
        }
      } catch (error) {
        boardLogger.error('Failed to update board', error);
      }
    },
    [getToken],
  );

  const handleUpdateTasks = React.useCallback((tasks: Task[]) => {
    setBoard((prev) => ({ ...prev, tasks }));
  }, []);

  const dashboardSections = useMemo(
    () => [
      {
        title: t('fleet_dashboards'),
        options: fleetMaster.dashboards.map((d) => ({
          label: d.name.en,
          id: d.id,
          description: d.name.en,
        })),
      },
    ],
    [t],
  );

  const renderCustomView = useCallback((viewId: string) => {
    if (viewId === 'sc_fleet' || viewId.startsWith('F')) {
      const config = fleetMaster.dashboards.find((d) => d.id === viewId);
      return <FleetDashboard viewId={viewId} title={config?.name.en} />;
    }
    return null;
  }, []);

  return (
    <BoardView
      board={board}
      onUpdateBoard={handleUpdateBoard}
      onUpdateTasks={handleUpdateTasks}
      renderCustomView={renderCustomView}
      dashboardSections={dashboardSections}
    />
  );
};

export default FleetPage;
