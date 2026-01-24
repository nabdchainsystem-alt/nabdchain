import React, { useState, useCallback, useMemo } from 'react';
import { BoardView } from '../../board/BoardView';
import { Board } from '../../../types';
import { VendorsDashboard } from './VendorsDashboard';
import vendorsMaster from './vendors_semantic_master.json';
import { useAppContext } from '../../../contexts/AppContext';
import { useAuth } from '../../../auth-adapter';
import { boardLogger } from '../../../utils/logger';
const INITIAL_BOARD: Board = {
    id: 'vendors-main-v2',
    name: 'Vendors',
    description: 'Supplier relationship management',
    columns: [
        { id: 'vendor_id', title: 'Vendor ID', type: 'text' },
        { id: 'name', title: 'Vendor Name', type: 'text' },
        { id: 'type', title: 'Category', type: 'status' },
        { id: 'contact', title: 'Contact Person', type: 'person' },
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'rating', title: 'Rating', type: 'number' }
    ],
    tasks: [],
    availableViews: ['overview', 'table', 'kanban'],
    defaultView: 'overview'
};

import { boardService } from '../../../services/boardService';

export const VendorsPage: React.FC = () => {
    const { t } = useAppContext();
    const { getToken } = useAuth();
    const [board, setBoard] = useState<Board>(INITIAL_BOARD);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const loadBoard = async () => {
            try {
                const token = await getToken() || '';
                let data = await boardService.getBoard(token, 'vendors-main-v2');
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
            const token = await getToken() || '';
            await boardService.updateBoard(token, boardId, updates);
        } catch (error) {
            boardLogger.error('Failed to update board', error);
        }
    }, [getToken]);

    const handleUpdateTasks = React.useCallback((tasks: any[]) => {
        setBoard(prev => ({ ...prev, tasks }));
    }, []);

    const dashboardSections = useMemo(() => [
        {
            title: t('vendor_dashboards'),
            options: vendorsMaster.dashboards.map(d => ({
                label: d.name_en,
                id: d.id,
                description: d.name_en
            }))
        }
    ], [t]);

    const renderCustomView = useCallback((viewId: string) => {
        if (viewId === 'sc_vendors' || viewId.startsWith('V')) {
            const config = vendorsMaster.dashboards.find(d => d.id === viewId);
            return <VendorsDashboard viewId={viewId} title={config?.name_en} />;
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

export default VendorsPage;
