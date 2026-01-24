import React, { useState, useCallback, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { PlanningDashboard } from './PlanningDashboard';
import planningMaster from './planning_semantic_master.json';
import { useAppContext } from '../../../contexts/AppContext';
import { useAuth } from '../../../auth-adapter';
import { boardService } from '../../../services/boardService';
import { boardLogger } from '../../../utils/logger';

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
    availableViews: ['overview', 'table', 'kanban'],
    defaultView: 'overview'
};

export const PlanningPage: React.FC = () => {
    const { t } = useAppContext();
    const { getToken } = useAuth();
    const [board, setBoard] = useState<Board>(INITIAL_BOARD);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const loadBoard = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    setBoard(INITIAL_BOARD);
                    setIsLoading(false);
                    return;
                }
                let data = await boardService.getBoard(token, 'planning-main-v2');
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

    const handleUpdateBoard = React.useCallback(async (boardId: string, updates: Partial<Board>) => {
        setBoard(prev => ({ ...prev, ...updates }));
        try {
            const token = await getToken();
            if (token) {
                await boardService.updateBoard(token, boardId, updates);
            }
        } catch (error) {
            boardLogger.error('Failed to update board', error);
        }
    }, [getToken]);

    const handleUpdateTasks = React.useCallback((tasks: any[]) => {
        setBoard(prev => ({ ...prev, tasks }));
    }, []);

    const dashboardSections = useMemo(() => [
        {
            title: t('planning_dashboards'),
            options: planningMaster.dashboards.map(d => ({
                label: d.name_en,
                id: d.id,
                description: d.name_en
            }))
        }
    ], [t]);

    const renderCustomView = useCallback((viewId: string) => {
        if (viewId === 'sc_planning' || viewId.startsWith('P')) {
            const config = planningMaster.dashboards.find(d => d.id === viewId);
            return <PlanningDashboard viewId={viewId} title={config?.name_en} />;
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

export default PlanningPage;
