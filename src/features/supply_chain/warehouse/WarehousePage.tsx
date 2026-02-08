import React, { useState, useCallback, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import { WarehouseDashboard } from './WarehouseDashboard';
import { WarehouseCapacityMap } from './WarehouseCapacityMap';
import warehouseMaster from './warehouse_semantic_master.json';
import { useAppContext } from '../../../contexts/AppContext';
import { boardLogger } from '../../../utils/logger';
import { useAuth } from '../../../auth-adapter';
const INITIAL_BOARD: Board = {
  id: 'warehouse-main-v2',
  name: 'Warehouse',
  description: 'Inventory control and stock management',
  columns: [
    { id: 'sku', title: 'SKU', type: 'text' },
    { id: 'item', title: 'Item Name', type: 'text' },
    { id: 'status', title: 'Stock Status', type: 'status' },
    { id: 'qty', title: 'Quantity', type: 'number' },
    { id: 'location', title: 'Location', type: 'text' },
  ],
  tasks: [],
  availableViews: ['overview', 'warehouse_capacity_map', 'table', 'kanban'],
  defaultView: 'overview',
};

import { boardService } from '../../../services/boardService';

export const WarehousePage: React.FC = () => {
  const { t } = useAppContext();
  const { getToken } = useAuth();
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);
  const [_isLoading, setIsLoading] = useState(true);

  // Load board from API on mount
  React.useEffect(() => {
    const loadBoard = async () => {
      try {
        const token = (await getToken()) || '';
        let data = await boardService.getBoard(token, 'warehouse-main-v2');
        if (!data) {
          // Create if doesn't exist
          boardLogger.info('Board not found, creating...');
          data = await boardService.createBoard(token, INITIAL_BOARD);
        }

        // Ensure defaults
        const availableViews = data.availableViews || [];
        let needsUpdate = false;
        if (!availableViews.includes('overview')) {
          availableViews.unshift('overview');
          needsUpdate = true;
        }
        if (!availableViews.includes('warehouse_capacity_map')) {
          availableViews.push('warehouse_capacity_map');
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
      // Optimistic update
      setBoard((prev) => ({ ...prev, ...updates }));
      try {
        const token = (await getToken()) || '';
        await boardService.updateBoard(token, boardId, updates);
      } catch (error) {
        boardLogger.error('Failed to update board', error);
        // Revert? For now just log
      }
    },
    [getToken],
  );

  const handleUpdateTasks = React.useCallback((tasks: Task[]) => {
    setBoard((prev) => ({ ...prev, tasks }));
    // Note: Tasks are usually handled via roomService/api for granular updates,
    // but if we are just updating the board wrapper's view of tasks:
    // We might not need to save ALL tasks to the board object if they are stored in Rows/Items tables?
    // But the current implementation seems to store tasks in the Board object in some cases.
    // For the SQL migration, we should relying on specific endpoints (like /procurementRequests etc)
    // OR if this is a generic board, use the JSON 'tasks' field if Board model had one?
    // Board model DOES NOT have 'tasks' field in schema!
    // Wait, schema.prisma Board has 'cards'.
    // useRoomBoardData maps 'tasks' to 'cards' maybe?

    // ISSUE: 'tasks' in Board vs 'cards' in Schema.
    // If we just update local state, it won't persist.
    // We probably need to map tasks to cards or ignore for now if this page only cares about views configuration.
    // Let's assume for this specific task (fixing TABS), we only care on updates to availableViews.
  }, []);

  const dashboardSections = useMemo(
    () => [
      {
        title: t('warehouse_dashboards'),
        options: warehouseMaster.dashboards.map((d) => ({
          label: d.name_en,
          id: d.id,
          description: d.name_en,
        })),
      },
      {
        title: t('advanced_tools'),
        options: [
          {
            label: t('capacity_map'),
            id: 'warehouse_capacity_map',
            description: t('visual_warehouse_space_map'),
          },
        ],
      },
    ],
    [t],
  );

  const renderCustomView = useCallback(
    (viewId: string) => {
      if (viewId === 'sc_warehouse' || viewId.startsWith('W')) {
        const config = warehouseMaster.dashboards.find((d) => d.id === viewId);
        return <WarehouseDashboard viewId={viewId} title={config?.name_en} />;
      }
      if (viewId === 'warehouse_capacity_map') {
        return <WarehouseCapacityMap boardName={board.name} />;
      }
      return null;
    },
    [board.name],
  );

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

export default WarehousePage;
