import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { FleetDashboard } from './FleetDashboard';
import fleetMaster from './fleet_semantic_master.json';
import { useAppContext } from '../../../contexts/AppContext';
const INITIAL_BOARD: Board = {
    id: 'fleet-main-v2',
    name: 'Fleet',
    description: 'Vehicle fleet management',
    columns: [
        { id: 'vehicle_id', title: 'Vehicle ID', type: 'text' },
        { id: 'type', title: 'Type', type: 'status' },
        { id: 'driver', title: 'Driver', type: 'person' },
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'maintenance', title: 'Last Service', type: 'date' }
    ],
    tasks: [],
    availableViews: ['overview', 'sc_fleet', 'table', 'kanban'],
    defaultView: 'overview'
};

import { boardService } from '../../../services/boardService';

export const FleetPage: React.FC = () => {
    const { t } = useAppContext();
    const [board, setBoard] = useState<Board>(INITIAL_BOARD);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const loadBoard = async () => {
            try {
                let data = await boardService.getBoard('fleet-main-v2');
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
            title: t('fleet_dashboards'),
            options: fleetMaster.dashboards.map(d => ({
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
                if (viewId === 'sc_fleet' || viewId.startsWith('F')) {
                    const config = fleetMaster.dashboards.find(d => d.id === viewId);
                    return <FleetDashboard viewId={viewId} title={config?.name.en} />;
                }
                return null;
            }}
            dashboardSections={dashboardSections}
        />
    );
};

export default FleetPage;
