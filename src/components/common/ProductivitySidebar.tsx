import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../auth-adapter';
import { boardService } from '../../services/boardService';
import { Plus, CheckCircle, Bell, Folder, CircleNotch, File, CaretRight } from 'phosphor-react';
import { appLogger } from '../../utils/logger';

interface QuickTask {
    id: string;
    name: string;
    boardId: string;
    boardName: string;
    status: string;
    dueDate?: string;
}

interface ProductivitySidebarProps {
    layout?: 'right' | 'bottom';
    contentOnly?: boolean;
    onNavigate?: (view: string, boardId?: string) => void;
}

const ProductivitySidebar: React.FC<ProductivitySidebarProps> = ({ layout = 'right', contentOnly = false, onNavigate }) => {
    const { t, activeWorkspaceId } = useAppContext();
    const { getToken } = useAuth();
    const isRight = layout === 'right';

    const [tasks, setTasks] = useState<QuickTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateBoard, setShowCreateBoard] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Fetch tasks from all boards
    const loadTasks = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const boards = await boardService.getAllBoards(token, activeWorkspaceId || undefined);

            // Extract tasks from boards
            const allTasks: QuickTask[] = [];
            boards.forEach(board => {
                if (board.tasks) {
                    try {
                        const boardTasks = typeof board.tasks === 'string'
                            ? JSON.parse(board.tasks)
                            : board.tasks;

                        if (Array.isArray(boardTasks)) {
                            boardTasks.forEach((task: any) => {
                                // Only show incomplete tasks
                                if (task.status !== 'Done' && task.status !== 'Completed') {
                                    allTasks.push({
                                        id: task.id,
                                        name: task.name || task.title || 'Untitled',
                                        boardId: board.id,
                                        boardName: board.name,
                                        status: task.status || 'To Do',
                                        dueDate: task.date || task.dueDate
                                    });
                                }
                            });
                        }
                    } catch (e) {
                        // Skip if tasks can't be parsed
                    }
                }
            });

            // Show only first 5 tasks
            setTasks(allTasks.slice(0, 5));
        } catch (error) {
            appLogger.error('Failed to load tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }, [getToken, activeWorkspaceId]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Create new board
    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return;

        setIsCreating(true);
        try {
            const token = await getToken();
            if (!token) return;

            await boardService.createBoard(token, {
                name: newBoardName.trim(),
                workspaceId: activeWorkspaceId || undefined
            });

            setNewBoardName('');
            setShowCreateBoard(false);
            loadTasks(); // Refresh
        } catch (error) {
            appLogger.error('Failed to create board:', error);
        } finally {
            setIsCreating(false);
        }
    };

    // Navigate to board
    const handleTaskClick = (boardId: string) => {
        onNavigate?.('board', boardId);
    };

    // Navigate to vault
    const handleViewFiles = () => {
        onNavigate?.('vault');
    };

    const content = (
        <>
            {/* Tasks Section */}
            <div className={`
                ${isRight || contentOnly ? 'flex-1 border-b' : 'flex-1 border-r'}
                flex flex-col min-h-0 border-border-light dark:border-border-dark
            `}>
                <div className={`
                        ${isRight ? 'p-4' : 'py-1.5 px-3'}
                        flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30
                    `}>
                    <h3 className={`font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark flex items-center ${isRight ? 'text-sm' : 'text-[11px]'}`}>
                        <CheckCircle className={`mr-2 ${isRight ? 'text-base' : 'text-sm'}`} weight="light" />
                        Tasks
                    </h3>
                    <button
                        onClick={() => setShowCreateBoard(true)}
                        className="text-primary hover:text-primary-dark"
                        title="Create Board"
                    >
                        <Plus size={18} weight="light" />
                    </button>
                </div>
                <div className={`
                        ${isRight ? 'p-3 space-y-2' : 'p-2 space-y-1.5'}
                        overflow-y-auto productivity-sidebar-scrollbar flex-1
                    `}>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <CircleNotch size={24} className="animate-spin text-gray-400" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-text-secondary-light dark:text-text-secondary-dark opacity-50 text-center py-8">
                            <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No active tasks</p>
                            <button
                                onClick={() => setShowCreateBoard(true)}
                                className="mt-3 text-xs text-primary hover:text-primary-dark"
                            >
                                Create a board to get started
                            </button>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <button
                                key={task.id}
                                onClick={() => handleTaskClick(task.boardId)}
                                className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                            >
                                <div className="flex items-start gap-2">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${task.status === 'In Progress' ? 'bg-blue-500' :
                                        task.status === 'Stuck' ? 'bg-red-500' :
                                            'bg-gray-300'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{task.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{task.boardName}</p>
                                    </div>
                                    <CaretRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 mt-1" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Reminders Section */}
            <div className={`
                    ${isRight ? 'flex-1 border-b' : 'flex-1 border-r'}
                    flex flex-col min-h-0 border-border-light dark:border-border-dark
                `}>
                <div className={`
                        ${isRight ? 'p-4' : 'py-1.5 px-3'}
                        flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30
                    `}>
                    <h3 className={`font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark flex items-center ${isRight ? 'text-sm' : 'text-[11px]'}`}>
                        <Bell className={`mr-2 ${isRight ? 'text-base' : 'text-sm'}`} weight="light" />
                        Reminders
                    </h3>
                    <button className="text-primary/80 hover:text-primary">
                        <Plus size={18} weight="light" />
                    </button>
                </div>
                <div className={`
                        ${isRight ? 'p-4 space-y-4' : 'p-2 space-y-2'}
                        overflow-y-auto productivity-sidebar-scrollbar flex-1 flex flex-col items-center justify-center text-center
                    `}>
                    <div className="text-text-secondary-light dark:text-text-secondary-dark opacity-50">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No reminders</p>
                    </div>
                </div>
            </div>

            {/* Files Section */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className={`
                        ${isRight ? 'p-4' : 'py-1.5 px-3'}
                        flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30
                    `}>
                    <h3 className={`font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark flex items-center ${isRight ? 'text-sm' : 'text-[11px]'}`}>
                        <Folder className={`mr-2 ${isRight ? 'text-base' : 'text-sm'}`} weight="light" />
                        Files
                    </h3>
                    <button
                        onClick={handleViewFiles}
                        className="text-primary hover:text-primary-dark text-xs font-medium"
                    >
                        View All
                    </button>
                </div>
                <div className={`
                        ${isRight ? 'p-4 space-y-3' : 'p-2 space-y-2'}
                        overflow-y-auto productivity-sidebar-scrollbar flex-1 flex flex-col items-center justify-center text-center
                    `}>
                    <div className="text-text-secondary-light dark:text-text-secondary-dark opacity-50">
                        <File size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No recent files</p>
                        <button
                            onClick={handleViewFiles}
                            className="mt-3 text-xs text-primary hover:text-primary-dark"
                        >
                            Open Vault
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Board Modal */}
            {showCreateBoard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-monday-dark-surface p-6 rounded-xl shadow-2xl max-w-sm w-full m-4 border border-gray-200 dark:border-monday-dark-border">
                        <h3 className="text-lg font-bold mb-4">Create New Board</h3>
                        <input
                            type="text"
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            placeholder="Board name..."
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateBoard();
                                if (e.key === 'Escape') setShowCreateBoard(false);
                            }}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateBoard(false)}
                                className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateBoard}
                                disabled={!newBoardName.trim() || isCreating}
                                className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
                            >
                                {isCreating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    if (contentOnly) {
        return (
            <div className="font-outfit flex flex-col flex-1 h-full min-h-0 bg-surface-light dark:bg-surface-dark transition-all">
                {content}
            </div>
        );
    }

    return (
        <>
            <aside className={`font-outfit
                ${isRight ? 'w-80 border-l flex-col h-full' : 'w-full border-t flex-row h-32'}
                bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark flex shrink-0 transition-all
            `}>
                {content}
            </aside>
            <style>{`
                .productivity-sidebar-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .productivity-sidebar-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .productivity-sidebar-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #D1D5DB;
                    border-radius: 20px;
                }
                .dark .productivity-sidebar-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #4B5563;
                }
            `}</style>
        </>
    );
};

export default ProductivitySidebar;
