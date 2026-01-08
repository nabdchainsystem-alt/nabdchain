import React, { useState } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { PlanningDashboard } from './PlanningDashboard';
import planningMaster from './planning_semantic_master.json';
const INITIAL_BOARD: Board = {
    id: 'planning-main-v2',
    name: 'Planning',
    description: 'Demand and supply planning',
    columns: [
        { id: 'sku', title: 'SKU', type: 'text' },
        { id: 'description', title: 'Description', type: 'text' },
        { id: 'forecast', title: 'Forecast', type: 'number' },
        { id: 'actual', title: 'Actual', type: 'number' },
        { id: 'variance', title: 'Variance', type: 'number' }
    ],
    tasks: [],
    availableViews: ['overview', 'sc_planning', 'table', 'kanban'],
    defaultView: 'overview'
};

import { boardService } from '../../../services/boardService';

export const PlanningPage: React.FC = () => {
    const [board, setBoard] = useState<Board>(INITIAL_BOARD);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const loadBoard = async () => {
            try {
                let data = await boardService.getBoard('planning-main-v2');
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
            title: 'Planning Dashboards',
            options: planningMaster.dashboards.map(d => ({
                label: d.name_en,
                id: d.id,
                description: d.name_en
            }))
        }
    ];

    return (
        <BoardView
            board={board}
            onUpdateBoard={handleUpdateBoard}
            onUpdateTasks={handleUpdateTasks}
            renderCustomView={(viewId) => {
                if (viewId === 'sc_planning' || viewId.startsWith('P')) {
                    const config = planningMaster.dashboards.find(d => d.id === viewId);
                    return <PlanningDashboard viewId={viewId} title={config?.name_en} />;
                }
                return null;
            }}
            dashboardSections={dashboardSections}
        />
    );
};

export default PlanningPage;
