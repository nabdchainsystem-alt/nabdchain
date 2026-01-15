import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Board, Task, ViewState } from '../../../types';
import {
    X, MagnifyingGlass, Kanban, CheckCircle,
    CaretRight, SquareHalf, ArrowSquareOut, Funnel, CalendarBlank, WarningCircle
} from 'phosphor-react';

interface GlobalSearchDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    boards: Board[];
    onNavigate: (view: ViewState | string, boardId?: string) => void;
}

export const GlobalSearchDrawer: React.FC<GlobalSearchDrawerProps> = ({
    isOpen,
    onClose,
    boards,
    onNavigate
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<'all' | 'boards' | 'tasks'>('all');
    const [selectedPriority, setSelectedPriority] = useState<'any' | 'High' | 'Medium' | 'Low'>('any');
    const [selectedTime, setSelectedTime] = useState<'any' | 'week' | 'overdue'>('any');

    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            setSearchQuery('');
            setSelectedType('all');
            setSelectedPriority('any');
            setSelectedTime('any');
        }
    }, [isOpen]);

    // Search Logic
    const results = useMemo(() => {
        // If no query and no filters, return empty
        if (!searchQuery.trim() && selectedType === 'all' && selectedPriority === 'any' && selectedTime === 'any') {
            return { boards: [], tasks: [] };
        }

        const query = searchQuery.toLowerCase();

        // 1. Search Boards
        let matchedBoards: Board[] = [];
        if (selectedType === 'all' || selectedType === 'boards') {
            matchedBoards = boards.filter(b =>
                b.name.toLowerCase().includes(query)
            );
        }

        // 2. Search Tasks
        let matchedTasks: (Task & { boardName: string; boardId: string })[] = [];
        if (selectedType === 'all' || selectedType === 'tasks') {
            for (const board of boards) {
                if (board.tasks) {
                    const found = board.tasks.filter(task => {
                        // Text Match
                        const textMatch = task.name.toLowerCase().includes(query) ||
                            (task.id && task.id.toLowerCase().includes(query));
                        if (!textMatch && query) return false;

                        // Priority Match
                        if (selectedPriority !== 'any' && task.priority !== selectedPriority) return false;

                        // Time Match
                        if (selectedTime === 'overdue') {
                            if (!task.date) return false;
                            const taskDate = new Date(task.date);
                            const now = new Date();
                            // Simple check: is before today?
                            if (taskDate < now && task.status !== 'Done') return true;
                            return false;
                        }
                        if (selectedTime === 'week') {
                            if (!task.date) return false;
                            const taskDate = new Date(task.date);
                            const now = new Date();
                            const nextWeek = new Date();
                            nextWeek.setDate(now.getDate() + 7);
                            return taskDate >= now && taskDate <= nextWeek;
                        }

                        return true;
                    }).map(t => ({ ...t, boardName: board.name, boardId: board.id }));

                    matchedTasks.push(...found);
                }
            }
        }

        // Limit results
        return {
            boards: matchedBoards.slice(0, 5),
            tasks: matchedTasks.slice(0, 50)
        };
    }, [searchQuery, boards, selectedType, selectedPriority, selectedTime]);



    const handleNavigateToBoard = (boardId: string) => {
        onNavigate('board', boardId);
        onClose();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex justify-end bg-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white w-full max-w-[360px] h-full shadow-2xl overflow-hidden flex flex-col border-l border-gray-100"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Header */}
                        <div className="p-5 border-b border-gray-100 flex flex-col gap-4 bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <MagnifyingGlass size={24} className="text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="flex-1 text-lg font-medium text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') onClose();
                                    }}
                                />
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Filters Toolbar */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Type Filter */}
                                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                    <button
                                        onClick={() => setSelectedType('all')}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${selectedType === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setSelectedType('boards')}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${selectedType === 'boards' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Boards
                                    </button>
                                    <button
                                        onClick={() => setSelectedType('tasks')}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${selectedType === 'tasks' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Tasks
                                    </button>
                                </div>

                                <div className="w-px h-4 bg-gray-200 mx-1"></div>

                                {/* Priority Filter */}
                                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                    <button
                                        onClick={() => setSelectedPriority(prev => prev === 'High' ? 'any' : 'High')}
                                        className={`p-1.5 rounded-md transition-all ${selectedPriority === 'High' ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="High Priority Only"
                                    >
                                        <WarningCircle size={14} weight={selectedPriority === 'High' ? 'fill' : 'regular'} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedPriority(prev => prev === 'Medium' ? 'any' : 'Medium')}
                                        className={`p-1.5 rounded-md transition-all ${selectedPriority === 'Medium' ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="Medium Priority Only"
                                    >
                                        <WarningCircle size={14} weight={selectedPriority === 'Medium' ? 'fill' : 'regular'} />
                                    </button>
                                </div>

                                <div className="w-px h-4 bg-gray-200 mx-1"></div>

                                {/* Time Filter */}
                                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                    <button
                                        onClick={() => setSelectedTime(prev => prev === 'week' ? 'any' : 'week')}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${selectedTime === 'week' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        This Week
                                    </button>
                                    <button
                                        onClick={() => setSelectedTime(prev => prev === 'overdue' ? 'any' : 'overdue')}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${selectedTime === 'overdue' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Overdue
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results Area */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-5 custom-scrollbar">
                            {/* Empty State */}
                            {!searchQuery && selectedType === 'all' && selectedPriority === 'any' && selectedTime === 'any' && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <MagnifyingGlass size={48} weight="thin" className="mb-3 text-gray-300" />
                                    <p className="text-sm font-medium">Type to search</p>
                                </div>
                            )}

                            {/* No Results */}
                            {(searchQuery || selectedType !== 'all' || selectedPriority !== 'any' || selectedTime !== 'any') && results.boards.length === 0 && results.tasks.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Funnel size={32} weight="light" className="mb-2 opacity-50" />
                                    <p className="text-sm">No results match your filters</p>
                                </div>
                            )}

                            {/* Boards Results */}
                            {results.boards.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Kanban size={14} />
                                        Boards
                                    </h3>
                                    <div className="space-y-2">
                                        {results.boards.map(board => (
                                            <button
                                                key={board.id}
                                                onClick={() => handleNavigateToBoard(board.id)}
                                                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                                                    <SquareHalf size={16} weight="duotone" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">{board.name}</h4>
                                                    <p className="text-[10px] text-gray-500">{board.tasks?.length || 0} tasks</p>
                                                </div>
                                                <ArrowSquareOut size={16} className="text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tasks Results */}
                            {results.tasks.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <CheckCircle size={14} />
                                        Tasks
                                    </h3>
                                    <div className="space-y-2">
                                        {results.tasks.map(task => (
                                            <button
                                                key={task.id}
                                                onClick={() => handleNavigateToBoard(task.boardId)}
                                                className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:bg-blue-50/50 hover:border-blue-100 transition-all text-left group"
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-orange-400' : 'bg-green-400'}`} />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-700">{task.name}</h4>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <span className="font-medium text-gray-600 truncate">{task.boardName}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span>{task.status || 'No Status'}</span>
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 shrink-0">
                                                    {task.date && (
                                                        <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{task.date}</span>
                                                    )}
                                                </div>
                                                <CaretRight size={14} className="text-gray-300 group-hover:text-blue-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-[10px] text-gray-400 flex items-center justify-between shrink-0">
                            <span><kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-sans">ESC</kbd> to close</span>
                            <span>{results.tasks.length + results.boards.length} matches</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
