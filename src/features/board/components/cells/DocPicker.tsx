import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePopupPosition } from '../../views/Table/hooks/usePopupPosition';
import { createPortal } from 'react-dom';
import { MagnifyingGlass as Search, FileText, CircleNotch as Loader2, Plus, Link as LinkIcon } from 'phosphor-react';
import { v4 as uuidv4 } from 'uuid';
import { boardLogger } from '../../../../utils/logger';

interface BoardDoc {
    id: string;
    name: string;
    createdAt: string;
    content?: string;
}

interface DocPickerProps {
    onSelect: (doc: { id: string; name: string; type: 'doc' }) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
    current?: { id: string; name: string } | null;
    currentBoardId?: string;
}

// Helper to get docs for a board from localStorage
const getBoardDocs = (boardId: string): BoardDoc[] => {
    try {
        const stored = localStorage.getItem(`board-docs-${boardId}`);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Helper to save docs for a board
const saveBoardDocs = (boardId: string, docs: BoardDoc[]) => {
    try {
        localStorage.setItem(`board-docs-${boardId}`, JSON.stringify(docs));
    } catch (e) {
        boardLogger.error('Failed to save board docs', e);
    }
};

export const DocPicker: React.FC<DocPickerProps> = ({
    onSelect,
    onClose,
    triggerRect,
    current,
    currentBoardId
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [docs, setDocs] = useState<BoardDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const menuRef = useRef<HTMLDivElement>(null);
    const positionStyle = usePopupPosition({
        triggerRect,
        menuWidth: 280,
        menuHeight: 320,
        align: 'start'
    });

    const filteredDocs = docs.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [isCreating, setIsCreating] = useState(false);
    const [newDocName, setNewDocName] = useState('');

    // Load docs for the current board
    useEffect(() => {
        if (!currentBoardId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        // Small delay to show loading state
        const timer = setTimeout(() => {
            const boardDocs = getBoardDocs(currentBoardId);
            setDocs(boardDocs);
            setLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, [currentBoardId]);

    const handleCreateDoc = () => {
        if (!newDocName.trim() || !currentBoardId) return;

        const newDoc: BoardDoc = {
            id: uuidv4(),
            name: newDocName.trim(),
            createdAt: new Date().toISOString(),
            content: ''
        };

        // Add to board's docs
        const updatedDocs = [...docs, newDoc];
        saveBoardDocs(currentBoardId, updatedDocs);
        setDocs(updatedDocs);

        // Select the new doc
        onSelect({
            id: newDoc.id,
            name: newDoc.name,
            type: 'doc'
        });
        onClose();
    };

    const handleSelectDoc = (doc: BoardDoc) => {
        onSelect({
            id: doc.id,
            name: doc.name,
            type: 'doc'
        });
        onClose();
    };

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed w-[280px] max-w-[calc(100vw-32px)] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-[9999] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400">
                        <LinkIcon size={12} />
                        <span>Link to Doc</span>
                    </div>
                </div>

                {/* Search */}
                <div className="p-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search docs in this board..."
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-stone-800 dark:text-stone-200"
                        />
                    </div>
                </div>

                {/* Docs List */}
                <div className="flex-1 overflow-y-auto max-h-[200px] p-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-stone-400">
                            <Loader2 size={16} className="animate-spin mr-2" />
                            <span className="text-xs">Loading docs...</span>
                        </div>
                    ) : !currentBoardId ? (
                        <div className="py-4 text-center text-xs text-stone-400">
                            No board context available
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="py-4 text-center text-xs text-stone-400">
                            {searchTerm ? 'No matching docs found' : 'No docs in this board yet'}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {filteredDocs.map(doc => (
                                <button
                                    key={doc.id}
                                    onClick={() => handleSelectDoc(doc)}
                                    className={`w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 group text-left transition-colors ${current?.id === doc.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                >
                                    <div className="p-1 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shrink-0">
                                        <FileText size={12} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs text-stone-700 dark:text-stone-300 truncate block group-hover:text-stone-900 dark:group-hover:text-stone-100">
                                            {doc.name}
                                        </span>
                                        <span className="text-[10px] text-stone-400 truncate block">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {current?.id === doc.id && (
                                        <span className="text-[10px] text-blue-500 font-medium">Selected</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create New Doc */}
                <div className="p-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            disabled={!currentBoardId}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-stone-200 dark:hover:bg-stone-700/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} />
                            <span>Create new doc in this board</span>
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
                                    if (e.key === 'Escape') {
                                        setIsCreating(false);
                                        setNewDocName('');
                                    }
                                }}
                            />
                            <button
                                onClick={handleCreateDoc}
                                disabled={!newDocName.trim()}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50"
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
