import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { WarehouseDashboard } from './WarehouseDashboard';
import { WarehouseCapacityMap } from './WarehouseCapacityMap';
import warehouseMaster from './warehouse_semantic_master.json';
const INITIAL_BOARD: Board = {
    id: 'warehouse-main-v2',
    name: 'Warehouse',
    description: 'Inventory control and stock management',
    columns: [
        { id: 'sku', title: 'SKU', type: 'text' },
        { id: 'item', title: 'Item Name', type: 'text' },
        { id: 'status', title: 'Stock Status', type: 'status' },
        { id: 'qty', title: 'Quantity', type: 'number' },
        { id: 'location', title: 'Location', type: 'text' }
    ],
    tasks: [],
    availableViews: ['overview', 'sc_warehouse', 'warehouse_capacity_map', 'table', 'kanban'],
    defaultView: 'overview'
};

import { boardService } from '../../../services/boardService';

export const WarehousePage: React.FC = () => {
    const [board, setBoard] = useState<Board>(INITIAL_BOARD);
    const [isLoading, setIsLoading] = useState(true);

    // Load board from API on mount
    React.useEffect(() => {
        const loadBoard = async () => {
            try {
                let data = await boardService.getBoard('warehouse-main-v2');
                if (!data) {
                    // Create if doesn't exist
                    console.log('Board not found, creating...');
                    data = await boardService.createBoard(INITIAL_BOARD);
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
        // Optimistic update
        setBoard(prev => ({ ...prev, ...updates }));
        try {
            await boardService.updateBoard(boardId, updates);
        } catch (error) {
            console.error('Failed to update board', error);
            // Revert? For now just log
        }
    }, []);

    const handleUpdateTasks = React.useCallback((tasks: any[]) => {
        setBoard(prev => ({ ...prev, tasks }));
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

    const dashboardSections = [
        {
            title: 'Warehouse Dashboards',
            options: warehouseMaster.dashboards.map(d => ({
                label: d.name_en,
                id: d.id,
                description: d.name_en
            }))
        },
        {
            title: 'Advanced Tools',
            options: [
                {
                    label: 'Capacity Map',
                    id: 'warehouse_capacity_map',
                    description: 'Visual warehouse space map'
                }
            ]
        }
    ];

    return (
        <BoardView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onUpdateTasks={handleUpdateTasks}
            renderCustomView={(viewId) => {
                if (viewId === 'sc_warehouse' || viewId.startsWith('W')) {
                    const config = warehouseMaster.dashboards.find(d => d.id === viewId);
                    return <WarehouseDashboard viewId={viewId} title={config?.name_en} />;
                }
                if (viewId === 'warehouse_capacity_map') {
                    return <WarehouseCapacityMap boardName={board.name} />;
                }
                return null;
            }}
            dashboardSections={dashboardSections}
        />
    );
};

export default WarehousePage;
