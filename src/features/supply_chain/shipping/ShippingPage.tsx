import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { ShippingDashboard } from './ShippingDashboard';
import shippingMaster from './shipping_semantic_master.json';
const INITIAL_BOARD: Board = {
    id: 'shipping-main-v2',
    name: 'Shipping',
    description: 'Logistics and delivery tracking',
    columns: [
        { id: 'shipment_id', title: 'Shipment ID', type: 'text' },
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'destination', title: 'Destination', type: 'text' },
        { id: 'carrier', title: 'Carrier', type: 'text' },
        { id: 'eta', title: 'ETA', type: 'date' }
    ],
    tasks: [],
    availableViews: ['overview', 'sc_shipping', 'table', 'kanban'],
    defaultView: 'overview'
};

import { boardService } from '../../../services/boardService';

export const ShippingPage: React.FC = () => {
    const [board, setBoard] = useState<Board>(INITIAL_BOARD);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const loadBoard = async () => {
            try {
                let data = await boardService.getBoard('shipping-main-v2');
                if (!data) {
                    data = await boardService.createBoard(INITIAL_BOARD);
                }

                // Ensure defaults
                const availableViews = data.availableViews || [];
                let needsUpdate = false;
                if (!availableViews.includes('overview')) {
                    availableViews.unshift('overview');
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    data = await boardService.updateBoard(data.id, { availableViews });
                }

                setBoard(data);
            } catch (error) {
                console.error('Failed to load board', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadBoard();
    }, []);

    const handleUpdateBoard = React.useCallback(async (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => ({ ...prev, ...updates }));
        try {
            await boardService.updateBoard(boardId, updates);
        } catch (error) {
            console.error('Failed to update board', error);
        }
    }, []);

    const handleUpdateTasks = React.useCallback((tasks: any[]) => {
        setBoard(prev => ({ ...prev, tasks }));
    }, []);

    const dashboardSections = [
        {
            title: 'Shipping Dashboards',
            options: shippingMaster.dashboards.map(d => ({
                label: d.name.en,
                id: d.id,
                description: d.name.en
            }))
        }
    ];

    return (
        <BoardView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onUpdateTasks={handleUpdateTasks}
            renderCustomView={(viewId) => {
                if (viewId === 'sc_shipping' || viewId.startsWith('S')) {
                    const config = shippingMaster.dashboards.find(d => d.id === viewId);
                    return <ShippingDashboard viewId={viewId} title={config?.name.en} />;
                }
                return null;
            }}
            dashboardSections={dashboardSections}
        />
    );
};

export default ShippingPage;
