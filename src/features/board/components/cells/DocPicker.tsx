import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlass as Search, Folder, FileText, CaretRight as ChevronRight, Layout, CircleNotch as Loader2, Plus } from 'phosphor-react';
import { roomService } from '../../../../services/roomService';
import { boardService } from '../../../../services/boardService';
import { v4 as uuidv4 } from 'uuid';
import { boardLogger } from '../../../../utils/logger';

interface DocPickerProps {
    onSelect: (doc: { id: string, name: string, type: 'workspace' | 'board' | 'doc' }) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
    current?: any;
    currentBoardId?: string;
}

interface Workspace {
    id: string;
    name: string;
    boards?: Board[];
}

interface Board {
    id: string;
    name: string;
    workspaceId: string;
    availableViews?: string[];
}
{/* 
   Update DocPicker component to Include creation logic 
*/}

export const DocPicker: React.FC<DocPickerProps> = ({ onSelect, onClose, triggerRect, currentBoardId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const menuRef = useRef<HTMLDivElement>(null);
    const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({ display: 'none' });
    const [isCreating, setIsCreating] = useState(false);
    const [newDocName, setNewDocName] = useState('');

    // Fetch data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch rooms (workspaces)
                const rooms = await roomService.getAllRooms();

                // Fetch all boards
                // Use token if available, otherwise try without
                const token = localStorage.getItem('token') || '';
                const boards = await boardService.getAllBoards(token);

                // Sync local board data (scan all local keys to find new boards/views)
                try {
                    const allKeys = Object.keys(localStorage);
                    const boardKeys = allKeys.filter(k => k.startsWith('room-board-data-v2-'));

                    boardKeys.forEach(key => {
                        try {
                            const localVal = localStorage.getItem(key);
                            if (localVal) {
                                const parsed = JSON.parse(localVal);
                                if (parsed && parsed.id) {
                                    // Check if this board is already in the list
                                    const existingIndex = Array.isArray(boards) ? boards.findIndex((b: any) => b.id === parsed.id) : -1;

                                    if (existingIndex !== -1) {
                                        // Update existing
                                        if (Array.isArray(boards)) {
                                            boards[existingIndex] = { ...boards[existingIndex], ...parsed };
                                        }
                                    } else {
                                        // Add new board if it looks valid
                                        // We need workspaceId. If missing, we might not be able to place it correctly.
                                        // But often local boards have workspaceId.
                                        if (parsed.workspaceId && Array.isArray(boards)) {
                                            boards.push(parsed as Board);
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            boardLogger.warn('Failed to parse board data for key', key, e);
                        }
                    });
                } catch (e) {
                    boardLogger.warn('Failed to scan local storage', e);
                }

                // Map boards to workspaces
                const mappedBoardIds = new Set<string>();
                const workspacesWithBoards = rooms.map((room: any) => {
                    const roomBoards = Array.isArray(boards) ? boards.filter((b: any) => b.workspaceId === room.id) : [];
                    roomBoards.forEach(b => mappedBoardIds.add(b.id));
                    return {
                        id: room.id,
                        name: room.name,
                        boards: roomBoards
                    };
                });

                // Find orphaned boards (local or mismatched workspaceId)
                const otherBoards = Array.isArray(boards) ? boards.filter((b: any) => !mappedBoardIds.has(b.id)) : [];

                if (otherBoards.length > 0) {
                    workspacesWithBoards.push({
                        id: 'other-workspaces',
                        name: 'Other / Local',
                        boards: otherBoards
                    });
                }

                setWorkspaces(workspacesWithBoards as Workspace[]);

                if (currentBoardId) {
                    // Find the board again to expand
                    const allBoards = workspacesWithBoards.flatMap(w => w.boards || []);
                    const currentBoard = allBoards.find(b => b.id === currentBoardId);
                    if (currentBoard) {
                        setExpandedIds(prev => new Set(prev).add(currentBoard.workspaceId).add(currentBoard.id));
                    }
                }

            } catch (error) {
                boardLogger.error('Failed to load docs:', error);
                setWorkspaces([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentBoardId]);

    // Positioning logic
    useLayoutEffect(() => {
        if (triggerRect) {
            const menuHeight = 320;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const openUp = spaceBelow < menuHeight && triggerRect.top > menuHeight;

            if (openUp) {
                setPositionStyle({
                    bottom: window.innerHeight - triggerRect.top - 4,
                    left: triggerRect.left,
                    position: 'fixed',
                    maxHeight: triggerRect.top - 10
                });
            } else {
                setPositionStyle({
                    top: triggerRect.bottom - 4,
                    left: triggerRect.left,
                    position: 'fixed',
                    maxHeight: window.innerHeight - triggerRect.bottom - 10
                });
            }
        }
    }, [triggerRect]);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    const filteredWorkspaces = workspaces.filter(ws =>
        ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ws.boards?.some(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleCreateDoc = async () => {
        if (!newDocName.trim()) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token') || '';
            const newDocId = uuidv4();

            // Construct new board payload (A "Doc" is essentially a board with limited views)
            const newBoardPayload = {
                id: newDocId, // Optimistic ID or let backend assign? Backend usually assigns. 
                // If using local backend, we might need to handle ID.
                name: newDocName,
                workspaceId: current?.workspaceId || workspaces[0]?.id || 'default-workspace',
                availableViews: ['doc'],
                defaultView: 'doc',
                groups: []
            };

            let createdBoard;
            try {
                // Try backend first
                if (token) {
                    // CAUTION: backend might return different ID
                    const res = await boardService.createBoard(token, newBoardPayload);
                    createdBoard = res;
                }
            } catch (err) {
                boardLogger.warn("Backend creation failed, falling back to local", err);
            }

            if (!createdBoard) {
                // Local Fallback
                createdBoard = { ...newBoardPayload, id: newDocId };
                // Save to localStorage
                localStorage.setItem(`room-board-data-v2-${newDocId}`, JSON.stringify(createdBoard));

                // Also need to update the list of boards? 
                // We rely on the parent or next fetch to see it?
                // But we want to select it immediately.
            }

            // Immediately select it
            onSelect({
                id: createdBoard.id,
                name: `${createdBoard.name} Doc`,
                type: 'doc'
            });
            onClose();

        } catch (error) {
            boardLogger.error('Failed to create doc:', error);
        } finally {
            setLoading(false);
            setIsCreating(false);
        }
    };

    const renderBoardItem = (board: Board) => {
        const isExpanded = expandedIds.has(board.id);
        const hasDocView = board.availableViews?.includes('doc');

        // If searching, we always show matching items. If not searching, we respect expansion.
        // But for nested "Doc", it's a child of Board.

        return (
            <div key={board.id}>
                <button
                    onClick={(e) => {
                        if (hasDocView) {
                            toggleExpand(board.id, e);
                        } else {
                            onSelect({ id: board.id, name: board.name, type: 'board' });
                            onClose();
                        }
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 group text-left pl-6"
                >
                    <Layout size={12} className="text-blue-500" />
                    <span className="flex-1 text-xs text-stone-600 dark:text-stone-400 truncate group-hover:text-stone-900 dark:group-hover:text-stone-200">
                        {board.name}
                    </span>
                    {hasDocView && (
                        <ChevronRight
                            size={12}
                            className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                    )}
                </button>

                {/* Nested Docs (Views) */}
                {isExpanded && hasDocView && (
                    <div className="ml-6 pl-3 border-l border-stone-100 dark:border-stone-800 mt-0.5 space-y-0.5">
                        <button
                            onClick={() => {
                                onSelect({ id: board.id, name: `${board.name} Doc`, type: 'doc' }); // Linking to the board as a doc essentially
                                onClose();
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 group text-left"
                        >
                            <FileText size={12} className="text-rose-500" />
                            <span className="text-xs text-stone-600 dark:text-stone-400 truncate group-hover:text-stone-900 dark:group-hover:text-stone-200">
                                Main Doc
                            </span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const content = (
        <>
            <div className="fixed inset-0 z-[99]" onClick={onClose} />
            <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed w-[280px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-[100] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                {/* Search */}
                <div className="p-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-stone-800 dark:text-stone-200"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto max-h-[250px] p-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-stone-400">
                            <Loader2 size={16} className="animate-spin mr-2" />
                            <span className="text-xs">Loading docs...</span>
                        </div>
                    ) : filteredWorkspaces.length === 0 ? (
                        <div className="py-4 text-center text-xs text-stone-400">
                            No docs found
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {filteredWorkspaces.map(ws => {
                                const isExpanded = expandedIds.has(ws.id) || searchTerm.length > 0;
                                const hasBoards = ws.boards && ws.boards.length > 0;

                                return (
                                    <div key={ws.id}>
                                        {/* Workspace Item */}
                                        <button
                                            onClick={(e) => {
                                                if (hasBoards) toggleExpand(ws.id, e);
                                                else onSelect({ id: ws.id, name: ws.name, type: 'workspace' });
                                            }}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 group text-left"
                                        >
                                            <div className="p-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                                                <Folder size={12} fill="currentColor" fillOpacity={0.2} />
                                            </div>
                                            <span className="flex-1 text-xs font-medium text-stone-700 dark:text-stone-300 truncate">
                                                {ws.name}
                                            </span>
                                            {hasBoards && (
                                                <ChevronRight
                                                    size={12}
                                                    className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                />
                                            )}
                                        </button>

                                        {/* Boards List */}
                                        {isExpanded && hasBoards && (
                                            <div className="space-y-0.5">
                                                {ws.boards?.map(board => renderBoardItem(board))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Create New UI */}
                <div className="p-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-stone-200 dark:hover:bg-stone-700/50 rounded transition-colors"
                        >
                            <Plus size={14} />
                            <span>Create new doc</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                value={newDocName}
                                onChange={e => setNewDocName(e.target.value)}
                                placeholder="Doc name..."
                                className="flex-1 min-w-0 px-2 py-1 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreateDoc();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                            />
                            <button
                                onClick={handleCreateDoc}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
                            >
                                Create
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};
