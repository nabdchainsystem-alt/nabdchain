import React, { useState, useCallback, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board, Task } from '../../../types';
import { ShippingDashboard } from './ShippingDashboard';
import shippingMaster from './shipping_semantic_master.json';
import { useAppContext } from '../../../contexts/AppContext';
import { useAuth } from '../../../auth-adapter';
import { boardLogger } from '../../../utils/logger';
const INITIAL_BOARD: Board = {
  id: 'shipping-main-v2',
  name: 'Shipping',
  description: 'Logistics and delivery tracking',
  columns: [
    { id: 'shipment_id', title: 'Shipment ID', type: 'text' },
    { id: 'status', title: 'Status', type: 'status' },
    { id: 'destination', title: 'Destination', type: 'text' },
    { id: 'carrier', title: 'Carrier', type: 'text' },
    { id: 'eta', title: 'ETA', type: 'date' },
  ],
  tasks: [],
  availableViews: ['overview', 'table', 'kanban'],
  defaultView: 'overview',
};

import { boardService } from '../../../services/boardService';

export const ShippingPage: React.FC = () => {
  const { t } = useAppContext();
  const { getToken } = useAuth();
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);
  const [_isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const loadBoard = async () => {
      try {
        const token = (await getToken()) || '';
        let data = await boardService.getBoard(token, 'shipping-main-v2');
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
        const token = (await getToken()) || '';
        await boardService.updateBoard(token, boardId, updates);
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
        title: t('shipping_dashboards'),
        options: shippingMaster.dashboards.map((d) => ({
          label: d.name.en,
          id: d.id,
          description: d.name.en,
        })),
      },
    ],
    [t],
  );

  const renderCustomView = useCallback((viewId: string) => {
    if (viewId === 'sc_shipping' || viewId.startsWith('S')) {
      const config = shippingMaster.dashboards.find((d) => d.id === viewId);
      return <ShippingDashboard viewId={viewId} title={config?.name.en} />;
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

export default ShippingPage;
